"use client";
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from '@mastra/libsql';
import { LibSQLVector } from '@mastra/libsql';
import { type ToolExecutionContext } from "@mastra/core/tools";
import { estimatorAgent, estimatorOutputSchema } from "./estimatorAgent"; // EstimatorAgentとスキーマをインポート
import { 
  personaFactory, 
  personaFactoryOutputSchema, 
  personaFactoryInputSchema, 
  personaAttributeSchema // personaAttributeSchema をインポート
} from "../tools/personaFactory"; // personaFactoryツールとそのOutputSchemaをインポート
import { 
  personaResponder, 
  personaResponderInputSchema, 
  personaResponderOutputSchema 
} from "../tools/personaResponder";
import { personaFinder } from "../tools/personaFinder"; // 修正: 名前付きインポートのみに変更
import { expertProposalSchema } from "../schemas/expertProposalSchema";
import { personaUpdater } from "../tools/personaUpdater";
// import { supabase } from "../../lib/supabase/client"; // runOrchestrator内では直接使わなくなった

export const orchestratorAgent = new Agent({
  name: "orchestratorAgent",
  model: openai("gpt-4o"),
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:./mastra-memory.db'
    }),
    vector: new LibSQLVector({
      connectionUrl: 'file:./mastra-memory.db'
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
  tools: { personaFactory, personaResponder, personaFinder, personaUpdater },
  instructions: `あなたは、ユーザーのあらゆる要望に対して、最適なAI人格（ペルソナ）を準備し、ユーザーとペルソナ間の対話を円滑に進め、ユーザーの理解を深めるための高度なAIアシスタントです。

ユーザーの要望を分析し、以下の主要タスクのいずれか、または組み合わせを実行します。

【主要タスク】

1.  **要望分析とペルソナ準備:**
    *   ユーザーの入力（質問、相談、依頼など）の本質を理解します。
    *   その要望に応えるために最適な専門性、視点、性格を持つペルソナ像を具体的に定義します。'estimatorAgent' を利用して、必要なペルソナの数と属性の初期案を取得することも有効です。
    *   定義されたペルソナ像に基づき、'personaFinder' ツールで既存ペルソナを検索します。
    *   既存ペルソナで対応できない、または不十分な場合は、'personaFactory' ツールで新しいペルソナを作成します。この際、属性情報から既存のペルソナID（uuid）は必ず除外してください。
    *   必要に応じて、既存ペルソナの情報を 'personaUpdater' ツールで最新の状態に更新することも検討します。

2.  **ペルソナとの対話実行:**
    *   準備（作成・選定・更新）されたペルソナに、ユーザーの要望や質問を伝えます。
    *   各ペルソナに 'personaResponder' ツールを使って個別に回答させます。

3.  **対話結果の仲介とユーザー支援:**
    *   各ペルソナからの回答を収集・分析します。
    *   単に回答を並べるだけでなく、以下の情報処理を行い、ユーザーにとって最も価値のある形で最終的な応答を生成します。
        *   **論点整理:** 複数のペルソナからの意見がある場合、共通点、相違点、重要な論点を明確にします。
        *   **要約:** 複雑な情報や長い回答を分かりやすく要約します。
        *   **理解補助:** 専門用語の解説、背景情報の補足、具体例の提示などを行い、ユーザーの理解を助けます。
        *   **追加提案:** ユーザーがさらに思考を深められるような追加の質問、異なる視点からの問いかけ、関連情報源などを提案します。
    *   この最終応答を生成する際には、あなた自身の高度な判断と言語能力を最大限に活用してください。

【タスク実行の流れの例（ユーザーが新しい相談をした場合）】

1.  ユーザーの相談内容を分析。
2.  \`estimatorAgent\` で必要なペルソナの属性案と数を取得。
3.  \`personaFinder\` で既存ペルソナを検索。
4.  不足分や、より最適なペルソナが必要な場合は、属性を調整・決定し（既存IDは含めない）、\`personaFactory\` で新規作成。
5.  準備できたペルソナたちに、ユーザーの相談内容を \`personaResponder\` を使って伝達し、意見を収集。
6.  収集した全ペルソナの意見を基に、上記の「対話結果の仲介とユーザー支援」で述べた情報処理（論点整理、要約、理解補助、追加提案など）を行い、総合的な回答メッセージをあなた自身が生成してユーザーに提示。

【既存ペルソナ情報の更新タスク】
ユーザーが既存ペルソナの情報の変更や更新を明確に指示した場合（例：「ID xxx のペルソナの役職を YYY に変更して」）：
1. 更新対象のペルソナID (\`persona_id\`) と更新内容 (\`update_attributes\`) を特定。
2. 必要なら説明文の再生成 (\`force_regenerate_description: true\`) を判断。
3. \`personaUpdater\` ツールを実行し、結果をユーザーに報告。

【全般的な指示】
- あなたの主な役割は、ユーザーが持つ課題や疑問に対し、最適なAIペルソナを通じて多角的かつ深い洞察を提供し、ユーザー自身がより良い結論や理解に至ることを支援することです。
- 各ツールを呼び出す際は、その入力スキーマに厳密に従ってください。
- あなた自身の応答や、ペルソナの意見をまとめる際には、常にユーザーにとって明確で、親切で、洞察に富むことを心がけてください。
- ユーザーの意図を最優先し、状況に応じて柔軟にタスクの実行順序や組み合わせを変更してください。
`,
});

