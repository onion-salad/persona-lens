import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // .env.local を明示的に読み込む

// import { mastra } from "./mastra"; // Mastra インスタンスは使わない
import { generatePersonaProfileTool } from './mastra/tools/persona-profile-tool'; // ツールを直接インポート

async function testToolDirectly() {
  console.log("generatePersonaProfileTool を直接テストします...");
  console.log("トピック: テクノロジー好きの大学生");

  try {
    // ツールを直接実行
    const result = await generatePersonaProfileTool.execute({
       context: { // execute が context を期待している
         topic: "テクノロジー好きの大学生" // inputSchema から渡される想定の値
       },
       runtimeContext: {} // 必須プロパティを追加
       // as any は不要になるかも？一旦残す
    } as any);

    console.log("\n--- ツールの直接実行結果 ---");
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("\n--- エラーが発生しました ---");
    console.error(error);
  }
}

// テスト関数を実行
testToolDirectly(); 