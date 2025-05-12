# Mastra 起動・運用のポイント

## 1. 起動前の準備

- **Node.js v20以上が必須**
  - MastraはNode.js v20.0.0以上でのみ安定動作します。
  - nvmを使っている場合は `nvm use v20.19.1` などでバージョンを切り替える。
  - `node -v` でバージョン確認。

- **APIキーの設定**
  - OpenAIなどのLLMプロバイダーのAPIキーを `.env` または `.env.development` に記載。
  - 例: `OPENAI_API_KEY=sk-xxxx...`

- **依存関係のインストール**
  - `npm install` で依存パッケージをインストール。
  - Node.jsバージョンを切り替えた場合は `node_modules` を削除して再インストール推奨。

## 2. 起動方法

- **プロジェクトルートで実行**
  - `package.json` があるディレクトリでコマンドを実行。
  - サブディレクトリ（例: `src/mastra`）にcdする必要はない。

- **npx推奨**
  - `npx mastra dev` でローカルのMastra CLIを使うのが安定。
  - グローバルCLIはNodeバージョンの不整合が起きやすい。

- **サーバー起動確認**
  - `Mastra API running on port http://localhost:4111/api` などのメッセージが出ればOK。
  - エラーが出る場合はNode.jsバージョンや依存関係を再確認。

## 3. よくあるトラブルと対策

- `crypto is not defined` エラー
  - Node.jsのバージョンが古い場合に発生。必ずv20以上を使う。
  - `nvm use v20.19.1` で切り替え、`node -v` で確認。

- グローバルCLIでバージョン不整合
  - `npx mastra dev` でローカルCLIを使う。

- 依存関係の不整合
  - `rm -rf node_modules package-lock.json` で一度削除し、`npm install` で再インストール。

## 4. その他のポイント

- **APIエンドポイント**
  - デフォルトで `http://localhost:4111/api/agents/エージェント名/generate` などが利用可能。
  - Swagger UI: `http://localhost:4111/swagger-ui`
  - Playground: `http://localhost:4111/`

- **開発サーバーの停止**
  - `Ctrl+C` で停止。

- **nvmのデフォルト設定**
  - `nvm alias default v20.19.1` で新しいターミナルでも自動でv20が使われるように。

---

何か問題が発生した場合は、まずNode.jsのバージョンと依存関係を疑い、`npx mastra dev` での起動を試してください。 