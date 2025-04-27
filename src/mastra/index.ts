import { Mastra } from "@mastra/core";
import { personaCreatorAgent } from "./agents/persona-creator"; // 作成したエージェントをインポート

// Mastra インスタンスを作成し、エージェントを登録
export const mastra = new Mastra({
  agents: { personaCreatorAgent }, // agents プロパティに登録
  // tools: {}, // ツールはエージェントに紐付けたのでここでは不要
  // workflows: {},
});

// このファイルは Mastra の設定エントリーポイントとして機能します。
// 必要に応じてエージェントやワークフローをここに追加していきます。
