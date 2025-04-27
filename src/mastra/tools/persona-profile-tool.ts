import { createTool } from "@mastra/core/tools";
import { openai } from "@ai-sdk/openai"; // OpenAI SDK をインポート
import { Agent } from "@mastra/core/agent"; // Agent を使って生成
import { z } from "zod";

// 内部で使用する簡易的なエージェントを定義
const personaGeneratorAgent = new Agent({
  name: "Persona Snippet Generator",
  instructions: "あなたは与えられたトピックに基づき、架空の人物の名前と短い説明文を生成するアシスタントです。",
  model: openai("gpt-4o-mini"), // モデルを OpenAI に変更
});

// ペルソナ生成ツールの定義
export const generatePersonaProfileTool = createTool({
  id: "generate-persona-profile",
  description: "指定されたトピックに基づいて、簡単なペルソナのプロフィール（名前と説明）を生成します。",
  // 入力スキーマ: ペルソナのトピックやテーマ
  inputSchema: z.object({
    topic: z.string().describe("生成したいペルソナのトピックやテーマ（例: 'テクノロジー好きの大学生', '料理好きの主婦'）"),
  }),
  // 出力スキーマ: 生成された名前と説明
  outputSchema: z.object({
    name: z.string().describe("生成されたペルソナの名前"),
    description: z.string().describe("生成されたペルソナの簡単な説明"),
  }),
  // 実行ロジック
  execute: async ({ context }) => {
    const topic = context.topic; // inputSchema からトピックを取得

    // OpenAI を使って名前と説明を生成するプロンプト
    const prompt = `以下のトピックに基づいた架空の人物像を考えてください: "${topic}"\n\n出力は以下のJSON形式で、名前(name)と短い説明(description)のみを含めてください:\n{\n  "name": "人物の名前",\n  "description": "人物の短い説明"\n}`;

    try {
      // Agent を使って構造化された出力を試みる
      const result = await personaGeneratorAgent.generate(prompt, {
        output: z.object({
          name: z.string(),
          description: z.string(),
        }),
      });

      // 結果が存在し、object プロパティがあればそれを返す
      if (result.object) {
        return result.object;
      } else {
        // object がない場合 (エラーや予期せぬ形式)、フォールバックまたはエラー処理
        // エラーメッセージを調整 (text プロパティは存在しないため)
        console.error("Failed to generate structured output.", result); // result オブジェクト全体をログに出力
        throw new Error("ペルソナプロファイルの構造化データの生成に失敗しました。");
      }
    } catch (error) {
      console.error("Error calling personaGeneratorAgent:", error);
      throw new Error("ペルソナプロファイルの生成中にエラーが発生しました。");
    }
  },
}); 