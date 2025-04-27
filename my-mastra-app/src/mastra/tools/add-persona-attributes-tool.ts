import { createTool } from "@mastra/core/tools";
// import { openai } from "@ai-sdk/openai";
import { generateObject } from 'ai';
import { z } from "zod";
import { configuredOpenAI } from "../../config"; // 設定済みクライアントをインポート

// 入力スキーマ
const inputSchema = z.object({
  basePersona: z.object({
    name: z.string().describe("詳細化する元のペルソナの名前"),
    description: z.string().describe("詳細化する元のペルソナの説明"),
  }).describe("詳細化のベースとなるペルソナ情報"),
  instructions: z.string().describe("ペルソナに追加したい属性や詳細化に関する具体的な指示"),
});

// 出力スキーマ (元の情報も含めるか、変更点だけにするかなど設計次第)
const outputSchema = z.object({
  name: z.string().describe("ペルソナの名前（通常は変更なし）"),
  detailedDescription: z.string().describe("元の説明に追加指示を反映して詳細化された説明"),
  // 必要に応じて他の属性を追加 (例: attributes: z.array(z.string()))
});

export const addPersonaAttributesTool = createTool({
  id: "add-persona-attributes",
  description: "既存のペルソナ情報にユーザーの指示に基づいて属性や詳細を追加・修正します。",
  inputSchema: inputSchema,
  outputSchema: outputSchema,
  execute: async ({ context }) => {
    const { basePersona, instructions } = context; // inputSchema から取得 (execute の context が input を含む想定)
    if (!basePersona || !instructions) {
      throw new Error("ベースペルソナ情報または詳細化の指示が見つかりません。");
    }

    const prompt = `以下の基本ペルソナ情報があります:\n名前: ${basePersona.name}\n説明: ${basePersona.description}\n\nこのペルソナに以下の指示に基づいて詳細を追加・修正してください:\n指示: ${instructions}\n\n最終的なペルソナの名前(name)と、詳細化された説明(detailedDescription)を生成してください。`;

    try {
      const { object } = await generateObject({
        model: configuredOpenAI("gpt-4o-mini"), // 設定済みクライアントを使用
        schema: outputSchema, // 出力スキーマを指定
        prompt: prompt,
      });
      return object;
    } catch (error) {
      console.error("Error calling generateObject in addPersonaAttributesTool:", error);
       if (error instanceof Error && error.message.includes('API key')) {
         throw new Error("OpenAI API キー設定エラー (addPersonaAttributesTool)。config.ts または環境変数を確認してください。");
      }
      throw new Error("ペルソナの詳細化中にエラーが発生しました。", { cause: error });
    }
  },
}); 