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
  additional_notes: z.string().nullable().optional(),

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
  custom_attributes: z.record(z.string(), z.any()).nullable().optional(),
  update_mode: z.enum(['ai_assisted_update', 'direct_update']).optional(),
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
function buildPersonaProfilePrompt(
  attr: z.infer<typeof personaAttributeSchema>, // これは常に「目標とする属性セット」
  isUpdateMode: boolean = false,
  existingPersonaForContext?: Partial<z.infer<typeof personaAttributeSchema>> // 更新時のコンテキスト用
): string {
  const commonOutputRequirements = `
【出力要件】
- name: 日本人らしい自然な氏名（もし入力のname属性が空の場合）。入力にnameがあればそれを優先。
- expertise: 専門分野、スキル、関連する経験年数など（JSON形式で構造化して）
- background: 学歴、職歴、受賞歴、関連する資格など（JSON形式で構造化して）
- personality: 性格特性、価値観、コミュニケーションの傾向など（JSON形式で構造化して）
- decision_making_style: 意思決定の際の傾向やスタイル（例: データ駆動型、直感的、協調型など）
- description_by_ai: 上記の情報を総合し、この人物がどのような人物であるかを詳細かつ具体的に記述した自然な日本語の文章。最大300字程度。これは必ず提供してください。

【出力形式】
以下のJSON形式で詳細なプロフィールを生成してください。この形式以外のテキストは絶対に含めないでください。
{
  "name": "...",
  "expertise": {"skills": [...], "experience_years": "...", /* その他関連情報 */},
  "background": {"education": "...", "work_history": "...", /* その他関連情報 */},
  "personality": {"primary_trait": "...", "communication_style": "...", /* その他関連情報 */},
  "decision_making_style": "...",
  "description_by_ai": "..."
}`;

  const providedAttributesList = Object.entries(attr)
    .map(([key, value]) => {
      if (key === 'id' || key === 'update_mode') return null; // これらはプロンプトに含めない
      if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) return null;
      if (Array.isArray(value)) {
        return value.length > 0 ? `- ${key}: ${value.join(', ')}` : null;
      }
      if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0) {
         if (key === 'custom_attributes') {
           const customAttrsString = Object.entries(value)
             .map(([ck, cv]) => `  - ${ck}: ${typeof cv === 'object' ? JSON.stringify(cv) : cv}`)
             .join('\\n');
           return `- ${key}:\\n${customAttrsString}`;
         }
         return `- ${key}: ${JSON.stringify(value)}`;
      }
      if (typeof value === 'string') {
        return `- ${key}: ${value}`;
      }
      return null;
    })
    .filter(Boolean);

  const providedAttributesForPrompt = providedAttributesList.length > 0
    ? providedAttributesList.join('\\n')
    : '属性情報は提供されていません。';

  const ethicalConsideration = attr.custom_attributes
    ? "\\n\\n【重要: 倫理的配慮】\\ncustom_attributesには機密情報が含まれる可能性があります。これらの情報を扱う際はプライバシーを尊重し、差別や偏見を助長しないよう注意してください。プロフィールでは、これらの情報を直接的・露骨に表現せず、人物の特性として抽象的かつ配慮のある形で言及してください。"
    : "";

  let profileInstructions: string;

  if (isUpdateMode && existingPersonaForContext) {
    const existingContextString = Object.entries(existingPersonaForContext)
      .filter(([key, value]) => value !== undefined && value !== null && !['id', 'created_at', 'updated_at', 'update_mode'].includes(key))
      .map(([key, value]) => `- ${key} (既存): ${typeof value === 'object' ? JSON.stringify(value) : value}`)
      .join('\\n');

    profileInstructions = `あなたは既存ペルソナの情報を更新する専門家です。
以下のペルソナについて、提供された「目標とする属性セット」に基づいて、特に「description_by_ai」を再生成してください。
また、「expertise」「background」「personality」「decision_making_style」といったAI管理項目も、「目標とする属性セット」と矛盾がないように調整・生成してください。

【既存ペルソナの主な情報 (参考)】
${existingContextString || '既存情報なし'}

【目標とする属性セット (今回適用する内容)】
${providedAttributesForPrompt}
${ethicalConsideration}

AIの主なタスクは、「目標とする属性セット」を完全に反映した「description_by_ai」を生成することです。
その他のAI管理項目（name, expertise, background, personality, decision_making_style）も、ユーザーが「目標とする属性セット」内で値を指定していればそれを最優先とし、指定がない場合はAIが適切に補完・生成してください。
最終的な出力は上記の【出力形式】に従ってください。nameはユーザー指定があればそれを尊重してください。`;

  } else {
    // 新規作成モード
    profileInstructions = `あなたは以下の属性情報を持つ人物の詳細なペルソナを設計する専門家です。
【提供された属性】
${providedAttributesForPrompt}
${ethicalConsideration}

上記の属性情報を最大限に活かし、一貫性のある詳細な人物像を日本語で設計してください。
特に、提供された属性情報から推測される専門性、性格、背景、価値観、意思決定のスタイル、そして人物の包括的な特徴を深掘りし、上記の【出力要件】と【出力形式】に従って情報を生成してください。
additional_notes や custom_attributes も重要な情報源です。`;
  }
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

