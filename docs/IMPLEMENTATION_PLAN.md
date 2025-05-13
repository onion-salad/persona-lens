## Mastraサーバー起動時の注意点・手順

1. プロジェクトルートに `.env` ファイルを必ず作成し、以下の環境変数を設定すること：
   - `VITE_SUPABASE_URL=...`（SupabaseプロジェクトのURL）
   - `VITE_SUPABASE_ANON_KEY=...`（SupabaseのAnon Key）
   - `OPENAI_API_KEY=...`（OpenAIのAPIキー）

2. `.env` ファイルの内容が正しいか確認する。特にURLやAPIキーのtypoに注意。

3. Mastraサーバーの起動は、必ず以下のコマンドで行う：

   ```bash
   npm run mastra:dev
   ```
   - これにより `dotenv-cli` が `.env` を読み込み、Node.js環境にも環境変数が反映される。
   - `npx mastra dev` だけでは環境変数が反映されないため注意。

4. サーバー起動後、APIエンドポイントは `http://localhost:4111/api` で利用可能。

5. `.env` ファイルは `.gitignore` で管理し、絶対にリポジトリにコミットしないこと。

6. エラーが出る場合は、環境変数の設定漏れやtypo、またはポート競合（4111番ポート）を確認する。

---

（このセクションは今後の運用・開発者向けに随時アップデートしてください） 