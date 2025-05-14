import { createTool, type ToolExecutionContext } from "@mastra/core/tools";
import { z } from "zod";
import { supabase } from "../../lib/supabase/client";
import { openai } from "@ai-sdk/openai";

// 更新された personaAttributeSchema
export const personaAttributeSchema = z.object({
  name: z.string().optional(),
  persona_type: z.enum(['business_professional', 'general_consumer', 'specific_role', 'custom']).optional().default('custom'),
  description_by_ai: z.string().optional(),

  // 一般消費者向け属性
  age_group: z.enum(['child', 'teenager', '20s', '30s', '40s', '50s', '60s', '70s_and_above']).optional(),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say', 'other']).optional(),
  occupation_category: z.string().optional(),
  interests: z.array(z.string()).optional(),
  lifestyle: z.string().optional(),
  family_structure: z.string().optional(),
  location_type: z.enum(['urban', 'suburban', 'rural']).optional(),
  values_and_priorities: z.array(z.string()).optional(),
  technology_literacy: z.enum(['high', 'medium', 'low']).optional(),

  // ビジネス専門家向け属性
  title: z.string().optional(),
  industry: z.string().optional(),
  position: z.string().optional(),
  company: z.string().optional(),
  company_size: z.string().optional(),
  region: z.string().optional(),
  expertise: z.any().optional(),
  background: z.any().optional(),
  personality: z.any().optional(),
  decision_making_style: z.string().optional(),

  // カスタム属性
  custom_attributes: z.any().optional(),
});

export const personaFactoryInputSchema = z.object({
  personas_attributes: z.array(personaAttributeSchema).min(1)
});

export const personaFactoryOutputSchema = z.object({
  status: z.string(),
  count: z.number(),
  persona_ids: z.array(z.string()),
});

// AIで詳細プロフィールを生成するプロンプト (改修後)
function buildPersonaProfilePrompt(attr: z.infer<typeof personaAttributeSchema>): string {
  let profileInstructions = "";
  const commonOutputRequirements = `
【出力要件】
- name: 日本人らしい自然な氏名（もし入力のname属性が空の場合）。入力にnameがあればそれを優先。
- expertise: 専門分野、スキル、関連する経験年数など（JSON形式で構造化して）
- background: 学歴、職歴、受賞歴、関連する資格など（JSON形式で構造化して）
- personality: 性格特性、価値観、コミュニケーションの傾向など（JSON形式で構造化して）
- decision_making_style: 意思決定の際の傾向やスタイル（例: データ駆動型、直感的、協調型など）

【出力形式】
以下のJSON形式で詳細なプロフィールを生成してください。この形式以外のテキストは絶対に含めないでください。
{
  "name": "...", // 入力されたnameを尊重、なければ生成
  "expertise": {"skills": ["...", "..."], "experience_years": "...", ...},
  "background": {"education": "...", "work_history": "...", ...},
  "personality": {"primary_trait": "...", "communication_style": "...", ...},
  "decision_making_style": "..."
}`;

  switch (attr.persona_type) {
    case 'business_professional':
      profileInstructions = `あなたは以下の属性を持つビジネスプロフェッショナルの詳細なペルソナを設計する専門家です。
【基本属性】
- 役職: ${attr.title ?? '未設定'}
- 業種: ${attr.industry ?? '未設定'}
- 職位・役割: ${attr.position ?? '未設定'}
- 会社名: ${attr.company ?? '任意'}
- 企業規模: ${attr.company_size ?? '任意'}
- 地域: ${attr.region ?? '任意'}
${attr.description_by_ai ? `- AIによる概要: ${attr.description_by_ai}\n` : ''}
上記の基本属性に基づき、リアリティのある詳細な人物像を日本語で設計してください。特に、その役職・業種における専門性、職務経歴、意思決定の特性が明確になるように情報を補ってください。`;
      break;
    case 'general_consumer':
      profileInstructions = `あなたは以下の属性を持つ一般消費者の詳細なペルソナを設計する専門家です。
【基本属性】
- 年齢層: ${attr.age_group ?? '未設定'}
- 性別: ${attr.gender ?? '未設定'}
- 職業分類: ${attr.occupation_category ?? '未設定'}
- 興味関心: ${attr.interests?.join(', ') ?? '未設定'}
- ライフスタイル: ${attr.lifestyle ?? '未設定'}
- 家族構成: ${attr.family_structure ?? '未設定'}
- 地域: ${attr.region ?? '任意'}
${attr.description_by_ai ? `- AIによる概要: ${attr.description_by_ai}\n` : ''}
上記の基本属性に基づき、リアリティのある詳細な人物像を日本語で設計してください。特に、そのライフスタイルや価値観、消費行動に影響を与えそうな性格特性が明確になるように情報を補ってください。`;
      break;
    case 'specific_role':
      profileInstructions = `あなたは以下の属性を持つ特定の役割の人物の詳細なペルソナを設計する専門家です。
【基本属性】
- 役割・専門性: ${attr.title ?? (attr.occupation_category ?? '特定の役割')}
- 関連する業種・分野: ${attr.industry ?? '未設定'}
- 年齢層: ${attr.age_group ?? '任意'}
- 性別: ${attr.gender ?? '任意'}
- 地域: ${attr.region ?? '任意'}
${attr.description_by_ai ? `- AIによる概要: ${attr.description_by_ai}\n` : ''}
上記の基本属性と役割に基づき、リアリティのある詳細な人物像を日本語で設計してください。その役割を果たす上で重要となる経験、スキル、考え方などが明確になるように情報を補ってください。`;
      break;
    default: // 'custom' or undefined
      profileInstructions = `あなたは以下の属性を持つカスタムペルソナの詳細な設計を行う専門家です。
【提供された属性】
${Object.entries(attr).map(([key, value]) => value ? `- ${key}: ${Array.isArray(value) ? value.join(', ') : value}` : null).filter(Boolean).join('\n')}
これらの属性情報を最大限に活かし、一貫性のある詳細な人物像を日本語で設計してください。特に、提供された属性情報から推測される専門性、性格、背景を深掘りしてください。`;
  }
  return `${profileInstructions}\n${commonOutputRequirements}`;
}

