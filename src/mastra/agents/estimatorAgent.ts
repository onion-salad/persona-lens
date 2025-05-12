import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";

export const estimatorAgent = new Agent({
  name: "estimatorAgent",
  instructions: `
あなたはB2Bビジネスの仮想専門家会議の設計アシスタントです。
ユーザーの課題や要望をもとに、
- 統計的に最適なAIペルソナ数（1〜7名）
- 各ペルソナの属性（業種、役職、企業規模、地域、意思決定権など）
を推定し、JSON形式で出力してください。

【出力例】
{
  "count": 5,
  "personas": [
    { "industry": "IT", "role": "経営者", "company_size": "大企業", "region": "東京", "decision_power": "高" },
    ...
  ]
}
` ,
  model: openai("gpt-4o-mini"),
}); 