import { createTool, type ToolExecutionContext } from "@mastra/core/tools";
import { z } from "zod";
import { supabase } from "../../lib/supabase/client";
import { openai } from "@ai-sdk/openai";

// 更新された personaAttributeSchema
export const personaAttributeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().optional(),
  persona_type: z.string().optional(),
  description_by_ai: z.string().optional(),
  additional_notes: z.string().optional(), // 追加

  // 一般消費者向け属性
  age_group: z.string().optional(),
  gender: z.string().optional(),
  occupation_category: z.string().optional(),
  interests: z.array(z.string()).optional(),
  lifestyle: z.string().optional(),
  family_structure: z.string().optional(),
  location_type: z.string().optional(),
  values_and_priorities: z.array(z.string()).optional(),
  technology_literacy: z.string().optional(),

  // ビジネス専門家向け属性
  title: z.string().optional(),
  industry: z.string().optional(),
  position: z.string().optional(),
  company: z.string().optional(),
  company_size: z.string().optional(),
  region: z.string().optional(),
  expertise: z.record(z.string(), z.any()).optional(),
  background: z.record(z.string(), z.any()).optional(),
  personality: z.record(z.string(), z.any()).optional(),
  decision_making_style: z.string().optional(),

  // カスタム属性 (遺伝情報、健康状態、資産状況などを含むことを想定)
  custom_attributes: z.record(z.string(), z.any()).optional(),
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
  const commonOutputRequirements = `
【出力要件】
- name: 日本人らしい自然な氏名（もし入力のname属性が空の場合）。入力にnameがあればそれを優先。
- expertise: 専門分野、スキル、関連する経験年数など（JSON形式で構造化して）
- background: 学歴、職歴、受賞歴、関連する資格など（JSON形式で構造化して）
- personality: 性格特性、価値観、コミュニケーションの傾向など（JSON形式で構造化して）
- decision_making_style: 意思決定の際の傾向やスタイル（例: データ駆動型、直感的、協調型など）
- description_by_ai: 上記の情報を総合し、この人物がどのような人物であるかを詳細かつ具体的に記述した自然な日本語の文章。最大300字程度。

【出力形式】
以下のJSON形式で詳細なプロフィールを生成してください。この形式以外のテキストは絶対に含めないでください。
{
  "name": "...", // 入力されたnameを尊重、なければ生成
  "expertise": {"skills": [...], "experience_years": "...", /* その他関連情報 */},
  "background": {"education": "...", "work_history": "...", /* その他関連情報 */},
  "personality": {"primary_trait": "...", "communication_style": "...", /* その他関連情報 */},
  "decision_making_style": "...",
  "description_by_ai": "..." // AIによるペルソナの包括的な説明文
}`;

  // 自由記述された属性情報を整形してプロンプトに含める
  const providedAttributesList = Object.entries(attr)
    .map(([key, value]) => {
      if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) return null;
      if (Array.isArray(value)) {
        return value.length > 0 ? `- ${key}: ${value.join(', ')}` : null;
      }
      if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0) {
         // custom_attributes の場合、その内容をより丁寧に扱う
         if (key === 'custom_attributes') {
           const customAttrsString = Object.entries(value)
             .map(([ck, cv]) => `  - ${ck}: ${typeof cv === 'object' ? JSON.stringify(cv) : cv}`)
             .join('\\n');
           return `- ${key}:\\n${customAttrsString}`;
         }
         return `- ${key}: ${JSON.stringify(value)}`;
      }
      if (typeof value === 'string') { // 空文字列チェックは最初に行ったのでここでは不要
        return `- ${key}: ${value}`;
      }
      return null;
    })
    .filter(Boolean);
  
  const providedAttributes = providedAttributesList.length > 0 
    ? providedAttributesList.join('\\n')
    : '属性情報は提供されていませんが、一般的な人物像を想像して作成してください。';

  const ethicalConsideration = attr.custom_attributes 
    ? "\\n\\n【重要: 倫理的配慮】\\ncustom_attributesには遺伝情報、健康状態、資産状況などの機密情報が含まれる可能性があります。これらの情報を扱う際は、個人のプライバシーを尊重し、差別や偏見を助長しないよう最大限の注意を払ってください。生成されるプロフィールでは、これらの情報を直接的・露骨に表現するのではなく、人物の背景や特性として、より抽象的かつ配慮のある形で言及するに留めてください。"
    : "";

  const profileInstructions = `あなたは以下の属性情報を持つ人物の詳細なペルソナを設計する専門家です。
【提供された属性】
${providedAttributes}
${ethicalConsideration}

上記の属性情報を最大限に活かし、一貫性のある詳細な人物像を日本語で設計してください。
特に、提供された属性情報（custom_attributes内の機微情報やadditional_notesを含む）から推測される専門性、性格、背景、価値観、意思決定のスタイル、そして人物の包括的な特徴を深掘りし、上記の【出力要件】と【出力形式】に従って情報を生成してください。
additional_notes はユーザーによる追記情報であり、重要なヒントとなる可能性があります。
custom_attributes には、その人物のより個人的な側面が含まれている場合があります。これらを統合して、より人間味のある、深みのあるペルソナ像を構築してください。`;

  return `${profileInstructions}\\n${commonOutputRequirements}`;
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
    console.log("\\n--- personaFactory Tool Execution Start ---");
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
        ...attr, // 入力された全属性をまず展開
        name: profile.name ?? attr.name,
        expertise: profile.expertise,
        background: profile.background,
        personality: profile.personality,
        decision_making_style: profile.decision_making_style,
        description_by_ai: profile.description_by_ai, // AIによる説明も保存
        // additional_notes は attr からそのまま渡される
        // custom_attributes も attr からそのまま渡される
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
    console.log("--- personaFactory Tool Execution End ---\\n");
    return { status: "ok", count: createdPersonaIds.length, persona_ids: createdPersonaIds };
  },
}); 