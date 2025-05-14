import { createTool, type ToolExecutionContext } from "@mastra/core/tools";
import { z } from "zod";
import { supabase } from "../../lib/supabase/client";
import { openai } from "@ai-sdk/openai";

// 入力スキーマ
type PersonaAttributes = {
  name?: string;
  title: string;
  company?: string;
  industry: string;
  position: string;
  company_size?: string;
  region?: string;
  expertise?: any;
  background?: any;
  personality?: any;
  decision_making_style?: string;
};

const personaResponderInputSchema = z.object({
  persona_id: z.string().uuid(),
  question: z.string(),
});

const personaResponderOutputSchema = z.object({
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
  return `あなたは以下の属性を持つ専門家です。\n\n- 名前: ${persona.name ?? '不明'}\n- 役職: ${persona.title}\n- 業種: ${persona.industry}\n- 会社: ${persona.company ?? '不明'}\n- 職位: ${persona.position}\n- 企業規模: ${persona.company_size ?? '不明'}\n- 地域: ${persona.region ?? '不明'}\n- 専門分野: ${JSON.stringify(persona.expertise) ?? '不明'}\n- 経歴: ${JSON.stringify(persona.background) ?? '不明'}\n- 性格: ${JSON.stringify(persona.personality) ?? '不明'}\n- 意思決定スタイル: ${persona.decision_making_style ?? '不明'}\n\nユーザーからの質問: ${question}\n\nこの専門家として、専門的かつ分かりやすく日本語で回答してください。`;
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

    console.log(`[personaResponder] Extracted persona_id: ${persona_id}, question: ${question}`);

    if (!persona_id) {
      throw new Error(`Persona not found for id: ${persona_id}`);
    }
    const persona = await fetchPersona(persona_id);
    if (!persona) {
      throw new Error(`Persona not found for id: ${persona_id}`);
    }
    const prompt = buildPrompt(persona, question);
    // GPT API呼び出し
    const model = openai("gpt-4o");
    const result = await model.doGenerate({
      prompt: [
        { role: "user", content: [{ type: "text", text: prompt }] }
      ],
      inputFormat: "messages",
      mode: { type: "regular" },
    });
    const answer = result.text || "回答生成に失敗しました。";
    return {
      persona_id,
      answer,
      persona_name: persona.name,
      attributes: persona,
    };
  },
}); 