// Supabase保存関数
async function savePersonaToSupabase(personaData: z.infer<typeof personaAttributeSchema>) {
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
  description: "ペルソナの基本属性からAIで詳細情報を生成し、Supabaseのexpert_personasテーブルに保存するツール。",
  inputSchema: personaFactoryInputSchema,
  outputSchema: personaFactoryOutputSchema,
  execute: async (input: ToolExecutionContext<typeof personaFactoryInputSchema>) => {
    console.log("\n--- personaFactory Tool Execution Start ---");
    console.log("Received input (personaFactory execute):", JSON.stringify(input, null, 2));

    const attributesList = input.context.personas_attributes;

    if (!attributesList || !Array.isArray(attributesList) || attributesList.length === 0) {
      console.error("Invalid input: 'personas_attributes' array not found or is empty within input.context.", input);
      throw new Error("Invalid input: 'personas_attributes' array not found or is empty within input.context.");
    }

    console.log(`Processing ${attributesList.length} persona attributes...`);
    const createdPersonaIds: string[] = [];

    for (const attr of attributesList) {
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
      // DB保存用データを組み立て (改修後)
      const personaData = {
        ...attr,
        name: profile.name ?? attr.name,
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
        // エラーメッセージをより具体的にする
        let errorMessage = `ペルソナの処理および保存に失敗しました (属性: ${JSON.stringify(attr)})`;
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        } else if (typeof error === 'string') {
          errorMessage += `: ${error}`;
        }
        // 必要であれば、ここでカスタムエラーオブジェクトを投げることも検討
        throw new Error(errorMessage);
      }
    }

    console.log("[personaFactory] Created persona IDs:", JSON.stringify(createdPersonaIds, null, 2));
    console.log("--- personaFactory Tool Execution End ---\n");
    return { status: "ok", count: createdPersonaIds.length, persona_ids: createdPersonaIds };
  },
}); 