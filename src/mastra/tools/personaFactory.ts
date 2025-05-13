import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { supabase } from "../../lib/supabase/client"; // Supabaseクライアントをインポート

// 入力スキーマ定義 (zod) - expert_personasテーブルの主要なカラムに対応
const personaAttributeSchema = z.object({
  name: z.string().optional(), // 名前はAIが生成することも考慮しoptional
  title: z.string(), // 役職
  company: z.string().optional(), // 会社名
  industry: z.string(), // 業種
  position: z.string(), // 職位・役割
  company_size: z.string().optional(), // 企業規模
  region: z.string().optional(), // 地域
  // expertise, background, personality, decision_making_style は一旦固定値 or 簡易生成
});

const personaFactoryInputSchema = z.object({
  context: z.object({
    personas_attributes: z.array(personaAttributeSchema) // 属性の配列
  }).optional(),
  personas_attributes: z.array(personaAttributeSchema).optional(), // 直接渡される場合
});

// 出力スキーマ定義 (zod)
const personaFactoryOutputSchema = z.object({
  status: z.string(),
  count: z.number(),
  persona_ids: z.array(z.string()), // 作成されたペルソナのIDリスト
});

// Supabase保存関数
async function savePersonaToSupabase(personaData: z.infer<typeof personaAttributeSchema>) {
  const { data, error } = await supabase
    .from('expert_personas')
    .insert([
      {
        name: personaData.name || `${personaData.region || '不明地域'}の${personaData.company_size || '不明規模'}の${personaData.position}`, // 名前がなければ簡易生成
        title: personaData.title,
        company: personaData.company,
        industry: personaData.industry,
        position: personaData.position,
        company_size: personaData.company_size,
        region: personaData.region,
        expertise: { skills: ["交渉", "戦略立案"], experience_years: 10 }, // ダミー
        background: { education: "MBA", work_history: "大手IT企業でのマネージャー経験" }, // ダミー
        personality: { type: "分析的", communication: "直接的" }, // ダミー
        decision_making_style: "データ駆動型、合議を重視", // ダミー
      },
    ])
    .select('id') // 挿入されたレコードのIDを取得
    .single(); // 1件のみ挿入・取得

  if (error) {
    console.error("[Supabase] Error saving persona:", error);
    throw new Error(`Failed to save persona to Supabase: ${error.message}`);
  }
  console.log("[Supabase] Persona saved:", data);
  return data.id; // 保存されたペルソナのIDを返す
}

export const personaFactory = createTool({
  id: "personaFactory",
  description: "B2Bペルソナ属性から詳細情報を生成し、Supabaseのexpert_personasテーブルに保存するツール。",
  inputSchema: personaFactoryInputSchema,
  outputSchema: personaFactoryOutputSchema,
  execute: async (input) => {
    console.log("\\n--- personaFactory Tool Execution Start ---");
    console.log("Received validated input:", JSON.stringify(input, null, 2));

    const attributesList = input?.context?.personas_attributes || input?.personas_attributes;

    if (!attributesList || !Array.isArray(attributesList) || attributesList.length === 0) {
      console.error("Invalid input: 'personas_attributes' array not found or is empty.", input);
      throw new Error("Invalid input: 'personas_attributes' array not found or is empty.");
    }

    console.log(`Processing ${attributesList.length} persona attributes...`);
    const createdPersonaIds: string[] = [];

    for (const attr of attributesList) {
      // ここでAIを使ってexpertise, background, personalityなどをよりリッチに生成することも可能
      // MVPでは入力された属性とダミーデータで保存
      try {
        const personaId = await savePersonaToSupabase(attr);
        createdPersonaIds.push(personaId);
      } catch (error) {
        console.error(`Failed to process and save persona with attributes: ${JSON.stringify(attr)}`, error);
        // エラーが発生しても処理を継続するか、ここでエラーを投げて停止するかは要件による
        // 今回はエラーが発生した場合は全体を失敗させる
        throw error;
      }
    }

    console.log("--- personaFactory Tool Execution End ---\\n");
    return { status: "ok", count: createdPersonaIds.length, persona_ids: createdPersonaIds };
  },
}); 