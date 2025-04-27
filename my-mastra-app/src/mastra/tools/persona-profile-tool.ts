// import dotenv from 'dotenv'; // dotenv は自動読み込みを期待して削除
// dotenv.config({ path: '../../../.env.local' });

import { createTool } from "@mastra/core/tools";
import { openai } from "@ai-sdk/openai";
// import { Agent } from "@mastra/core/agent"; // Agent は使わない
import { generateObject } from 'ai'; // AI SDK の generateObject をインポート
import { z } from "zod";

// 内部エージェント定義は削除

// ペルソナ生成ツールの定義
export const generatePersonaProfileTool = createTool({
  id: "generate-persona-profile",
  description: "指定されたトピックに基づいて、簡単なペルソナのプロフィール（名前と説明）を生成します。",
  inputSchema: z.object({
    topic: z.string().describe("生成したいペルソナのトピックやテーマ"),
  }),
  outputSchema: z.object({
    name: z.string().describe("生成されたペルソナの名前"),
    description: z.string().describe("生成されたペルソナの簡単な説明"),
  }),
  execute: async ({ context }) => {
    const topic = context.topic;
    if (!topic) {
      throw new Error("コンテキストにトピックが見つかりません。");
    }

    const prompt = `以下のトピックに基づいた架空の人物像を考えてください: \"${topic}\"\n\n名前(name)と短い説明(description)を生成してください。`;

    try {
      // Agent の代わりに generateObject を直接使用
      const { object } = await generateObject({
        model: openai("gpt-4o-mini"), // モデルを指定
        schema: z.object({ // 出力スキーマを指定
          name: z.string(),
          description: z.string(),
        }),
        prompt: prompt, // プロンプトを指定
      });

      return object; // 生成されたオブジェクトを返す

    } catch (error) {
      console.error("Error calling generateObject:", error);
      // API キーエラーなどもここでキャッチされるはず
      if (error instanceof Error && error.message.includes('API key')) {
         throw new Error("OpenAI API キーが見つからないか無効です。my-mastra-app/.env.local を確認してください。");
      }
      throw new Error("ペルソナプロファイルの生成中にエラーが発生しました。");
    }
  },
}); 