import { Agent } from "@mastra/core";
import { openai } from "@ai-sdk/openai";
import { expertProposalSchema } from "../schemas/expertProposalSchema"; // エクスポート名に合わせて修正
// import { personaFactory } from "../tools/personaFactory"; // toolは一旦使わない
// import { expertProposalSchema } from "../schemas/expertProposalSchema"; // プロンプトで直接定義するので不要

// スキーマ文字列定義は不要になるため削除
/*
const schemaString = `
{
  "type": "object",
  "properties": {
    "experts": {
      "type": "array",
      "description": "提案された仮想専門家のリスト",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "専門家の名前" },
          "attributes": { "type": "string", "description": "専門家の属性 (業種/役職/規模など)" },
          "profile": { "type": "string", "description": "専門家のプロフィール概要" }
        },
        "required": ["name", "attributes", "profile"]
      }
    },
    "summary": {
      "type": "object",
      "description": "提案のサマリー",
      "properties": {
        "persona_count": { "type": "number", "description": "提案されたペルソナの数" },
        "main_attributes": { "type": "string", "description": "主な属性の概要" }
      },
      "required": ["persona_count", "main_attributes"]
    }
  },
  "required": ["experts", "summary"]
}
`;
*/

export const orchestratorAgent = new Agent({
  name: "orchestratorAgent",
  model: openai("gpt-4o"),
  // tools: { personaFactory }, // Structured Outputに集中するため、一旦ツール定義を除外
  instructions: `
あなたはユーザーの要望を分析し、最適な仮想専門家チームを提案するアシスタントです。
ユーザーからの入力（課題や目的）を理解し、提案内容を構造化されたデータとして返却してください。
重要なのは、提案される専門家リスト(\`experts\`)とそのサマリー(\`summary\`)を明確にすることです。
`,
  // output/structuredOutput は generate 時に指定するため、ここでは削除
});

// 注意: agent定義時に tools を渡すと structured output と競合する可能性があるため一旦コメントアウト。
// もしツール利用と structured output を両立させる場合は、generate時に experimental_output を使う必要がある。 