import { openai } from "@ai-sdk/openai"; // OpenAI SDK をインポート
import { Agent } from "@mastra/core/agent";
import { generatePersonaProfileTool } from "../tools/persona-profile-tool"; // 作成したツールをインポート

// ペルソナ生成の指示を出すエージェント
export const personaCreatorAgent = new Agent({
  name: "Persona Creator",
  instructions: `あなたはユーザーの指示に基づき、ペルソナのプロフィール生成を支援するエージェントです。
                 指定されたトピックから簡単なプロフィールを作成するには、利用可能なツールを使用してください。`,
  model: openai("gpt-4o-mini"), // モデルを OpenAI に変更
  // このエージェントが使用できるツールとして登録
  tools: { generatePersonaProfileTool },
}); 