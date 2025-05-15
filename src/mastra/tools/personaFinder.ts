import { Tool } from '@mastra/core/tools';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { personaAttributeSchema } from './personaFactory'; // personaFactoryからインポート

console.log('DEBUG: SUPABASE_URL in personaFinder:', process.env.SUPABASE_URL);
console.log('DEBUG: SUPABASE_SERVICE_KEY in personaFinder:', process.env.SUPABASE_SERVICE_KEY ? 'Loaded' : 'NOT LOADED');

// Supabaseクライアントの初期化（環境変数から設定を読み込む）
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase URLまたはService Keyが環境変数に設定されていません。'
  );
}
const supabase = createClient(supabaseUrl, supabaseKey);

// personaAttributeSchema のすべてのキーをオプショナルにしたスキーマを作成
const partialPersonaAttributeSchema = personaAttributeSchema.partial();

// personaFinderツールの入力スキーマ (改修)
const finderInputSchema = z.object({
  id: z.string().uuid().optional().describe('検索対象のペルソナID (指定された場合、他の条件より優先)'),
  query: z.string().optional().describe('汎用的な検索キーワード。複数の主要テキストフィールドを対象に部分一致検索。'),
  search_target_fields: z.array(z.string()).optional().describe('汎用queryの検索対象とするフィールド名のリスト。指定がなければデフォルトのフィールド群を検索。'),
  desired_attributes: partialPersonaAttributeSchema
    .optional()
    .describe('理想とするペルソナの属性。指定された属性と値でフィルタリング（文字列は部分一致、他は完全一致）。'),
  targeted_keyword_searches: z.array(
    z.object({
      field: z.string().describe('検索対象のDBカラム名'),
      keyword: z.string().describe('そのフィールドで検索するキーワード'),
      match_type: z.enum(['exact', 'partial']).default('partial').optional().describe('検索タイプ (exact: 完全一致, partial: 部分一致)'),
    })
  ).optional().describe('特定のフィールドを指定したキーワード検索のリスト。'),
});

// personaFinderツールの出力スキーマ
const finderOutputSchema = z.object({
  found_personas: z
    .array(personaAttributeSchema)
    .describe('検索条件に合致したペルソナのリスト'),
});

// executeメソッドのinputの型を定義
type PersonaFinderToolInput = {
  context: z.infer<typeof finderInputSchema>;
  // createToolのドキュメントに基づき、runtimeContextやabortSignalも必要に応じて追加検討
  // runtimeContext?: any;
  // abortSignal?: AbortSignal;
};

export class PersonaFinderTool extends Tool<
  typeof finderInputSchema,
  typeof finderOutputSchema
