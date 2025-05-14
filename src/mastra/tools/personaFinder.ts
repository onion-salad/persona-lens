import { Tool } from '@mastra/core';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { personaAttributeSchema } from './personaFactory'; // personaFactoryからインポート

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

// personaFinderツールの入力スキーマ
const finderInputSchema = z.object({
  query: z.string().optional().describe('ユーザーの質問や検索したいキーワード'),
  desired_attributes: partialPersonaAttributeSchema
    .optional()
    .describe('理想とするペルソナの属性（部分的な指定も可）'),
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
        '指定された条件（キーワードや属性）に基づいて、既存のペルソナをデータベースから検索します。',
      inputSchema: finderInputSchema,
      outputSchema: finderOutputSchema,
    });
  }

  public execute = async (
    input: PersonaFinderToolInput
  ): Promise<z.infer<typeof finderOutputSchema>> => {
    try {
      const { query, desired_attributes } = input.context;

      console.log('[PersonaFinderTool] Input:', input.context);

      let supabaseQuery = supabase.from('expert_personas').select('*');

      // desired_attributes に基づくフィルタリング
      if (desired_attributes) {
        for (const [key, value] of Object.entries(desired_attributes)) {
          if (value !== undefined && value !== null && value !== '') {
            // ZodスキーマのキーとDBのカラム名が一致している前提
            // text型, varchar型などのカラムは ilike で部分一致検索、それ以外は eq で完全一致
            // persona_type のようなenum的なものは eq が適切
            // interests のような配列型は contains や overlaps を使う必要があるが、まずは単純なケースに対応
            if (['persona_name', 'expertise', 'responsibilities', 'description', 'background', 'target_audience_description', 'communication_style', 'notes', 'company_name', 'industry_tags', 'skills', 'tools_technologies', 'certifications_licenses', 'publications_works', 'awards_recognitions', 'interests', 'values_beliefs', 'lifestyle_focus', 'preferred_communication_channels', 'online_behavior', 'content_preferences', 'brand_affinities'].includes(key) && typeof value === 'string') {
              supabaseQuery = supabaseQuery.ilike(key, `%${value}%`);
            } else if (key === 'tags' && Array.isArray(value) && value.length > 0) {
              // tags は text[] 型を想定。 overlaps を使用
              supabaseQuery = supabaseQuery.overlaps(key, value);
            }
            else {
              supabaseQuery = supabaseQuery.eq(key, value);
            }
          }
        }
      }

      // query 文字列に基づくキーワード検索
      // description, expertise, persona_name, responsibilities を対象とする
      if (query) {
        const searchQuery = `%${query}%`;
        supabaseQuery = supabaseQuery.or(
          `persona_name.ilike.${searchQuery},description.ilike.${searchQuery},expertise.ilike.${searchQuery},responsibilities.ilike.${searchQuery}`
        );
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error(
          '[PersonaFinderTool] Supabaseからのデータ取得エラー:',
          error
        );
        throw new Error(
          `Supabaseからのペルソナ検索中にエラーが発生しました: ${error.message}`
        );
      }

      console.log('[PersonaFinderTool] Found personas raw:', data);

      // Supabaseからのデータは personaAttributeSchema に合うように整形・パースが必要な場合がある
      // 特に、DBのカラム名とスキーマのプロパティ名が異なる場合や、型の変換が必要な場合
      // ここでは、カラム名とプロパティ名が一致し、型も互換性があると仮定する
      const validatedPersonas = (data || []).map((persona) => {
        try {
          return personaAttributeSchema.parse(persona);
        } catch (validationError) {
          console.warn(`[PersonaFinderTool] 取得したペルソナデータの検証に失敗しました (ID: ${persona.id}):`, validationError);
          // 検証に失敗したデータは除外するか、エラーとして扱うか選択
          // ここでは null を返して後でフィルタリングする
          return null;
        }
      }).filter(p => p !== null) as z.infer<typeof personaAttributeSchema>[];


      console.log('[PersonaFinderTool] Validated personas:', validatedPersonas);

      return { found_personas: validatedPersonas };
    } catch (error) {
      console.error('[PersonaFinderTool] 実行時エラー:', error);
      let errorMessage = 'PersonaFinderToolの実行中に予期せぬエラーが発生しました。';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage += `: ${error}`;
      }
      // MastraのToolErrorクラスなどがあればそれを使うことを検討
      throw new Error(errorMessage);
    }
  };
}

export default new PersonaFinderTool(); 