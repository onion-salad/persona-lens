import { createTool, type ToolExecutionContext } from "@mastra/core/tools";
import { z } from "zod";
import { supabase } from "../../lib/supabase/client";
import { openai } from "@ai-sdk/openai";
import { personaAttributeSchema, buildPersonaProfilePrompt } from "./personaFactory";

// 入力スキーマ
// 更新する属性は personaAttributeSchema の部分集合とし、id は除外
const personaUpdatePayloadSchema = personaAttributeSchema.partial().omit({ id: true });

export const personaUpdaterInputSchema = z.object({
  persona_id: z.string().uuid().describe("更新対象のペルソナID"),
  update_attributes: personaUpdatePayloadSchema.describe("更新する属性情報。一部の属性のみ指定可能。"),
  force_regenerate_description: z.boolean().optional().default(false).describe("AIによる説明文(description_by_ai)を強制的に再生成するかどうか")
});

// 出力スキーマ
export const personaUpdaterOutputSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
  updated_persona_id: z.string().uuid().optional(),
});

export const personaUpdater = createTool({
  id: "personaUpdater",
  description: "指定されたIDの既存ペルソナの情報を更新し、必要に応じてAIによる説明文(description_by_ai)を再生成するツール。",
  inputSchema: personaUpdaterInputSchema,
  outputSchema: personaUpdaterOutputSchema,
  execute: async (input: ToolExecutionContext<typeof personaUpdaterInputSchema>) => {
    console.log("\\n--- personaUpdater Tool Execution Start ---");
    console.log("Received input (personaUpdater execute):", JSON.stringify(input, null, 2));

    const { persona_id, update_attributes, force_regenerate_description } = input.context;

    try {
      // 1. 既存ペルソナデータを取得
      const { data: existingPersona, error: fetchError } = await supabase
        .from("expert_personas")
        .select("*")
        .eq("id", persona_id)
        .single();

      if (fetchError || !existingPersona) {
        console.error(`[Supabase] Persona not found or error fetching: ${persona_id}`, fetchError);
        throw new Error(`指定されたIDのペルソナが見つかりません: ${persona_id}`);
      }
      console.log("[Supabase] Fetched existing persona:", JSON.stringify(existingPersona, null, 2));

      // 2. 既存データと更新属性をマージ
      //    update_attributes に含まれるキーのみ上書き。
      const mergedAttributes: z.infer<typeof personaAttributeSchema> = {
        ...(existingPersona as z.infer<typeof personaAttributeSchema>), // 型アサーション
        ...update_attributes,
        id: existingPersona.id, // idは維持
      };

      // 3. description_by_ai を再生成するか判断
      let finalDescriptionByAi = mergedAttributes.description_by_ai; 

      // description_by_ai 以外の何かしらの属性が更新された場合、かつユーザーが直接description_by_aiを更新指定していない場合
      const otherAttributesUpdated = Object.keys(update_attributes).some(key => key !== 'description_by_ai' && update_attributes[key as keyof typeof update_attributes] !== undefined);
      const shouldRegenerateDescription = force_regenerate_description || 
                                         (otherAttributesUpdated && !update_attributes.hasOwnProperty('description_by_ai'));
      
      if (shouldRegenerateDescription) {
        console.log("[AI] Regenerating description_by_ai...");
        const promptForAi = buildPersonaProfilePrompt(mergedAttributes);
        const model = openai("gpt-4o");
        const result = await model.doGenerate({
          prompt: [{ role: "user", content: [{ type: "text", text: promptForAi }] }],
          inputFormat: "messages",
          mode: { type: "regular" },
        });
        
        try {
          let text = result.text || "{}";
          text = text.replace(/```json|```/g, "").trim();
          const aiProfile = JSON.parse(text);
          if (aiProfile.description_by_ai && typeof aiProfile.description_by_ai === 'string') {
            finalDescriptionByAi = aiProfile.description_by_ai;
            console.log("[AI] Successfully regenerated description_by_ai.");
          } else {
            console.warn("[AI] AI did not return description_by_ai in the expected format or it was not a string. Using previous or provided value.");
          }
        } catch (e) {
          console.error("[AI] Failed to parse AI output for description regeneration:", result.text, e);
          // AI生成に失敗しても、エラーにはせず、既存または提供された説明を使うことがある。
        }
      } else if (update_attributes.hasOwnProperty('description_by_ai')) {
        // ユーザーが直接 description_by_ai を指定した場合、それを使用
        finalDescriptionByAi = update_attributes.description_by_ai;
        console.log("[Updater] Using user-provided description_by_ai.");
      }


      // 4. 最終的な更新データを作成 (id, created_at は更新対象外)
      const { id, created_at, ...dataToUpdateBase } = mergedAttributes;
      const dataToUpdate: Partial<z.infer<typeof personaAttributeSchema>> = {
        ...dataToUpdateBase,
        description_by_ai: finalDescriptionByAi,
        updated_at: new Date().toISOString(), // 更新日時をセット
      };
      
      // 不要な undefined フィールドを削除 (Supabaseがエラーを出すことがあるため)
      Object.keys(dataToUpdate).forEach(key => {
        if (dataToUpdate[key as keyof typeof dataToUpdate] === undefined) {
          delete dataToUpdate[key as keyof typeof dataToUpdate];
        }
      });

      console.log("[Supabase] Data to update:", JSON.stringify(dataToUpdate, null, 2));

      // 5. Supabaseを更新
      const { data: updatedPersonaData, error: updateError } = await supabase
        .from("expert_personas")
        .update(dataToUpdate)
        .eq("id", persona_id)
        .select("id") 
        .single();

      if (updateError) {
        console.error(`[Supabase] Error updating persona ${persona_id}:`, updateError);
        throw new Error(`ペルソナの更新に失敗しました: ${updateError.message}`);
      }

      console.log("[Supabase] Persona updated successfully:", updatedPersonaData);
      console.log("--- personaUpdater Tool Execution End ---\\n");
      
      return {
        status: "ok",
        message: "ペルソナが正常に更新されました。",
        updated_persona_id: updatedPersonaData.id,
      };

    } catch (error: any) {
      console.error("[personaUpdater] Error:", error.message, error.stack);
      return {
        status: "error",
        message: error.message || "ペルソナの更新中に不明なエラーが発生しました。",
      };
    }
  },
}); 