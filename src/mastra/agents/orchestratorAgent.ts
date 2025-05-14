import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from '@mastra/libsql';
import { LibSQLVector } from '@mastra/libsql';
import { estimatorAgent, estimatorOutputSchema } from "./estimatorAgent"; // EstimatorAgentとスキーマをインポート
import { personaFactory, personaFactoryOutputSchema, personaFactoryInputSchema } from "../tools/personaFactory"; // personaFactoryツールとそのOutputSchemaをインポート
import { personaResponder } from "../tools/personaResponder";
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

// OrchestratorAgentのメイン処理をリファクタリング
export async function runOrchestrator(userMessageContent: string, threadId?: string, resourceId?: string ) {
  console.log("[Orchestrator] Starting orchestration with user message:", userMessageContent, { threadId, resourceId });

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

  // @ts-ignore
  if (!estimationResult.object || !estimationResult.object.personas_attributes) {
    console.error("[Orchestrator] EstimatorAgent did not return valid persona attributes.", estimationResult);
    throw new Error("EstimatorAgent failed to provide persona attributes.");
  }
  // @ts-ignore
  const personaAttributesFromEstimator = estimationResult.object.personas_attributes;
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
  // @ts-ignore
  if (factoryToolCallResult.toolResults && factoryToolCallResult.toolResults.length > 0) {
    // @ts-ignore
    const firstToolResult = factoryToolCallResult.toolResults[0];
    if (firstToolResult.toolName === 'personaFactory' && firstToolResult.result) {
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


  // --- ステップ4: personaResponderツールで各ペルソナに質問し、回答を取得 ---
  // personaResponderの呼び出しもOrchestratorAgent経由に統一した方が望ましいが、一旦変更の影響範囲を限定するため、
  // ここは直接呼び出しのままにする。もし問題が再発・継続する場合はここもAgent経由にリファクタリングを検討。
  console.log("[Orchestrator] Calling personaResponder.execute directly for each persona...");
  const question = userMessageContent;
  const personaAnswers = await Promise.all(
    personaIdsFromFactory.map(async (id: string) => {
      try {
        const responderInput = { persona_id: id, question };
        console.log(`[Orchestrator] Calling personaResponder.execute with input:`, JSON.stringify(responderInput, null, 2));
        const result = await personaResponder.execute(responderInput);

        return {
          id,
          name: result.persona_name,
          attributes: result.attributes,
          answer: result.answer,
        };
      } catch (e: any) {
        console.error(`[Orchestrator] personaResponder.execute failed for id: ${id}`, e.message, e.stack);
        return {
          id: id,
          name: "不明",
          attributes: {},
          answer: "回答生成に失敗しました。",
        };
      }
    })
  );

  const finalOutput = {
    experts: personaAnswers,
    summary: {
      // @ts-ignore
      persona_count: estimationResult.object.estimated_persona_count,
      // @ts-ignore
      main_attributes: `Estimatorが提案した${estimationResult.object.estimated_persona_count}名の専門家が作成されました。`,
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