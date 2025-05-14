import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from '@mastra/libsql';
import { LibSQLVector } from '@mastra/libsql';
import { estimatorAgent, estimatorOutputSchema } from "./estimatorAgent"; // EstimatorAgentとスキーマをインポート
import { personaFactory, personaFactoryOutputSchema, personaFactoryInputSchema } from "../tools/personaFactory"; // personaFactoryツールとそのOutputSchemaをインポート
import { 
  personaResponder, 
  personaResponderInputSchema, 
  personaResponderOutputSchema 
} from "../tools/personaResponder";
import { expertProposalSchema } from "../schemas/expertProposalSchema";
// import { supabase } from "../../lib/supabase/client"; // runOrchestrator内では直接使わなくなった

export const orchestratorAgent = new Agent({
  name: "orchestratorAgent",
  model: openai("gpt-4o"),
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../../../mastra-memory.db'
    }),
    vector: new LibSQLVector({
      connectionUrl: 'file:../../../mastra-memory.db'
    }),
    embedder: openai.embedding('text-embedding-3-small'),
    options: {
      lastMessages: 10,
      semanticRecall: false,
      threads: {
        generateTitle: false
      }
    }
  }),
  tools: { personaFactory, personaResponder },
  instructions: `あなたはB2B仮想専門家会議のオーケストレーターです。
ユーザーの要望に応じて、以下のステップで処理を実行します。
1. まず、'estimatorAgent' にユーザーの要望を伝え、最適なペルソナの属性リストを取得します。
2. 次に、取得したペルソナ属性リストを 'personaFactory' ツールに 'personas_attributes' というキーで直接渡し、ペルソナを作成して、そのIDのリストを取得します。
3. 最後に、ユーザーからの当初の質問と、作成された各ペルソナIDを 'personaResponder' ツールに渡し、各ペルソナからの回答を取得します。
4. 全てのペルソナからの回答をまとめて、ユーザーに提示してください。
ユーザーの入力は最初の要望や質問です。最終的な出力は expertProposalSchema に従ってください。
`,
});

// Agent.generate() の戻り値に含まれる toolResults の要素の型（仮定）
interface ToolExecutionResult {
  toolName: string;
  result: unknown; // まずは unknown として扱い、後でパースする
}

