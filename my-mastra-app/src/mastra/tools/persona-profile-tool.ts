// import dotenv from 'dotenv'; // dotenv は自動読み込みを期待して削除
// dotenv.config({ path: '../../../.env.local' });

import { createTool } from "@mastra/core/tools";
// import { openai } from "@ai-sdk/openai"; // デフォルトは使わない
import { generateObject } from 'ai'; // AI SDK の generateObject をインポート
import { z } from "zod";
import { configuredOpenAI } from "../../config"; // パスを修正

// 内部エージェント定義は削除

// ペルソナ生成ツールの定義
const inputSchema = z.object({
  topic: z.string().describe("生成したいペルソナのトピックやテーマ"),
});
const outputSchema = z.object({
  name: z.string().describe("生成されたペルソナの名前"),
  description: z.string().describe("生成されたペルソナの簡単な説明"),
});

export const generatePersonaProfileTool = createTool({
  id: "generate-persona-profile",
  description: "指定されたトピックに基づいて、簡単なペルソナのプロフィール（名前と説明）を生成します。",
  inputSchema: inputSchema,
  outputSchema: outputSchema,
  execute: async ({ context }) => {
    const topic = context.topic;
    if (!topic) {
      throw new Error("コンテキストにトピックが見つかりません。");
    }

    const prompt = `以下のトピックに基づいた架空の人物像を考えてください: \"${topic}\"\n\n名前(name)と短い説明(description)を生成してください。`;

    try {
      const { object } = await generateObject({
        model: configuredOpenAI("gpt-4o-mini"), // 設定済みクライアントを使用
        schema: outputSchema, 
        prompt: prompt,
      });
      return object;
    } catch (error) {
      console.error("Error calling generateObject in generatePersonaProfileTool:", error);
      if (error instanceof Error && error.message.includes('API key')) {
         throw new Error("OpenAI API キー設定エラー (generatePersonaProfileTool)。config.ts または環境変数を確認してください。");
      }
      throw new Error("ペルソナプロファイル生成中にエラーが発生しました。", { cause: error });
    }
  },
}); 