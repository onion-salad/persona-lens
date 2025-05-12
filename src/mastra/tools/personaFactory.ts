import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// ダミー: Supabase保存関数
async function savePersonaToSupabase(persona: any) {
  // TODO: Supabase連携実装
  console.log("[Supabase] persona saved:", persona);
}

// 入力スキーマ定義 (zod)
const personaInputSchema = z.object({
  personas: z.array(z.object({
    industry: z.string(),
    role: z.string(),
    company_size: z.string(),
    region: z.string(),
    decision_power: z.string(),
  }))
});

// 出力スキーマ定義 (zod)
const personaOutputSchema = z.object({
  status: z.string(),
  count: z.number(),
});

export const personaFactory = createTool({
  id: "personaFactory",
  description: "B2B属性リストからAIペルソナ詳細情報を生成し、Supabaseに保存するツール",
  inputSchema: personaInputSchema,
  outputSchema: personaOutputSchema,
  execute: async (input) => {
    const { personas } = input; // zodでパースされたinputから取得
    // 各ペルソナの詳細情報を生成（AIでプロフィール生成）
    for (const attr of personas) {
      // 名前やプロフィールをAIで生成（ここではダミー）
      const persona = {
        ...attr,
        name: `${attr.region}の${attr.company_size}${attr.role}`,
        profile: `${attr.industry}業界の${attr.role}（${attr.company_size}、${attr.region}、意思決定権:${attr.decision_power}）`
      };
      await savePersonaToSupabase(persona);
    }
    return { status: "ok", count: personas.length };
  },
  // createToolの場合、modelオプションは不要なことが多い
}); 