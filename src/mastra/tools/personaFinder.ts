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
      operation_type: z.enum(['include', 'exclude']).default('include').optional().describe('操作タイプ (include: この条件を含む, exclude: この条件を除外する)')
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
      // 部分一致包含検索の結果を格納するIDリスト
      let idsForPartialMatchFilter: string[] | null = null;
      // 部分一致配列除外検索の結果、除外すべきIDを格納するSet
      const idsToExcludeFromPartialArrayMatch = new Set<string>();

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
              const arrayTypeFields = ['interests', 'values_and_priorities']; 
              const operation = search.operation_type || 'include'; // default 'include'

              if (arrayTypeFields.includes(search.field)) { // 配列フィールド
                if (operation === 'include') {
                  if (search.match_type === 'partial' && keyword) {
                    console.log(`[PersonaFinderTool] Performing RPC call for partial INCLUDE on field '${search.field}' with keyword '${keyword}'`);
                    const { data: rpcData, error: rpcError } = await supabase.rpc(
                      'get_ids_by_array_partial_match',
                      { p_field_name: search.field, p_keyword: keyword }
                    );
                    if (rpcError) {
                      console.error(`[PersonaFinderTool] RPC call for field '${search.field}' (for inclusion) failed:`, rpcError);
                      idsForPartialMatchFilter = []; 
                    } else {
                      const currentIds = (rpcData || []).map((r: { id: string }) => r.id);
                      if (idsForPartialMatchFilter === null) {
                        idsForPartialMatchFilter = currentIds;
                      } else {
                        idsForPartialMatchFilter = idsForPartialMatchFilter.filter(idVal => currentIds.includes(idVal));
                      }
                      if (idsForPartialMatchFilter.length === 0) {
                        console.log(`[PersonaFinderTool] After intersection for field '${search.field}', no IDs remain for partial include.`);
                      }
                    }
                  } else if (search.match_type === 'exact' && keyword) { // 配列型の完全一致包含
                    supabaseQuery = supabaseQuery.contains(search.field, [keyword]);
                  }
                } else { // operation === 'exclude'
                  if (search.match_type === 'partial' && keyword) {
                    console.log(`[PersonaFinderTool] Performing RPC call for partial EXCLUDE on field '${search.field}' with keyword '${keyword}'`);
                    const { data: rpcData, error: rpcError } = await supabase.rpc(
                      'get_ids_by_array_partial_match', // 「含む」IDを取得するRPCを再利用
                      { p_field_name: search.field, p_keyword: keyword }
                    );
                    if (rpcError) {
                      console.error(`[PersonaFinderTool] RPC call for field '${search.field}' (for exclusion) failed:`, rpcError);
                    } else {
                      const idsContainingKeyword = (rpcData || []).map((r: { id: string }) => r.id);
                      idsContainingKeyword.forEach(id => idsToExcludeFromPartialArrayMatch.add(id));
                      console.log(`[PersonaFinderTool] IDs containing '${keyword}' in '${search.field}' (for exclusion): ${idsContainingKeyword.length} found.`);
                    }
                  } else if (search.match_type === 'exact' && keyword) { // 配列型の完全一致除外
                    supabaseQuery = supabaseQuery.not(search.field, 'cs', `{${keyword}}`); 
                  }
                }
              } else { // 非配列型カラム (テキストフィールドなど)
                const searchKeywordFormatted = search.match_type === 'exact' ? keyword : `%${keyword}%`;
                const operator = search.match_type === 'exact' ? 'eq' : 'ilike';
                if (operation === 'include') {
                  supabaseQuery = supabaseQuery[operator](search.field, searchKeywordFormatted);
                } else { // operation === 'exclude'
                  supabaseQuery = supabaseQuery.not(search.field, operator, searchKeywordFormatted);
                }
              }
            }
          }
        }
        
        // targeted_keyword_searches ループの後、各種IDフィルタを適用
        // 1. 部分一致包含フィルタ (idsForPartialMatchFilter)
        if (idsForPartialMatchFilter !== null) {
            if (idsForPartialMatchFilter.length === 0) {
                console.log("[PersonaFinderTool] No IDs found from partial match include searches, forcing empty result for this path.");
                supabaseQuery = supabaseQuery.eq('id', '00000000-0000-0000-0000-000000000000'); 
            } else {
                console.log(`[PersonaFinderTool] Applying IN filter for partial match include IDs: ${idsForPartialMatchFilter.length} IDs.`);
                supabaseQuery = supabaseQuery.in('id', idsForPartialMatchFilter);
            }
        }

        // 2. 部分一致配列除外フィルタ (idsToExcludeFromPartialArrayMatch)
        if (idsToExcludeFromPartialArrayMatch.size > 0) {
          const excludeIdList = Array.from(idsToExcludeFromPartialArrayMatch);
          console.log(`[PersonaFinderTool] Applying NOT IN filter for partial array exclusion: ${excludeIdList.length} IDs.`);
          supabaseQuery = supabaseQuery.not('id', 'in', excludeIdList);
        }

        // 3. 汎用的な query によるキーワード検索
        if (query && query.trim() !== '') {
          const trimmedQuery = query.trim();
          const searchQueryString = `%${trimmedQuery}%`;
          const defaultSearchFields = [
            'name', 'persona_type', 'description_by_ai', 'additional_notes',
            'title', 'industry', 'position', 'company',
            'age_group', 'gender', 'occupation_category', 'lifestyle', 'decision_making_style'
          ];
          const fieldsToSearch = search_target_fields && search_target_fields.length > 0
            ? search_target_fields
            : defaultSearchFields;

          const knownArrayTypeFields = ['interests', 'values_and_priorities']; 

          const textSearchFields = fieldsToSearch.filter(
            field => field.trim() !== '' && !knownArrayTypeFields.includes(field)
          );
          const arraySearchFieldsToRpc = fieldsToSearch.filter(
            field => field.trim() !== '' && knownArrayTypeFields.includes(field)
          );

          let orFilterConditions: string[] = [];

          // テキストフィールドのOR条件部分
          if (textSearchFields.length > 0) {
            orFilterConditions.push(
              textSearchFields.map(field => `${field}.ilike.${searchQueryString}`).join(',')
            );
          }

          // 配列フィールドのOR条件部分 (RPC呼び出しとIN句)
          if (arraySearchFieldsToRpc.length > 0) {
            const idsFromRpcForGenericQuery = new Set<string>();
            for (const arrField of arraySearchFieldsToRpc) {
              try {
                console.log(`[PersonaFinderTool] Generic query: Calling RPC for array field '${arrField}' with keyword '${trimmedQuery}'`);
                const { data: rpcData, error: rpcError } = await supabase.rpc(
                  'get_ids_by_array_partial_match',
                  { p_field_name: arrField, p_keyword: trimmedQuery }
                );
                if (rpcError) {
                  console.error(`[PersonaFinderTool] Generic query: RPC call for field '${arrField}' with keyword '${trimmedQuery}' failed:`, rpcError);
                } else {
                  (rpcData || []).forEach((r: { id: string }) => idsFromRpcForGenericQuery.add(r.id));
                }
              } catch (e) {
                 console.error(`[PersonaFinderTool] Generic query: Exception during RPC call for field '${arrField}' with keyword '${trimmedQuery}':`, e);
              }
            }
            if (idsFromRpcForGenericQuery.size > 0) {
              // Supabaseの .or() はカンマ区切りの "column.operator.value" 文字列を期待する。
              // id.in.(uuid1,uuid2) の形式は直接サポートされない場合がある。
              // そのため、取得したIDで IN 句を構成し、それを orFilterConditions の一つとして加えるのではなく、
              // 既存のsupabaseQueryに対して、これらのIDに合致するものを OR で追加する形で対応する方が安全かもしれない。
              // しかし、ここではまず .or() に渡す文字列として整形してみる。
              // id.in.(value1,value2) 形式を試す。
              orFilterConditions.push(`id.in.(${Array.from(idsFromRpcForGenericQuery).join(',')})`);
            }
          }
          
          const finalOrQueryString = orFilterConditions.filter(s => s.length > 0).join(',');
          if (finalOrQueryString) {
              console.log("[PersonaFinderTool] Applying generic OR conditions string:", finalOrQueryString);
              supabaseQuery = supabaseQuery.or(finalOrQueryString);
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