// OrchestratorAgentのメイン処理をリファクタリング
export async function runOrchestrator(userMessageContent: string, threadId?: string, resourceId?: string ) {
  console.log("[Orchestrator] Starting orchestration with user message:", userMessageContent, { threadId, resourceId });

  // estimatorOutputSchema から型を推論
  type EstimatorOutputType = z.infer<typeof estimatorOutputSchema>;

  // --- ステップ1 & 2: EstimatorAgentを呼び出し、ペルソナ属性を推定 ---
  console.log("[Orchestrator] Calling EstimatorAgent...");
  const estimationResult = await estimatorAgent.generate(
    [{ role: "user", content: userMessageContent }],
    {
      output: estimatorOutputSchema,
      threadId,
      resourceId,
    }
  );

  const resultObject = estimationResult.object as EstimatorOutputType; // 型アサーション

  if (!resultObject || !resultObject.personas_attributes) {
    console.error("[Orchestrator] EstimatorAgent did not return valid persona attributes.", estimationResult);
    throw new Error("EstimatorAgent failed to provide persona attributes.");
  }
  const personaAttributesFromEstimator = resultObject.personas_attributes;
  console.log("[Orchestrator] EstimatorAgent returned attributes:", JSON.stringify(personaAttributesFromEstimator, null, 2));


  // --- ステップ3: OrchestratorAgent自身にpersonaFactoryツールを使わせる ---
  console.log("[Orchestrator] Instructing self to use personaFactory tool...");

  const messagesForPersonaFactory: Array<{role: "user" | "assistant" | "system", content: string}> = [
    {
      role: "user",
      content: `以下の属性情報リストを使って 'personaFactory' ツールでペルソナを作成してください。ツールへの入力は 'personas_attributes' というキーにこの属性情報リストを設定したオブジェクトです。\n\n属性情報リスト:\n${JSON.stringify(personaAttributesFromEstimator, null, 2)}`
    }
  ];

  const factoryToolCallResult = await orchestratorAgent.generate(
    messagesForPersonaFactory,
    {
      toolChoice: { type: "tool", toolName: "personaFactory" },
      // ★ ツールが期待する入力の型を experimental_tool_input で明示することも検討できるが、まずはプロンプトで対応
      // experimental_tool_input: { personaFactory: personaFactoryInputSchema }, // スキーマを渡す (もしこのオプションがあれば)
      threadId,
      resourceId,
    }
  );

  console.log("[Orchestrator] personaFactory tool call result from orchestratorAgent:", JSON.stringify(factoryToolCallResult, null, 2));

  let personaIdsFromFactory: string[] | undefined = undefined;
  const toolResults = factoryToolCallResult.toolResults as ToolExecutionResult[] | undefined; // 型アサーション

  if (toolResults && toolResults.length > 0) {
    const firstToolResult = toolResults[0]; // toolResults が空でないことは上で確認済み
    if (firstToolResult && firstToolResult.toolName === 'personaFactory' && firstToolResult.result) {
      // personaFactoryのoutputSchemaに従った結果が result に入る想定
      try {
        const parsedResult = personaFactoryOutputSchema.parse(firstToolResult.result);
        personaIdsFromFactory = parsedResult.persona_ids;
      } catch(e) {
        console.error("[Orchestrator] Failed to parse personaFactory tool result:", e, firstToolResult.result);
      }
    }
  }

  if (!personaIdsFromFactory || personaIdsFromFactory.length === 0) {
    console.error("[Orchestrator] personaFactory tool did not return valid persona IDs via orchestratorAgent.", factoryToolCallResult);
    throw new Error("personaFactory tool failed to provide persona IDs via orchestratorAgent.");
  }
  console.log("[Orchestrator] Persona IDs from factory (via orchestratorAgent):", JSON.stringify(personaIdsFromFactory, null, 2));


  // --- ステップ4: personaResponderツールで各ペルソナに質問し、回答を取得 (Agent経由に変更) ---
  console.log("[Orchestrator] Instructing self to use personaResponder tool for each persona...");
  const question = userMessageContent;
  const personaAnswers = await Promise.all(
    personaIdsFromFactory.map(async (id: string) => {
      try {
        const responderInputPayload = { persona_id: id, question };
        console.log(`[Orchestrator] Calling orchestratorAgent.generate for personaResponder with input:`, JSON.stringify(responderInputPayload, null, 2));

        // orchestratorAgent.generate を使用して personaResponder を呼び出す
        const responderToolCallResult = await orchestratorAgent.generate(
          [
            {
              role: "user",
              content: `以下の情報に基づいて、'personaResponder' ツールを実行してください。\n\nツール名: personaResponder\n入力:\n${JSON.stringify(responderInputPayload, null, 2)}`
            }
          ],
          {
            toolChoice: { type: "tool", toolName: "personaResponder" },
            // experimental_tool_input は削除
            threadId,
            resourceId,
          }
        );

        console.log(`[Orchestrator] personaResponder tool call result for id ${id}:`, JSON.stringify(responderToolCallResult, null, 2));

        let responderOutput;
        const responderToolResults = responderToolCallResult.toolResults as ToolExecutionResult[] | undefined; // 型アサーション

        if (responderToolResults && responderToolResults.length > 0) {
          const toolResult = responderToolResults.find(tr => tr.toolName === 'personaResponder');
          if (toolResult && toolResult.result) { // toolResult が undefined でないこともチェック
            try {
              // personaResponderOutputSchema でパースする
              const parsedResult = personaResponderOutputSchema.parse(toolResult.result);
              responderOutput = parsedResult;
            } catch (e) {
              console.error(`[Orchestrator] Failed to parse personaResponder tool result for id ${id}:`, e, toolResult.result);
              // パース失敗時のフォールバック
              return { // mapのコールバックから早期リターン
                id: id,
                name: "パース失敗",
                attributes: {},
                answer: "回答結果の形式が不正です。",
              };
            }
          }
        }

        if (!responderOutput) {
          console.error(`[Orchestrator] personaResponder tool did not return valid output for id: ${id}`, responderToolCallResult);
          // ツール実行自体が失敗したか、結果が空の場合
          return { // mapのコールバックから早期リターン
            id: id,
            name: "実行失敗",
            attributes: {},
            answer: "ツールの実行に失敗しました。",
          };
        }

        return {
          id,
          name: responderOutput.persona_name,
          attributes: responderOutput.attributes,
          answer: responderOutput.answer,
        };
      } catch (e) {
        let errorMessage = `[Orchestrator] orchestratorAgent.generate (for personaResponder) failed for id: ${id}`;
        if (e instanceof Error) {
          errorMessage += ` - ${e.message}`;
          console.error(errorMessage, e.stack);
        } else {
          errorMessage += ` - ${String(e)}`;
          console.error(errorMessage);
        }
        return {
          id: id,
          name: "不明 (例外)",
          attributes: {},
          answer: "回答生成中に予期せぬエラーが発生しました。",
        };
      }
    })
  );

  const finalOutput = {
    experts: personaAnswers,
    summary: {
      persona_count: resultObject.estimated_persona_count, // 型アサーションしたオブジェクトからアクセス
      main_attributes: `Estimatorが提案した${resultObject.estimated_persona_count}名の専門家が作成されました。`,
    },
  };
  
  try {
    expertProposalSchema.parse(finalOutput);
    console.log("[Orchestrator] Final output conforms to expertProposalSchema.");
  } catch (e) {
    console.error("[Orchestrator] Final output validation failed:", e);
  }

  console.log("[Orchestrator] Orchestration finished. Final output:", JSON.stringify(finalOutput, null, 2));
  return finalOutput;
} 