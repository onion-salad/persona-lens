import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { supabase } from "../../lib/supabase/client";
import { openai } from "@ai-sdk/openai";

// 入力スキーマ定義 (zod) - expert_personasテーブルの主要なカラムに対応
const personaAttributeSchema = z.object({
  name: z.string().optional(), // 名前はAIが生成することも考慮しoptional
  title: z.string(), // 役職
  company: z.string().optional(), // 会社名
  industry: z.string(), // 業種
  position: z.string(), // 職位・役割
  company_size: z.string().optional(), // 企業規模
  region: z.string().optional(), // 地域
});

const personaFactoryInputSchema = z.object({
  context: z.object({
    personas_attributes: z.array(personaAttributeSchema) // 属性の配列
  }).optional(),
  personas_attributes: z.array(personaAttributeSchema).optional(), // 直接渡される場合
});

const personaFactoryOutputSchema = z.object({
  status: z.string(),
  count: z.number(),
  persona_ids: z.array(z.string()), // 作成されたペルソナのIDリスト
});

// AIで詳細プロフィールを生成するプロンプト
function buildPersonaProfilePrompt(attr: any): string {
  return `あなたはペルソナ設計のプロフェッショナルです。以下の属性を持つB2B専門家の詳細な人物像を日本語で設計してください。

【属性】
- 役職: ${attr.title}
- 業種: ${attr.industry}
- 職位: ${attr.position}
- 会社名: ${attr.company ?? "（任意）"}
- 企業規模: ${attr.company_size ?? "（任意）"}
- 地域: ${attr.region ?? "（任意）"}

【出力要件】
- name: 本名風の日本人名
- expertise: その業種・役職・職位にふさわしい専門分野やスキル、経験年数（JSON形式）
- background: 学歴・職歴・受賞歴などの経歴（JSON形式）
- personality: 性格・価値観・コミュニケーションスタイル（JSON形式）
- decision_making_style: 意思決定スタイル（例: データ重視、合議制、トップダウン等）

【出力形式】
以下のJSON形式で出力してください。他のテキストは一切含めないでください。
{
  "name": "...",
  "expertise": {"skills": [...], "experience_years": ...},
  "background": {"education": "...", "work_history": "...", "awards": "..."},
  "personality": {"type": "...", "values": [...], "communication": "..."},
  "decision_making_style": "..."
}`;
}

// Supabase保存関数
async function savePersonaToSupabase(personaData: any) {
  const { data, error } = await supabase
    .from('expert_personas')
    .insert([
      personaData
    ])
    .select('id')
    .single();
  if (error) {
    console.error("[Supabase] Error saving persona:", error);
    throw new Error(`Failed to save persona to Supabase: ${error.message}`);
  }
  console.log("[Supabase] Persona saved:", data);
  return data.id;
}

export const personaFactory = createTool({
  id: "personaFactory",
  description: "B2Bペルソナ属性からAIで詳細情報を生成し、Supabaseのexpert_personasテーブルに保存するツール。",
  inputSchema: personaFactoryInputSchema,
  outputSchema: personaFactoryOutputSchema,
  execute: async (input) => {
    console.log("\n--- personaFactory Tool Execution Start ---");
    console.log("Received validated input:", JSON.stringify(input, null, 2));

    const attributesList = input?.context?.personas_attributes || input?.personas_attributes;

    if (!attributesList || !Array.isArray(attributesList) || attributesList.length === 0) {
      console.error("Invalid input: 'personas_attributes' array not found or is empty.", input);
      throw new Error("Invalid input: 'personas_attributes' array not found or is empty.");
    }

    console.log(`Processing ${attributesList.length} persona attributes...`);
    const createdPersonaIds: string[] = [];

    for (const attr of attributesList) {
      // AIで詳細プロフィールを生成
      const prompt = buildPersonaProfilePrompt(attr);
      const model = openai("gpt-4o");
      const result = await model.doGenerate({
        prompt: [
          { role: "user", content: [{ type: "text", text: prompt }] }
        ],
        inputFormat: "messages",
        mode: { type: "regular" },
      });
      let profile;
      try {
        let text = result.text || "{}";
        text = text.replace(/```json|```/g, "").trim();
        profile = JSON.parse(text);
      } catch (e) {
        console.error("[personaFactory] AI出力のJSONパースに失敗:", result.text);
        throw new Error("AI出力がJSON形式ではありませんでした");
      }
      // DB保存用データを組み立て
      const personaData = {
        ...attr,
        name: profile.name,
        expertise: profile.expertise,
        background: profile.background,
        personality: profile.personality,
        decision_making_style: profile.decision_making_style,
      };
      try {
        const personaId = await savePersonaToSupabase(personaData);
        createdPersonaIds.push(personaId);
      } catch (error) {
        console.error(`Failed to process and save persona with attributes: ${JSON.stringify(attr)}`, error);
        throw error;
      }
    }

    console.log("--- personaFactory Tool Execution End ---\n");
    return { status: "ok", count: createdPersonaIds.length, persona_ids: createdPersonaIds };
  },
}); 