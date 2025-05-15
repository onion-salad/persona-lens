import { createTool, type ToolExecutionContext } from "@mastra/core/tools";
import { z } from "zod";
import { supabase } from "../../lib/supabase/client";
import { openai } from "@ai-sdk/openai";

// Enumのな型定義
type PersonaType = 'business_professional' | 'general_consumer' | 'specific_role' | 'custom';
type AgeGroup = 'child' | 'teenager' | '20s' | '30s' | '40s' | '50s' | '60s' | '70s_and_above';
type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | 'other';
type LocationType = 'urban' | 'suburban' | 'rural';
type TechnologyLiteracy = 'high' | 'medium' | 'low';

// 更新された PersonaAttributes 型
type PersonaAttributes = {
  id: string;
  created_at: string;
  updated_at: string;

  name?: string;
  persona_type?: PersonaType;
  description_by_ai?: string;

  // 一般消費者向け属性
  age_group?: AgeGroup;
  gender?: Gender;
  occupation_category?: string;
  interests?: string[];
  lifestyle?: string;
  family_structure?: string;
  location_type?: LocationType;
  values_and_priorities?: string[];
  technology_literacy?: TechnologyLiteracy;

  // ビジネス専門家向け属性 (nullableに変更)
  title?: string;
  industry?: string;
  position?: string;
  company?: string;
  company_size?: string;
  region?: string;
  expertise?: any; // jsonb
  background?: any; // jsonb
  personality?: any; // jsonb
  decision_making_style?: string;

  // カスタム属性
  custom_attributes?: any; // jsonb
};

export const personaResponderInputSchema = z.object({
  persona_id: z.string().uuid(),
  question: z.string(),
});

export const personaResponderOutputSchema = z.object({
  persona_id: z.string().uuid(),
  answer: z.string(),
  persona_name: z.string().optional(),
  attributes: z.any().optional(),
});

// Supabaseからペルソナ情報を取得
async function fetchPersona(persona_id: string): Promise<PersonaAttributes | null> {
  console.log(`[Supabase] Fetching persona with ID: ${persona_id}`);
  const { data, error } = await supabase
    .from('expert_personas')
    .select('*')
    .eq('id', persona_id)
    .single();
  if (error) {
    console.error('[Supabase] Error fetching persona (raw error object):', JSON.stringify(error, null, 2));
    return null;
  }
  return data;
}

// プロンプト生成
function buildPrompt(persona: PersonaAttributes, question: string): string {
  // persona_type に応じてプロンプトの基本形を変えることも可能
  let personaDescription = `あなたは以下の属性を持つ人物です。\n`;
  personaDescription += `ペルソナタイプ: ${persona.persona_type ?? 'custom'}\n`;
  if (persona.name) personaDescription += `名前: ${persona.name}\n`;
  if (persona.description_by_ai) personaDescription += `AIによる概要: ${persona.description_by_ai}\n`;

  // 一般消費者向け情報
  if (persona.age_group) personaDescription += `年齢層: ${persona.age_group}\n`;
  if (persona.gender) personaDescription += `性別: ${persona.gender}\n`;
  if (persona.occupation_category) personaDescription += `職業分類: ${persona.occupation_category}\n`;
  if (persona.interests && persona.interests.length > 0) personaDescription += `興味関心: ${persona.interests.join(', ')}\n`;
  if (persona.lifestyle) personaDescription += `ライフスタイル: ${persona.lifestyle}\n`;
  if (persona.family_structure) personaDescription += `家族構成: ${persona.family_structure}\n`;
  if (persona.location_type) personaDescription += `居住地タイプ: ${persona.location_type}\n`;
  if (persona.values_and_priorities && persona.values_and_priorities.length > 0) personaDescription += `価値観・優先事項: ${persona.values_and_priorities.join(', ')}\n`;
  if (persona.technology_literacy) personaDescription += `テクノロジーリテラシー: ${persona.technology_literacy}\n`;

  // ビジネス専門家向け情報
  if (persona.title) personaDescription += `役職: ${persona.title}\n`;
  if (persona.industry) personaDescription += `業種: ${persona.industry}\n`;
  if (persona.position) personaDescription += `職位・役割: ${persona.position}\n`;
  if (persona.company) personaDescription += `会社名: ${persona.company}\n`;
  if (persona.company_size) personaDescription += `企業規模: ${persona.company_size}\n`;
  if (persona.decision_making_style) personaDescription += `意思決定スタイル: ${persona.decision_making_style}\n`;

  // 共通・詳細情報
  if (persona.region) personaDescription += `地域: ${persona.region}\n`;
  if (persona.expertise) personaDescription += `専門分野: ${typeof persona.expertise === 'string' ? persona.expertise : JSON.stringify(persona.expertise)}\n`;
  if (persona.background) personaDescription += `経歴: ${typeof persona.background === 'string' ? persona.background : JSON.stringify(persona.background)}\n`;
  if (persona.personality) personaDescription += `性格特徴: ${typeof persona.personality === 'string' ? persona.personality : JSON.stringify(persona.personality)}\n`;
  if (persona.custom_attributes) personaDescription += `カスタム属性: ${typeof persona.custom_attributes === 'string' ? persona.custom_attributes : JSON.stringify(persona.custom_attributes)}\n`;

  return `${personaDescription}\nユーザーからの質問: ${question}\n\n上記の人物として、専門的かつ分かりやすく日本語で回答してください。`;
}

export const personaResponder = createTool({
  id: "personaResponder",
  description: "指定したペルソナIDの属性を元に、GPT APIでそのペルソナとして質問に回答するツール。",
  inputSchema: personaResponderInputSchema,
  outputSchema: personaResponderOutputSchema,
  execute: async (input: ToolExecutionContext<typeof personaResponderInputSchema>) => {
    console.log("\n--- personaResponder Tool Execution Start ---");
    console.log("Received input (personaResponder execute):", JSON.stringify(input, null, 2));

    const persona_id = input.context.persona_id;
    const question = input.context.question;

    console.log(`[personaResponder ID: ${persona_id}] Extracted persona_id and question.`);

    if (!persona_id) {
      console.error(`[personaResponder ID: ${persona_id}] Persona ID is missing.`);
      throw new Error(`Persona not found for id: ${persona_id}`);
    }
    const persona = await fetchPersona(persona_id);
    if (!persona) {
      console.error(`[personaResponder ID: ${persona_id}] Persona not found in Supabase.`);
      throw new Error(`Persona not found for id: ${persona_id}`);
    }
    console.log(`[personaResponder ID: ${persona_id}] Successfully fetched persona from Supabase:`, persona.name);
    
    const prompt = buildPrompt(persona, question);
    console.log(`[personaResponder ID: ${persona_id}] Built prompt for LLM.`);
    
    // GPT API呼び出し
    const model = openai("gpt-4o");
    console.log(`[personaResponder ID: ${persona_id}] Calling LLM (gpt-4o)...`);
    const result = await model.doGenerate({
      prompt: [
        { role: "user", content: [{ type: "text", text: prompt }] }
      ],
      inputFormat: "messages",
      mode: { type: "regular" },
    });
    console.log(`[personaResponder ID: ${persona_id}] LLM call completed.`);
    const answer = result.text || "回答生成に失敗しました。";
    console.log(`[personaResponder ID: ${persona_id}] Generated answer: ${answer.substring(0, 50)}...`); // 回答の冒頭のみログ出力
    
    const output = {
      persona_id,
      answer,
      persona_name: persona.name,
      attributes: persona,
    };
    console.log(`[personaResponder ID: ${persona_id}] Returning output.`);
    return output;
  },
}); 