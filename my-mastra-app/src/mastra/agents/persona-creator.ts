// import { openai } from "@ai-sdk/openai"; // デフォルトは使わない
import { Agent } from "@mastra/core/agent";
import { generatePersonaProfileTool } from "../tools/persona-profile-tool"; // 作成したツールをインポート
import { addPersonaAttributesTool } from "../tools/add-persona-attributes-tool"; // 新しいツールをインポート
import { configuredOpenAI } from "../../config"; // 設定済みクライアントをインポート

// ペルソナ生成の指示を出すエージェント
export const personaCreatorAgent = new Agent({
  name: "Persona Creator",
  instructions: `あなたはユーザーとの対話を通じてペルソナ作成を支援するエージェントです。
ステップ・バイ・ステップで進めてください。

1.  まず、ユーザーからペルソナの基本的なトピック（例: 'テクノロジー好きの大学生'）を聞き出してください。
2.  トピックを受け取ったら、'generatePersonaProfileTool' ツールを使用して基本的なプロフィール（名前と説明）を生成し、ユーザーに提示してください。
3.  次に、生成した基本プロフィールをユーザーに見せ、「このペルソナにどのような属性や詳細を追加したいですか？」と質問してください。
4.  ユーザーからの追加指示を受け取ったら、'addPersonaAttributesTool' ツールを使用してください。このツールには、ステップ2で生成した基本プロフィール（名前と説明）と、ユーザーからの追加指示の両方を渡す必要があります。
5.  'addPersonaAttributesTool' の結果（詳細化されたペルソナ）を最終的な応答としてユーザーに提示してください。

会話の履歴と生成された情報を記憶し、適切にツールに渡してください。`,
  model: configuredOpenAI("gpt-4o-mini"), // 設定済みクライアントを使用
  // このエージェントが使用できるツールとして登録
  tools: {
    generatePersonaProfileTool,
    addPersonaAttributesTool // 新しいツールを追加
  },
}); 