// import dotenv from 'dotenv'; // dotenv 設定は config.ts に移動したため不要
// dotenv.config({ path: './my-mastra-app/.env.development' });

import { mastra } from "../my-mastra-app/src/mastra"; // Mastra インスタンスをインポート

async function testInteractiveAgent() {
  console.log("Mastra 対話型エージェントをテストします...");
  const agentName = "personaCreatorAgent";
  const agent = mastra.getAgent(agentName);

  if (!agent) {
    console.error(`エージェント '${agentName}' が見つかりません。`);
    return;
  }
  console.log(`エージェント '${agent?.name}' を取得しました。`);

  try {
    // --- ステップ1: 基本ペルソナ生成 ---
    console.log("\n--- ユーザー: 基本的なペルソナを作成して ---");
    const initialPrompt = "「旅行好きのフォトグラファー」というトピックで簡単なペルソナプロフィールを作成してください。";
    console.log("プロンプト:", initialPrompt);

    const result1 = await agent.generate(initialPrompt);
    console.log("\n--- エージェント応答1 (基本ペルソナ + 質問) ---");
    console.log("Text:", result1.text);
    // ツール呼び出し結果も確認 (generatePersonaProfileTool が呼ばれているはず)
    console.log("Tool Calls:", JSON.stringify(result1.toolCalls, null, 2));
    console.log("Tool Results:", JSON.stringify(result1.toolResults, null, 2));

    // --- ステップ2: 詳細化の指示 ---
    console.log("\n--- ユーザー: 詳細化の指示を与える ---");
    const refinementPrompt = "素晴らしいですね！その人に「特に風景写真が得意」で「最近アイスランドに行った」という詳細を追加してください。";
    console.log("プロンプト:", refinementPrompt);

    // 重要: ここで agent.generate を再度呼び出す際に、前の会話履歴が考慮されるかどうかが鍵
    // Mastra の Agent が状態を保持するかに依存
    const result2 = await agent.generate(refinementPrompt);
    console.log("\n--- エージェント応答2 (詳細ペルソナ) ---");
    console.log("Text:", result2.text);
    // ツール呼び出し結果も確認 (addPersonaAttributesTool が呼ばれているはず)
    console.log("Tool Calls:", JSON.stringify(result2.toolCalls, null, 2));
    console.log("Tool Results:", JSON.stringify(result2.toolResults, null, 2));

    // addPersonaAttributesTool の直接の結果も確認
     const detailedPersonaResult = result2.toolResults?.find(
        (toolResult) => toolResult.toolName === "add-persona-attributes"
    )?.result;
     if (detailedPersonaResult) {
        console.log("\n--- addPersonaAttributesTool の実行結果 ---");
        console.log(JSON.stringify(detailedPersonaResult, null, 2));
    }


  } catch (error) {
    console.error("\n--- エラーが発生しました ---");
    console.error(error);
  }
}

// テスト関数を実行
testInteractiveAgent(); 