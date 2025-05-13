import { Agent } from "@mastra/core";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { estimatorAgent, estimatorOutputSchema } from "./estimatorAgent"; // EstimatorAgentとスキーマをインポート
import { personaFactory } from "../tools/personaFactory"; // personaFactoryツールをインポート
import { expertProposalSchema } from "../schemas/expertProposalSchema"; // これは最終的なAPIレスポンス用
import { supabase } from "../../lib/supabase/client"; // Supabaseクライアントをインポート

export const orchestratorAgent = new Agent({
  name: "orchestratorAgent",
  model: openai("gpt-4o-mini"), // こちらもminiに統一。必要に応じてgpt-4oに戻す。
  tools: { personaFactory }, // personaFactoryツールを登録
  instructions: `
あなたはユーザーの課題や要望を分析し、最適なB2B仮想専門家チームを編成し、その専門家チームに課題について議論させ、最終的な提案を生成するオーケストレーターです。
一連の処理をステップバイステップで実行します。

ステップ1: ユーザーの入力（課題、目的、希望する専門家のタイプなど）を分析します。
ステップ2: 分析結果を基に、\`estimatorAgent\` を呼び出して、最適なAIペルソナの数と各ペルソナの属性（title, industry, positionなど）を推定させます。
ステップ3: \`estimatorAgent\` の出力を受け取り、それを \`personaFactory\` ツールに渡して、専門家ペルソナを生成・データベースに保存させます。
ステップ4: (MVPではここまで) 生成されたペルソナの情報（IDリストや属性）を最終結果としてまとめます。将来的には、これらのペルソナに課題について議論させ、その結果をまとめます。

最終的な出力は、フロントエンドが受け取るための \`expertProposalSchema\` に従ったJSON形式でなければなりません。
現時点では、\`experts\` には \`personaFactory\` で作成されたペルソナの基本情報（ID、名前、属性など）を含め、\`summary\` には処理の概要を含めてください。
各ペルソナの回答はまだ収集しないため、\`experts.answer\` フィールドは空または固定値で構いません。
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

  // ステップ4: (MVPではここまで) 最終結果をexpertProposalSchemaに沿って組み立てる
  // Supabaseから保存されたペルソナの詳細情報を取得する
  const createdPersonas = [];
  if (factoryResult.persona_ids.length > 0) {
    const { data: personasData, error: personasError } = await supabase
      .from('expert_personas')
      .select('*')
      .in('id', factoryResult.persona_ids);

    if (personasError) {
      console.error("[Orchestrator] Error fetching created personas from Supabase:", personasError);
      throw new Error("Failed to fetch created personas.");
    }
    if (personasData) {
      for (const p of personasData) {
        createdPersonas.push({
          id: p.id,
          name: p.name,
          attributes: { // より詳細な属性オブジェクト
            title: p.title,
            industry: p.industry,
            position: p.position,
            company: p.company,
            company_size: p.company_size,
            region: p.region,
          },
          profile: `専門分野: ${JSON.stringify(p.expertise)}, 経歴: ${JSON.stringify(p.background)}, 性格: ${JSON.stringify(p.personality)}`, // プロフィール概要
          answer: "(現時点では回答未収集)", // MVPでは回答はダミー
        });
      }
    }
  }

  const finalOutput = {
    experts: createdPersonas,
    summary: {
      // @ts-ignore
      persona_count: estimationResult.object.estimated_persona_count,
      // @ts-ignore
      main_attributes: `Estimatorが提案した${estimationResult.object.estimated_persona_count}名の専門家が作成されました。`,
      // TODO: もっと詳細なサマリーを生成
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