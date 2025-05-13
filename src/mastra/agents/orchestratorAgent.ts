import { Agent } from "@mastra/core";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { estimatorAgent, estimatorOutputSchema } from "./estimatorAgent"; // EstimatorAgentとスキーマをインポート
import { personaFactory } from "../tools/personaFactory"; // personaFactoryツールをインポート
import { personaResponder } from "../tools/personaResponder"; // 追加
import { expertProposalSchema } from "../schemas/expertProposalSchema"; // これは最終的なAPIレスポンス用
import { supabase } from "../../lib/supabase/client"; // Supabaseクライアントをインポート

export const orchestratorAgent = new Agent({
  name: "orchestratorAgent",
  model: openai("gpt-4o"), // gpt-4oに統一
  tools: { personaFactory, personaResponder }, // personaResponderツールも登録
  instructions: `
あなたはB2B仮想専門家会議のオーケストレーターです。
ユーザーの発言や質問は、まずあなた自身が受け止めてください。
必要に応じて内容を要約・分割・再構成し、適切な形でペルソナに質問を投げてください。
そのままペルソナに渡すべきと判断した場合のみ、原文を渡してください。
すべての裁量はあなたにあります。

【進行例】
1. ユーザーの要望や課題を受け取り、最適なペルソナ構成を推定し生成する。
2. 生成したペルソナを一覧としてユーザーに提示する。
3. ユーザーが「〇〇についてどう思う？」など質問した場合、その内容をどう各ペルソナに伝えるかをあなたが判断し、必要に応じて質問を投げる。
4. ペルソナからの回答を集約し、ユーザーに分かりやすく返す。

最終的な出力は、フロントエンドが受け取るための expertProposalSchema に従ったJSON形式でなければなりません。
experts にはペルソナの基本情報と回答（必要な場合のみ）を含め、summary には処理の概要を含めてください。
`,
});

// OrchestratorAgentのメイン処理 (APIハンドラから呼び出されることを想定)
export async function runOrchestrator(userMessageContent: string) {
  console.log("[Orchestrator] Starting orchestration with user message:", userMessageContent);

  // ステップ1 & 2: EstimatorAgentを呼び出し、ペルソナ属性を推定
  console.log("[Orchestrator] Calling EstimatorAgent...");
  const estimationResult = await estimatorAgent.generate(
    [{ role: "user", content: userMessageContent }], // ユーザーメッセージを渡す
    {
      output: estimatorOutputSchema, // Zodスキーマを指定して構造化出力を得る
    }
  );

  // @ts-ignore
  if (!estimationResult.object || !estimationResult.object.personas_attributes) {
    console.error("[Orchestrator] EstimatorAgent did not return valid persona attributes.", estimationResult);
    throw new Error("EstimatorAgent failed to provide persona attributes.");
  }
  // @ts-ignore
  const personaAttributes = estimationResult.object.personas_attributes;
  // @ts-ignore
  console.log("[Orchestrator] EstimatorAgent returned attributes:", JSON.stringify(personaAttributes, null, 2));

  // ステップ3: personaFactoryツールを呼び出し、ペルソナを生成・保存
  console.log("[Orchestrator] Calling personaFactory tool...");
  const factoryResult = await personaFactory.execute({
    context: {
      personas_attributes: personaAttributes,
    },
  });

  if (factoryResult.status !== "ok" || !factoryResult.persona_ids) {
    console.error("[Orchestrator] personaFactory tool execution failed or did not return IDs.", factoryResult);
    throw new Error("personaFactory tool failed.");
  }
  console.log("[Orchestrator] personaFactory tool returned persona IDs:", factoryResult.persona_ids);

  // ステップ4: personaResponderツールで各ペルソナに質問し、回答を取得
  const question = userMessageContent; // ユーザーの課題・質問をそのまま使う
  const personaAnswers = await Promise.all(
    factoryResult.persona_ids.map(async (persona_id: string) => {
      try {
        const result = await personaResponder.execute({ persona_id, question });
        return {
          id: persona_id,
          name: result.persona_name,
          attributes: result.attributes,
          answer: result.answer,
        };
      } catch (e) {
        console.error(`[Orchestrator] personaResponder failed for id: ${persona_id}`, e);
        return {
          id: persona_id,
          name: "不明",
          attributes: {},
          answer: "回答生成に失敗しました。",
        };
      }
    })
  );

  const finalOutput = {
    experts: personaAnswers,
    summary: {
      // @ts-ignore
      persona_count: estimationResult.object.estimated_persona_count,
      // @ts-ignore
      main_attributes: `Estimatorが提案した${estimationResult.object.estimated_persona_count}名の専門家が作成されました。`,
    },
  };
  
  // expertProposalSchema でバリデーション (任意)
  try {
    expertProposalSchema.parse(finalOutput);
    console.log("[Orchestrator] Final output conforms to expertProposalSchema.");
  } catch (e) {
    console.error("[Orchestrator] Final output validation failed:", e);
    // バリデーション失敗時の処理
  }

  console.log("[Orchestrator] Orchestration finished. Final output:", JSON.stringify(finalOutput, null, 2));
  return finalOutput;
} 