// Agent.generate() の戻り値に含まれる toolResults の要素の型（仮定）
interface ToolExecutionResult {
  toolName: string;
  result: unknown; // まずは unknown として扱い、後でパースする
}

// タスクタイプを定義
const taskTypeSchema = z.object({
  task_type: z.enum(["new_query", "update_persona", "general_conversation"]),
  persona_id_to_update: z.string().optional().describe("ペルソナ更新の場合の対象ID"),
  update_attributes: personaAttributeSchema.partial().optional().describe("ペルソナ更新の場合の更新内容"),
  original_query_for_responder: z.string().optional().describe("ペルソナへの質問内容（もしあれば）")
});
type TaskTypeOutput = z.infer<typeof taskTypeSchema>;

// OrchestratorAgentのメイン処理をリファクタリング
export async function runOrchestrator(userMessageContent: string, threadId?: string, resourceId?: string ) {
  const uniqueRequestId = `orchestrator-run-${Date.now()}-${Math.random().toString(36).substring(7)}`; // 簡単なユニークID生成
  console.log(`[Orchestrator START - ${uniqueRequestId}] Starting orchestration with user message:`, userMessageContent, { threadId, resourceId });

  // --- 初期ステップ: ユーザーのメッセージタイプを判断 ---
  console.log(`[Orchestrator - ${uniqueRequestId}] Determining task type for user message...`);
  const taskDeterminationPrompt = `ユーザーからのメッセージは「${userMessageContent}」です。
このメッセージが、以下のいずれに該当するか判断してください。
1. 新規の質問や相談 (new_query): AIペルソナを準備して回答を生成する必要がある場合。
2. 既存ペルソナの情報更新依頼 (update_persona): 特定のペルソナの属性変更を指示している場合。その場合は対象のペルソナIDと更新内容も抽出してください。
3. 上記以外、または判断が難しい一般的な会話や指示 (general_conversation): 例えば「こんにちは」だけの挨拶や、システムへの一般的な問い合わせなど。

出力は以下のJSON形式で、task_type, persona_id_to_update, update_attributes, original_query_for_responder を含めてください。
persona_id_to_update と update_attributes は update_persona の場合にのみ意味を持ちます。
original_query_for_responder は new_query の場合にユーザーの元の質問を保持するために使います。
`;

  const taskDeterminationResponse = await orchestratorAgent.generate(
    [{ role: "user", content: taskDeterminationPrompt }],
    {
      output: {
        format: "json",
        schema: taskTypeSchema
      },
      threadId,
      resourceId
    }
  );

  if (!taskDeterminationResponse.object) {
    console.error(`[Orchestrator - ${uniqueRequestId}] Failed to determine task type from LLM.`);
    throw new Error("Could not determine task type.");
  }
  const taskDetails = taskDeterminationResponse.object as TaskTypeOutput;
  console.log(`[Orchestrator - ${uniqueRequestId}] Task determination result:`, JSON.stringify(taskDetails, null, 2));

  // --- タスクタイプに応じた処理分岐 ---
  if (taskDetails.task_type === "update_persona" && taskDetails.persona_id_to_update && taskDetails.update_attributes) {
    console.log(`[Orchestrator - ${uniqueRequestId}] Task type: update_persona. Calling personaUpdater tool...`);
    // personaUpdaterツールを呼び出すロジック（詳細は後述）
    const updaterPayload = {
      persona_id: taskDetails.persona_id_to_update,
      update_attributes: taskDetails.update_attributes,
      // force_regenerate_description は必要に応じてLLMに判断させるか、固定値にする
      // ここでは例として false を設定
      force_regenerate_description: false 
    };
    const updaterToolCallPrompt = `以下の情報に基づいて、'personaUpdater' ツールを実行してください。
ツール名: personaUpdater
入力:
${JSON.stringify(updaterPayload, null, 2)}`;

    const updaterToolCallResult = await orchestratorAgent.generate(
      [{ role: "user", content: updaterToolCallPrompt }],
      {
        toolChoice: { type: "tool", toolName: "personaUpdater" },
        threadId,
        resourceId,
      }
    );
    console.log(`[Orchestrator - ${uniqueRequestId}] personaUpdater tool call result:`, JSON.stringify(updaterToolCallResult, null, 2));
    if (updaterToolCallResult.toolResults && updaterToolCallResult.toolResults.length > 0) {
      const updaterResult = updaterToolCallResult.toolResults[0] as ToolExecutionResult;
      if (updaterResult.result) {
        // TODO: ユーザーへの最終的な応答メッセージを生成する
        // ここでは一旦、ツールの結果をそのまま返す（UI側でよしなに表示することを期待）
        return {
          type: "persona_update_result",
          data: updaterResult.result,
          message: `ペルソナ(ID: ${taskDetails.persona_id_to_update})の情報を更新しました。`
        };
      }
    }
    // 更新失敗時の処理
    console.error(`[Orchestrator - ${uniqueRequestId}] personaUpdater tool execution failed or returned no result.`, updaterToolCallResult);
    // TODO: ユーザーへのエラーメッセージを生成
    return {
        type: "error",
        message: `ペルソナ(ID: ${taskDetails.persona_id_to_update})の更新に失敗しました。`
    };

  } else if (taskDetails.task_type === "new_query") {
    console.log(`[Orchestrator - ${uniqueRequestId}] Task type: new_query. Proceeding with persona preparation and response generation...`);
    const queryForPersonas = taskDetails.original_query_for_responder || userMessageContent;
    // EstimatorAgent以降の処理はここに移動・調整される

    type EstimatorOutputType = z.infer<typeof estimatorOutputSchema>;

    // --- ステップ1: EstimatorAgentを実行して、ペルソナの数と基本属性を見積もる ---
    console.log(`[Orchestrator - ${uniqueRequestId}] Calling EstimatorAgent for query: ${queryForPersonas}`);
    const estimationResponse = await estimatorAgent.generate(
      [{ role: "user", content: queryForPersonas }], 
      { 
        output: { 
          format: "json",
          schema: estimatorOutputSchema 
        },
        threadId, 
        resourceId 
      }
    );
    const estimatorResult = estimationResponse.object as EstimatorOutputType; // .output から .object に戻す
    console.log(`[Orchestrator - ${uniqueRequestId}] EstimatorAgent Result:`, JSON.stringify(estimatorResult, null, 2)); 

    if (!estimatorResult || !estimatorResult.personas_attributes || estimatorResult.personas_attributes.length === 0) {
      console.error("[Orchestrator] EstimatorAgent did not return valid persona attributes or count.", estimatorResult);
      throw new Error("EstimatorAgent failed to provide persona attributes or count.");
    }
    const estimatedAttributes = estimatorResult.personas_attributes;
    const estimatedCount = estimatorResult.estimated_persona_count;
    // console.log("[Orchestrator] EstimatorAgent: Estimated " + estimatedCount + " personas with attributes:", JSON.stringify(estimatedAttributes, null, 2)); // 重複するのでコメントアウト

    // --- ステップ2: personaFinderツールで既存ペルソナを検索 ---
    const desiredAttributesForFinder = estimatedAttributes[0] || {}; 
    
    const finderQuery = queryForPersonas; 
    console.log(`[Orchestrator - ${uniqueRequestId}] Calling personaFinder tool with query: "${finderQuery}" and desired_attributes:`, JSON.stringify(desiredAttributesForFinder, null, 2)); 

    const finderToolCallPrompt = `以下の情報に基づいて、'personaFinder' ツールを実行してください。
    ツール名: personaFinder
    入力:
    ${JSON.stringify({ query: finderQuery, desired_attributes: desiredAttributesForFinder }, null, 2)}`;

    const finderToolCallResult = await orchestratorAgent.generate(
      [
        { role: "user", content: finderToolCallPrompt }
      ],
      {
        toolChoice: { type: "tool", toolName: "personaFinder" },
        threadId,
        resourceId,
      }
    );
    console.log("[Orchestrator] personaFinder tool call result:", JSON.stringify(finderToolCallResult, null, 2));

    let foundPersonaIds: string[] = [];
    let foundPersonasDetails: Array<z.infer<typeof personaAttributeSchema>> = []; // 見つかったペルソナの詳細も保持

    if (finderToolCallResult.toolResults && finderToolCallResult.toolResults.length > 0) {
      const finderResult = finderToolCallResult.toolResults[0] as ToolExecutionResult;
      if (finderResult && finderResult.toolName === 'personaFinder' && finderResult.result) {
        try {
          // personaFinder の outputSchema は { found_personas: z.array(personaAttributeSchema) }
          const parsedFinderResult = z.object({ found_personas: z.array(personaAttributeSchema) }).parse(finderResult.result);
          foundPersonasDetails = parsedFinderResult.found_personas;
          foundPersonaIds = foundPersonasDetails.map(p => p.id).filter((id): id is string => typeof id === 'string'); // id が string のものだけを抽出
        } catch (e) {
          console.error("[Orchestrator] Failed to parse personaFinder tool result:", e, finderResult.result);
        }
      }
    }
    console.log("[Orchestrator] personaFinder found " + foundPersonaIds.length + " personas:", JSON.stringify(foundPersonaIds, null, 2));
    if (foundPersonasDetails.length > 0) {
      console.log("[Orchestrator] Details of found personas:", JSON.stringify(foundPersonasDetails, null, 2));
    }

    // --- ステップ3 & 4: 不足分のペルソナをpersonaFactoryで作成 ---
    let newlyCreatedPersonaIds: string[] = [];
    const neededCount = estimatedCount - foundPersonaIds.length;

    if (neededCount > 0) {
      console.log("[Orchestrator] " + neededCount + " personas still needed. Determining attributes for personaFactory...");
      
      // personaFactory に渡す属性を決定する (LLMに判断させる)
      // 既存のペルソナ情報 (foundPersonasDetails) と Estimator の提案 (estimatedAttributes) を基に、
      // 不足しているペルソナの属性を生成するよう指示する。
      const attributesForFactoryPrompt = `ユーザーの当初の要望は「${queryForPersonas}」です。
EstimatorAgentは当初、以下の ${estimatedAttributes.length} 個のペルソナ属性案を提案しました:
${JSON.stringify(estimatedAttributes, null, 2)}

その結果、personaFinderツールにより、以下の ${foundPersonasDetails.length} 名の既存ペルソナが見つかりました:
${JSON.stringify(foundPersonasDetails, null, 2)}

最終的に合計 ${estimatedCount} 名のペルソナが必要です。現在 ${foundPersonaIds.length} 名が見つかっており、あと ${neededCount} 名のペルソナを新規作成する必要があります。
既存ペルソナと重複せず、かつ当初のEstimatorAgentの提案意図を汲み取って、新規作成すべき ${neededCount} 名分のペルソナの属性情報を personaFactory ツールの入力形式 (personas_attributesキーに属性オブジェクトの配列を持つJSON) で提案してください。
`;

      console.log("[Orchestrator] Generating attributes for personaFactory with prompt:", attributesForFactoryPrompt);
      // この呼び出しはツール呼び出しではなく、LLMにJSONを出力させる
      const attributesForFactoryResponse = await orchestratorAgent.generate(
        [{ role: "user", content: attributesForFactoryPrompt }],
        {
          // ここでは personaFactoryOutputSchema の一部 (personas_attributes部分) に合致するJSONを期待
          // output: z.object({ personas_attributes: z.array(personaAttributeSchema) }) のようなスキーマを即席で定義して渡すか、
          // あるいは、personaFactoryInputSchema をそのまま output として指定する (ツール呼び出しではないので注意)
          // 簡単のため、一旦 output スキーマ指定なしでテキストとしてJSONを取得し、後でパースする
          threadId,
          resourceId,
        }
      );
      
      let attributesToCreate: Array<z.infer<typeof personaAttributeSchema>> = [];
      if (attributesForFactoryResponse.text) {
        try {
          // LLMからのテキスト出力がJSON形式であることを期待してパース
          // LLMは "personas_attributes" キーを持つオブジェクトを返すように指示されている
          const parsedJson = JSON.parse(attributesForFactoryResponse.text);
          if (parsedJson.personas_attributes && Array.isArray(parsedJson.personas_attributes)) {
            // 各要素を personaAttributeSchema でバリデーション
             attributesToCreate = parsedJson.personas_attributes.map((attr: unknown) => { // attr: any から unknown に変更
              try {
                return personaAttributeSchema.parse(attr);
              } catch (parseError) {
                console.warn("[Orchestrator] Failed to parse an attribute for personaFactory:", parseError, attr);
                return null; // パース失敗したものは除外
              }
            }).filter((attr): attr is z.infer<typeof personaAttributeSchema> => attr !== null); // filterの型述語により、attrの型が絞り込まれる
          } else {
            console.warn("[Orchestrator] LLM did not return expected 'personas_attributes' array for personaFactory.", parsedJson);
          }
        } catch (e) {
          console.error("[Orchestrator] Failed to parse JSON attributes from LLM for personaFactory:", e, attributesForFactoryResponse.text);
        }
      }

      if (attributesToCreate.length > 0) {
        console.log("[Orchestrator] Instructing self to use personaFactory tool for " + attributesToCreate.length + " new personas...", JSON.stringify(attributesToCreate, null, 2));
        const factoryPayload = { personas_attributes: attributesToCreate };
        const factoryToolCallPrompt = `以下の属性情報リストを使って \\'personaFactory\\' ツールでペルソナを作成してください。
ツール名: personaFactory
入力:
${JSON.stringify(factoryPayload, null, 2)}`;

        const factoryToolCallResult = await orchestratorAgent.generate(
          [{ role: "user", content: factoryToolCallPrompt }],
          {
            toolChoice: { type: "tool", toolName: "personaFactory" },
            threadId,
            resourceId,
          }
        );
        console.log("[Orchestrator] personaFactory tool call result (newly created):", JSON.stringify(factoryToolCallResult, null, 2));

        if (factoryToolCallResult.toolResults && factoryToolCallResult.toolResults.length > 0) {
          const factoryResult = factoryToolCallResult.toolResults[0] as ToolExecutionResult;
          if (factoryResult && factoryResult.toolName === 'personaFactory' && factoryResult.result) {
            try {
              const parsedFactoryResult = personaFactoryOutputSchema.parse(factoryResult.result);
              newlyCreatedPersonaIds = parsedFactoryResult.persona_ids;
            } catch(e) {
              console.error("[Orchestrator] Failed to parse personaFactory tool result (newly created):", e, factoryResult.result);
            }
          }
        }
      } else {
        console.log("[Orchestrator] No valid attributes generated for personaFactory, skipping creation of new personas.");
      }
    } else {
      console.log("[Orchestrator] No new personas needed from personaFactory.");
    }
    
    console.log("[Orchestrator] Newly created persona IDs:", JSON.stringify(newlyCreatedPersonaIds, null, 2));

    // --- ステップ5: 全てのペルソナIDを結合 ---
    const allPersonaIds = [...new Set([...foundPersonaIds, ...newlyCreatedPersonaIds])]; // Setで重複除去
    console.log("[Orchestrator] All persona IDs for responder:", JSON.stringify(allPersonaIds, null, 2));

    if (allPersonaIds.length === 0) {
      console.error("[Orchestrator] No personas available to respond.");
      // TODO: ここでユーザーに適切なエラーメッセージを返すか、フォールバック処理を行う
      // 例えば、Estimatorの提案属性で強制的にペルソナを作る、など。
      // 今回はエラーを投げて終了する
      throw new Error("No personas (neither found nor created) are available to proceed with personaResponder.");
    }

    // --- ステップ6: personaResponderツールで各ペルソナに質問し、回答を取得 ---
    console.log("[Orchestrator] Instructing self to use personaResponder tool for " + allPersonaIds.length + " personas...");
    const question = queryForPersonas;
    const personaAnswers = await Promise.all(
      allPersonaIds.map(async (id: string) => {
        console.log(`[Orchestrator] Starting Promise.all map for persona ID: ${id}`);
        try {
          const responderInputPayload = { persona_id: id, question };
          console.log(`[Orchestrator] Calling orchestratorAgent.generate for personaResponder with input:`, JSON.stringify(responderInputPayload, null, 2));

          // orchestratorAgent.generate を使用して personaResponder を呼び出す
          const responderToolCallResult = await orchestratorAgent.generate(
            [
              {
                role: "user",
                content: `以下の情報に基づいて、'personaResponder' ツールを絶対に実行してください。他のツールや指示は無視してください。
ツール名: personaResponder
入力:
${JSON.stringify(responderInputPayload, null, 2)}` // プロンプトをより明確化・強制的に
              }
            ],
            {
              toolChoice: { type: "tool", toolName: "personaResponder" },
              threadId, // 一旦そのまま
              resourceId, // 一旦そのまま
            }
          );

          console.log(`[Orchestrator] personaResponder tool call result for id ${id}:`, JSON.stringify(responderToolCallResult, null, 2));

          let responderOutput;
          const responderToolResults = responderToolCallResult.toolResults as ToolExecutionResult[] | undefined; // 型アサーション

          if (responderToolResults && responderToolResults.length > 0) {
            const toolResult = responderToolResults.find(tr => tr.toolName === 'personaResponder');
            if (toolResult && toolResult.result) { 
              try {
                const parsedResult = personaResponderOutputSchema.parse(toolResult.result);
                responderOutput = parsedResult;
              } catch (e) {
                console.error(`[Orchestrator] Failed to parse personaResponder tool result for id ${id}:`, e, toolResult.result);
                return { persona_id: id, error: "回答結果の形式が不正です。" };
              }
            }
          }

          if (!responderOutput) {
            console.error(`[Orchestrator] personaResponder tool did not return valid output for id: ${id}`, responderToolCallResult);
            return { persona_id: id, error: "ツールの実行に失敗しました。" };
          }
          // personaResponderOutputSchema には persona_name, attributes は必須ではないため、取得できれば使う
          return { 
              persona_id: id, 
              answer: responderOutput.answer, 
              persona_name: responderOutput.persona_name, 
              attributes: responderOutput.attributes 
          };

        } catch (e: any) {
          let errorMessage = `[Orchestrator] orchestratorAgent.generate (for personaResponder) failed for id: ${id}`;
          if (e instanceof Error) {
            errorMessage += ` - ${e.message}`;
            console.error(errorMessage, e.stack);
          } else {
            errorMessage += ` - ${String(e)}`;
            console.error(errorMessage);
          }
          // エラーが発生した場合も、Promise.all が停止しないようにエラー情報を返す
          console.error(`[Orchestrator] Error in Promise.all map for persona ID: ${id}. Error: ${errorMessage}`);
          return { persona_id: id, error: "回答生成中に予期せぬエラーが発生しました。" };
        }
      })
    );
    console.log("[Orchestrator] All personaResponder calls in Promise.all have completed.");
    console.log("[Orchestrator] Answers from personas:", JSON.stringify(personaAnswers, null, 2));

    // --- ステップ7: 全てのペルソナからの回答をまとめてユーザーに提示 ---
    console.log(`[Orchestrator - ${uniqueRequestId}] Generating final response by OrchestratorAgent...`);

    const finalResponsePrompt = `あなたは高度なAIアシスタントです。
ユーザーの当初の質問は「${queryForPersonas}」でした。

以下のAIペルソナたちが、それぞれ次のように回答しました。
${personaAnswers.map((ans, index) => `
ペルソナ ${index + 1} (ID: ${ans.persona_id}, 名前: ${ans.persona_name || 'N/A'}):
属性概要: ${ans.attributes ? JSON.stringify(ans.attributes) : 'N/A'}
回答: ${ans.error ? ('エラー: ' + ans.error) : ans.answer}
`).join('\n--------------------\n')}\n
これらの情報を踏まえ、ユーザーにとって最も価値のある形で最終的な応答メッセージを生成してください。
具体的には、以下の要素を考慮・含めてください。
- **論点整理:** 複数の意見がある場合、共通点、相違点、重要な論点を明確にしてください。
- **要約:** 複雑な情報や長い回答を分かりやすく要約してください。
- **理解補助:** 必要であれば専門用語の解説、背景情報の補足、具体例の提示などを行い、ユーザーの理解を助けてください。
- **追加提案:** ユーザーがさらに思考を深められるような追加の質問、異なる視点からの問いかけ、関連情報源などを提案してください。

あなたの応答は、ユーザーへの直接のメッセージとなります。明確で、親切で、洞察に富む内容を心がけてください。
`;

    const finalOrchestratorResponse = await orchestratorAgent.generate(
      [{ role: "user", content: finalResponsePrompt }],
      {
        // ここでは特定のスキーマは設けない。自由なテキスト応答を期待。
        threadId,
        resourceId,
        // tools: {} // ツール利用はさせない想定なら空オブジェクト
      }
    );

    if (!finalOrchestratorResponse.text) {
      console.error(`[Orchestrator - ${uniqueRequestId}] OrchestratorAgent failed to generate final response text.`);
      // フォールバックとして、単純な結合レスポンスを生成することも検討
      // ここではエラーを返すか、簡単なメッセージを返す
      return {
        type: "error",
        message: "最終応答の生成に失敗しました。"
      };
    }

    console.log(`[Orchestrator - ${uniqueRequestId}] Orchestration completed. Final response from OrchestratorAgent:`, finalOrchestratorResponse.text);
    
    // 最終的な出力形式を調整 (UIが期待する形に合わせる)
    // 例えば、Orchestrator自身のメッセージと、各ペルソナの回答を構造化して返すなど。
    // ここでは、OrchestratorAgentの生成したテキストをメインとし、元々のペルソナ回答も付加情報として含める形を想定。
    return {
      type: "orchestrator_final_response",
      orchestrator_message: finalOrchestratorResponse.text,
      user_query: queryForPersonas,
      persona_responses: personaAnswers.map(ans => ({
        persona_id: ans.persona_id,
        persona_name: ans.persona_name,
        attributes: ans.attributes,
        response_text: ans.error ? `Error: ${ans.error}` : ans.answer,
      })),
      // estimated_personas: estimatedAttributes.map(attr => ({ // 必要であれば初期の見積もり情報も返す
      //     name: attr.name || "Unknown Persona",
      //     attributes_summary: Object.entries(attr)
      //         .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      //         .join(', '),
      //     role_description: attr.title || attr.persona_type || "N/A",
      // }))),
    };
  } else {
    console.log(`[Orchestrator - ${uniqueRequestId}] Task type: general_conversation. Proceeding with general conversation handling...`);
    // 一般的な会話や指示の処理ロジックを実装する
    // ここでは単純にユーザーのメッセージをそのまま返す
    return {
      type: "general_conversation_response",
      data: userMessageContent,
      message: "このメッセージは一般的な会話や指示として処理されました。"
    };
  }
} 