// Supabase更新関数 (新設)
async function updatePersonaInSupabase(id: string, dataToUpdate: Partial<Omit<z.infer<typeof personaAttributeSchema>, 'id' | 'update_mode'>>) {
  console.log(`[Supabase] Updating persona ${id} with data:`, dataToUpdate);
  const { data, error } = await supabase
    .from('expert_personas')
    .update(dataToUpdate)
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    console.error(`[Supabase] Error updating persona ${id}:`, error);
    throw new Error(`Failed to update persona ${id} in Supabase: ${error.message}`);
  }
  console.log(`[Supabase] Persona ${id} updated:`, data);
  return data.id;
}

export const personaFactory = createTool({
  id: "personaFactory",
  description: "ペルソナの基本属性からAIで詳細情報を生成・更新し、Supabaseのexpert_personasテーブルに保存/更新するツール。",
  inputSchema: personaFactoryInputSchema,
  outputSchema: personaFactoryOutputSchema,
  execute: async (input: ToolExecutionContext<typeof personaFactoryInputSchema>) => {
    console.log("\\n--- personaFactory Tool Execution Start ---");
    console.log("Received input (personaFactory execute):", JSON.stringify(input.context, null, 2));

    const attributesList = input.context.personas_attributes;

    if (!attributesList || !Array.isArray(attributesList) || attributesList.length === 0) {
      console.error("Invalid input: 'personas_attributes' array not found or is empty.", input.context);
      throw new Error("Invalid input: 'personas_attributes' array not found or is empty.");
    }

    const createdOrUpdatedPersonaIds: string[] = [];

    for (const currentAttr of attributesList) {
      const personaIdToUpdate = currentAttr.id;
      // DBに送るデータからはidとupdate_modeを除外する準備
      const { id: _id, update_mode: rawUpdateMode, ...attributesToProcess } = currentAttr;

      if (personaIdToUpdate) {
        // ----- 更新処理 -----
        const updateMode = rawUpdateMode || 'ai_assisted_update'; // デフォルトはAI支援更新
        console.log(`[personaFactory] Updating persona ID: ${personaIdToUpdate} with mode: ${updateMode}`);

        if (updateMode === 'direct_update') {
          console.log(`[personaFactory] Direct update for persona ID: ${personaIdToUpdate}`);
          try {
            // attributesToProcess には currentAttr から id と update_mode を除いたものが入っている
            const updatedId = await updatePersonaInSupabase(personaIdToUpdate, attributesToProcess);
            createdOrUpdatedPersonaIds.push(updatedId);
          } catch (error) {
            console.error(`[personaFactory] Error during direct update for ${personaIdToUpdate}:`, error);
            // 失敗しても処理を続けるか、ここで投げるか。今回は続ける。
          }
        } else { // ai_assisted_update
          console.log(`[personaFactory] AI-assisted update for persona ID: ${personaIdToUpdate}`);
          try {
            const { data: existingPersona, error: fetchError } = await supabase
              .from('expert_personas')
              .select('*') // 全カラムを取得してコンテキストとして使用
              .eq('id', personaIdToUpdate)
              .single();

            if (fetchError || !existingPersona) {
              console.error(`[personaFactory] Failed to fetch existing persona ${personaIdToUpdate} for update:`, fetchError);
              throw new Error(`既存ペルソナ(ID: ${personaIdToUpdate})の取得に失敗しました。`);
            }
            
            // currentAttr が目標とする属性セット
            const prompt = buildPersonaProfilePrompt(currentAttr, true, existingPersona);
            const model = openai("gpt-4o"); // モデルは適宜調整
            const result = await model.doGenerate({
              prompt: [{ role: "user", content: [{ type: "text", text: prompt }] }],
              inputFormat: "messages",
              mode: { type: "regular" },
            });
            
            let profileFromAI;
            try {
              let text = result.text || "{}";
              text = text.replace(/```json|```/g, "").trim();
              profileFromAI = JSON.parse(text);
            } catch (e) {
              console.error("[personaFactory] AI出力のJSONパースに失敗 (update):", result.text, e);
              throw new Error("AI出力がJSON形式ではありませんでした (update)");
            }

            // 最終的な更新データ: attributesToProcess (ユーザー指定) をベースに、AI生成項目をマージ
            const finalDataToUpdate: Partial<Omit<z.infer<typeof personaAttributeSchema>, 'id' | 'update_mode'>> = {
              ...attributesToProcess, // ユーザーが明示的に指定した属性変更
              name: attributesToProcess.name ?? profileFromAI.name ?? existingPersona.name, // ユーザー指定 > AI生成 > 既存
              expertise: attributesToProcess.expertise ?? profileFromAI.expertise ?? existingPersona.expertise,
              background: attributesToProcess.background ?? profileFromAI.background ?? existingPersona.background,
              personality: attributesToProcess.personality ?? profileFromAI.personality ?? existingPersona.personality,
              decision_making_style: attributesToProcess.decision_making_style ?? profileFromAI.decision_making_style ?? existingPersona.decision_making_style,
              description_by_ai: profileFromAI.description_by_ai, // AIによる説明はAIからの出力を使用
              // persona_type や additional_notes など、attributesToProcess に含まれていればそれが使われる
            };
             // undefinedのプロパティを削除して、不必要な上書きを防ぐ
            Object.keys(finalDataToUpdate).forEach(key => {
              if (finalDataToUpdate[key as keyof typeof finalDataToUpdate] === undefined) {
                delete finalDataToUpdate[key as keyof typeof finalDataToUpdate];
              }
            });

            const updatedId = await updatePersonaInSupabase(personaIdToUpdate, finalDataToUpdate);
            createdOrUpdatedPersonaIds.push(updatedId);

          } catch (error) {
            console.error(`[personaFactory] Error during AI-assisted update for ${personaIdToUpdate}:`, error);
          }
        }
      } else {
        // ----- 新規作成処理 -----
        console.log("[personaFactory] Creating new persona with attributes:", JSON.stringify(currentAttr, null, 2));
        try {
          // currentAttr が新規作成の属性セット
          const prompt = buildPersonaProfilePrompt(currentAttr, false);
          const model = openai("gpt-4o"); // モデルは適宜調整
          const result = await model.doGenerate({
            prompt: [{ role: "user", content: [{ type: "text", text: prompt }] }],
            inputFormat: "messages",
            mode: { type: "regular" },
          });

          let profileFromAI;
          try {
            let text = result.text || "{}";
            text = text.replace(/```json|```/g, "").trim();
            profileFromAI = JSON.parse(text);
          } catch (e) {
            console.error("[personaFactory] AI出力のJSONパースに失敗 (create):", result.text, e);
            throw new Error("AI出力がJSON形式ではありませんでした (create)");
          }
          
          // DB保存用データ: attributesToProcess (ユーザー指定) をベースに、AI生成項目をマージ
          const personaDataForSave: z.infer<typeof personaAttributeSchema> = {
            ...attributesToProcess, // id, update_mode が除かれたもの
            name: attributesToProcess.name ?? profileFromAI.name, // ユーザー指定 > AI生成
            expertise: profileFromAI.expertise,
            background: profileFromAI.background,
            personality: profileFromAI.personality,
            decision_making_style: profileFromAI.decision_making_style,
            description_by_ai: profileFromAI.description_by_ai,
            // persona_type, additional_notes などは attributesToProcess に含まれていればそれが使われる
            // id, update_mode は明示的に undefined または含めない
          };
          // schemaに厳密に合わせるため、不要な可能性のある id, update_mode を削除 (attributesToProcess時点で除去されているが念のため)
          delete (personaDataForSave as any).id;
          delete (personaDataForSave as any).update_mode;


          const newPersonaId = await savePersonaToSupabase(personaDataForSave);
          createdOrUpdatedPersonaIds.push(newPersonaId);
        } catch (error) {
          console.error(`[personaFactory] Error during new persona creation:`, error);
        }
      }
    }

    console.log("[personaFactory] Created or Updated persona IDs:", JSON.stringify(createdOrUpdatedPersonaIds, null, 2));
    console.log("--- personaFactory Tool Execution End ---\\n");
    return { status: "ok", count: createdOrUpdatedPersonaIds.length, persona_ids: createdOrUpdatedPersonaIds };
  },
}); 