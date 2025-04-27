import dotenv from 'dotenv';
import { createOpenAI } from '@ai-sdk/openai';

// 絶対パスで .env.development を読み込む
dotenv.config({ path: '/Users/koki/Desktop/persona-lens-main/my-mastra-app/.env.development' });

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  // デプロイ環境では環境変数から読み込まれることを期待
  // ローカル開発で .env.development がない場合にエラーにする
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      console.error("エラー: OPENAI_API_KEY が .env.development ファイルに設定されていないか、読み込めていません。");
      console.error("my-mastra-app/.env.development ファイルを確認してください。");
      process.exit(1); // エラーで終了
  } else {
      // 本番環境などで環境変数が設定されていない場合
      console.error("エラー: 環境変数 OPENAI_API_KEY が設定されていません。");
      process.exit(1);
  }
}

// API キーで設定済みの OpenAI クライアントを作成
export const configuredOpenAI = createOpenAI({
  apiKey: apiKey,
  // 必要に応じて他のデフォルト設定を追加可能
  //例: compatibility: 'strict' 
});

console.log("OpenAI クライアント設定完了 (config.ts)"); // 読み込み確認用 