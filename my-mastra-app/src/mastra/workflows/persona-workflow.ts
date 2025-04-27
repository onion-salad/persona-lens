import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import { generatePersonaProfileTool } from "../tools/persona-profile-tool"; // ツールをインポート

// ワークフローのトリガー（入力）スキーマ
const triggerSchema = z.object({
  topic: z.string().describe("ペルソナ生成のトピック"),
});

// ツールを呼び出すステップを定義
const generateProfileStep = new Step({
  id: "generateProfileStep",
  // このステップの入力はワークフローのトリガーデータ
  inputSchema: triggerSchema,
  // このステップの出力はツールの出力スキーマと同じ
  outputSchema: generatePersonaProfileTool.outputSchema,
  // 実行ロジック: ツールを呼び出す
  execute: async ({ context }) => {
    const topic = context.triggerData?.topic;
    if (!topic) {
      throw new Error("ワークフローのトリガーにトピックが見つかりません。");
    }
    // ツールが存在するかチェック
    if (!generatePersonaProfileTool?.execute) {
      throw new Error("generatePersonaProfileTool またはその execute メソッドが見つかりません。");
    }

    // ツールを実行
    const toolResult = await generatePersonaProfileTool.execute({
      context: { topic },
      runtimeContext: {}
    } as any); 

    return toolResult;
  },
});

// ワークフローを定義
export const personaGenerationWorkflow = new Workflow({
  name: "persona-generation-workflow",
  triggerSchema: triggerSchema,
});

// ステップをワークフローに追加
personaGenerationWorkflow
  .step(generateProfileStep)
  .commit(); // ワークフローをコミットして有効化 