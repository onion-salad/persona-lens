import dotenv from 'dotenv';
// .env.development を読み込むようにパスを指定
dotenv.config({ path: './my-mastra-app/.env.development' });

import { mastra } from "../my-mastra-app/src/mastra"; // Mastra インスタンスをインポート

async function testWorkflow() {
  console.log("Mastra ワークフローをテストします...");
  const workflowName = "personaGenerationWorkflow";

  try {
    const workflow = mastra.getWorkflow(workflowName);
    if (!workflow) {
      console.error(`ワークフロー '${workflowName}' が見つかりません。`);
      return;
    }

    console.log(`ワークフロー '${workflowName}' を取得しました。`);
    console.log("ワークフローを実行します (トピック: 料理好きの主婦)...");

    // ワークフロー実行を作成し、開始
    const { runId, start } = workflow.createRun();
    console.log(`Run ID: ${runId}`);

    const runResult = await start({
      triggerData: { topic: "料理好きの主婦" }, // トリガーデータを渡す
    });

    console.log("\n--- ワークフロー実行結果 ---");
    console.log("Results:", JSON.stringify(runResult.results, null, 2));

  } catch (error) {
    console.error("\n--- エラーが発生しました ---");
    console.error(error);
  }
}

// テスト関数を実行
testWorkflow(); 