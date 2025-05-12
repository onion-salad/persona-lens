import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// ダミー: Supabase保存関数
async function savePersonaToSupabase(persona: any) {
  // TODO: Supabase連携実装
  console.log("[Supabase] persona saved:", persona);
}

// 入力スキーマ定義 (zod)
// context オブジェクトをスキーマに含める
const personaInputSchema = z.object({
  context: z.object({ // contextプロパティを追加
      personas: z.array(z.object({
        industry: z.string(),
        role: z.string(),
        company_size: z.string(),
        region: z.string(),
        decision_power: z.string(),
      }))
  }).optional(), // agentによってはcontextを使わない場合もあるためoptionalにするか、呼び出し元で保証する
   // もし agent が直接 {personas: [...]} を渡す場合、これも許容するなら union type などを使う
   // 今回は orchestratorAgent が context 経由で渡すことを前提とする
   personas: z.array(z.object({ // contextがない場合の直接的なpersonasも許容する場合（今回はorchestratorがcontext経由前提なのでコメントアウト）
    // industry: z.string(),
    // role: z.string(),
    // company_size: z.string(),
    // region: z.string(),
    // decision_power: z.string(),
   })).optional(),
});

// 出力スキーマ定義 (zod)
const personaOutputSchema = z.object({
  status: z.string(),
  count: z.number(),
});

export const personaFactory = createTool({
  id: "personaFactory",
  description: "B2B属性リストからAIペルソナ詳細情報を生成し、Supabaseに保存するツール",
  inputSchema: personaInputSchema, // zod スキーマでバリデーション
  outputSchema: personaOutputSchema,
  execute: async (input) => {
    console.log("\n--- personaFactory Tool Execution Start ---");
    // input は zod スキーマでバリデーション済みと仮定
    // zodスキーマでcontextを必須にしていない場合は、存在チェックが必要
    console.log("Received validated input:", JSON.stringify(input, null, 2));

    // context経由か直接かを判断（orchestratorはcontext経由前提）
    const personas = input?.context?.personas;

    if (!personas || !Array.isArray(personas)) {
      console.error("Invalid input: 'personas' array not found in input.context or is not an array.", input);
      throw new Error("Invalid input: 'personas' array not found in input.context or is not an array.");
    }

    console.log(`Processing ${personas.length} personas...`);

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
    console.log("--- personaFactory Tool Execution End ---\n");
    return { status: "ok", count: personas.length };
  },
  // createToolの場合、modelオプションは不要なことが多い
}); 