> {
  constructor() {
    super({
      id: 'persona_finder',
      description:
        '指定された条件（ID、キーワード、属性、特定フィールドのキーワード）に基づいて、既存のペルソナをデータベースから検索します。',
      inputSchema: finderInputSchema,
      outputSchema: finderOutputSchema,
    });
  }

  public execute = async (
    input: PersonaFinderToolInput
  ): Promise<z.infer<typeof finderOutputSchema>> => {
    try {
      const { id, query, search_target_fields, desired_attributes, targeted_keyword_searches } = input.context;
      console.log('[PersonaFinderTool] Input:', input.context);

      let supabaseQuery = supabase.from('expert_personas').select('*');
      // 部分一致検索の結果を格納するIDリスト
      let idsForPartialMatchFilter: string[] | null = null;

      if (id) {
        supabaseQuery = supabaseQuery.eq('id', id);
      } else {
        // 1. desired_attributes によるフィルタリング
        if (desired_attributes) {
          for (const [key, value] of Object.entries(desired_attributes)) {
            if (value !== undefined && value !== null && (typeof value !== 'string' || value.trim() !== '')) {
              const schemaKey = key as keyof z.infer<typeof partialPersonaAttributeSchema>;
              if (['name', 'title', 'company', 'industry', 'position', 'company_size', 'region', 'persona_type', 'description_by_ai', 'age_group', 'gender', 'occupation_category', 'lifestyle', 'family_structure', 'location_type', 'technology_literacy', 'decision_making_style', 'additional_notes'].includes(schemaKey) && typeof value === 'string') {
                 supabaseQuery = supabaseQuery.ilike(schemaKey, `%${value}%`);
              } else if (['interests', 'values_and_priorities'].includes(schemaKey) && Array.isArray(value) && value.length > 0) {
                 // desired_attributes での配列型は現状 'overlaps' (いずれかを含む) のまま。部分一致は targeted_keyword_searches で対応
                 supabaseQuery = supabaseQuery.overlaps(schemaKey, value as string[]);
              } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                console.warn(`[PersonaFinderTool] Filtering by complex object/JSONB field '${schemaKey}' via desired_attributes might not work as expected without specific handling.`);
              } else if (value !== undefined) { 
                 supabaseQuery = supabaseQuery.eq(schemaKey, value);
              }
            }
          }
        }

        // 2. targeted_keyword_searches によるフィルタリング
        if (targeted_keyword_searches && targeted_keyword_searches.length > 0) {
          for (const search of targeted_keyword_searches) {
            if (search.keyword && search.keyword.trim() !== '') {
              const keyword = search.keyword.trim();
              const arrayTypeFields = ['interests', 'values_and_priorities']; // 他の配列型カラムがあれば追加

              if (arrayTypeFields.includes(search.field)) {
                if (search.match_type === 'partial' && keyword) {
                  console.log(`[PersonaFinderTool] Performing RPC call for partial match on field '${search.field}' with keyword '${keyword}'`);
                  const { data: rpcData, error: rpcError } = await supabase.rpc(
                    'get_ids_by_array_partial_match',
                    { p_field_name: search.field, p_keyword: keyword }
                  );

                  if (rpcError) {
                    console.error(`[PersonaFinderTool] RPC call for field '${search.field}' with keyword '${keyword}' failed:`, rpcError);
                    // RPCエラーの場合、このフィールドの検索ではIDが見つからなかったものとして扱う
                    // 積集合の結果、全体としてもIDが見つからないようにするため、idsForPartialMatchFilter を空配列にする
                    idsForPartialMatchFilter = []; 
                  } else {
                    const currentIds = (rpcData || []).map((r: { id: string }) => r.id);
                    console.log(`[PersonaFinderTool] RPC call for field '${search.field}' returned ${currentIds.length} IDs.`);
                    if (idsForPartialMatchFilter === null) {
                      // 最初の部分一致検索の結果
                      idsForPartialMatchFilter = currentIds;
                    } else {
                      // 既存のIDリストとの積集合を取る
                      idsForPartialMatchFilter = idsForPartialMatchFilter.filter(idVal => currentIds.includes(idVal));
                    }
                    // 積集合の結果、該当IDが0になったら、それ以上RPCを呼び出す必要はないかもしれないが、
                    // 他の targeted_keyword_searches の非配列条件はまだ適用する必要があるためループは続ける
                    if (idsForPartialMatchFilter.length === 0) {
                        console.log(`[PersonaFinderTool] After intersection with field '${search.field}', no IDs remain for partial match.`);
                    }
                  }
                } else if (search.match_type === 'exact' && keyword) { // 配列型の完全一致
                  supabaseQuery = supabaseQuery.contains(search.field, [keyword]);
                } else if (!keyword && search.match_type === 'partial') {
                  // キーワードが空の場合は何もしない
                }

              } else { // 非配列型カラムの場合
                const searchKeywordFormatted = search.match_type === 'exact' ? keyword : `%${keyword}%`;
                const operator = search.match_type === 'exact' ? 'eq' : 'ilike';
                supabaseQuery = supabaseQuery[operator](search.field, searchKeywordFormatted);
              }
            }
          }
        }
        
        // targeted_keyword_searches ループの後、idsForPartialMatchFilter を適用
        if (idsForPartialMatchFilter !== null) {
            if (idsForPartialMatchFilter.length === 0) {
                // 部分一致検索の結果、適合するIDが一つもなかった場合
                // またはRPCエラーで空になった場合
                // 確実に結果が0件になるように、存在しないIDでフィルタする
                console.log("[PersonaFinderTool] No IDs found from partial match searches, forcing empty result.");
                supabaseQuery = supabaseQuery.eq('id', '00000000-0000-0000-0000-000000000000'); 
            } else {
                console.log(`[PersonaFinderTool] Applying IN filter for partial match IDs: ${idsForPartialMatchFilter.length} IDs.`);
                supabaseQuery = supabaseQuery.in('id', idsForPartialMatchFilter);
            }
        }

        // 3. 汎用的な query によるキーワード検索
        if (query && query.trim() !== '') {
          const searchQueryString = `%${query.trim()}%`;
          const defaultSearchFields = [
            'name', 'persona_type', 'description_by_ai', 'additional_notes',
            'title', 'industry', 'position', 'company',
            'age_group', 'gender', 'occupation_category', 'lifestyle', 'decision_making_style'
          ];
          const fieldsToSearch = search_target_fields && search_target_fields.length > 0
            ? search_target_fields
            : defaultSearchFields;

          const orConditions = fieldsToSearch
            .filter(field => field.trim() !== '') 
            .map(field => `${field}.ilike.${searchQueryString}`)
            .join(',');
          
          if (orConditions) {
              supabaseQuery = supabaseQuery.or(orConditions);
          }
        }
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('[PersonaFinderTool] Supabaseからのデータ取得エラー:', error);
        throw new Error(`Supabaseからのペルソナ検索中にエラーが発生しました: ${error.message}`);
      }

      console.log('[PersonaFinderTool] Found personas raw:', data ? data.length : 0);

      const validatedPersonas = (data || []).map((persona) => {
        try {
          return personaAttributeSchema.parse(persona);
        } catch (validationError) {
          console.warn(`[PersonaFinderTool] 取得したペルソナデータの検証に失敗しました (ID: ${persona.id}):`, validationError);
          return null;
        }
      }).filter(p => p !== null) as z.infer<typeof personaAttributeSchema>[];

      console.log('[PersonaFinderTool] Validated personas:', validatedPersonas.length);
      return { found_personas: validatedPersonas };

    } catch (error) {
      console.error('[PersonaFinderTool] 実行時エラー:', error);
      let errorMessage = 'PersonaFinderToolの実行中に予期せぬエラーが発生しました。';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage += `: ${error}`;
      }
      throw new Error(errorMessage);
    }
  };
}

export default new PersonaFinderTool(); 