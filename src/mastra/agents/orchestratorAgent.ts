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
import personaFinder, { PersonaFinderTool } from "../tools/personaFinder"; // personaFinderをインポートし、型もインポート
import { expertProposalSchema } from "../schemas/expertProposalSchema";
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
  tools: { personaFactory, personaResponder, personaFinder }, // personaFinder をツールに追加
  instructions: `あなたはB2B仮想専門家会議のオーケストレーターです。
ユーザーの要望に応じて、以下のステップで処理を実行します。
1. まず、'estimatorAgent' にユーザーの要望を伝え、最適なペルソナの属性リストと必要なペルソナ数を取得します。
2. 次に、ユーザーの元の要望と estimatorAgent が提案した属性を 'personaFinder' ツールに渡し、既存ペルソナを検索します。入力は query と desired_attributes です。
3. estimatorAgent が提案したペルソナ数に対して、personaFinder で見つかったペルソナが不足しているか、または質的に不十分な場合は、不足分のペルソナの属性を決定します。
4. 不足分のペルソナがいれば、その属性リストを 'personaFactory' ツールに 'personas_attributes' というキーで渡し、ペルソナを作成して、そのIDのリストを取得します。
5. personaFinder で見つかったペルソナと personaFactory で新規作成されたペルソナのIDを結合します。
6. 最後に、結合された各ペルソナIDとユーザーからの当初の質問を 'personaResponder' ツールに渡し、各ペルソナからの回答を取得します。
7. 全てのペルソナからの回答をまとめて、ユーザーに提示してください。
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
  const uniqueRequestId = `orchestrator-run-${Date.now()}-${Math.random().toString(36).substring(7)}`; // 簡単なユニークID生成
  console.log(`[Orchestrator START - ${uniqueRequestId}] Starting orchestration with user message:`, userMessageContent, { threadId, resourceId });

  type EstimatorOutputType = z.infer<typeof estimatorOutputSchema>;

  // --- ステップ1: EstimatorAgentを実行して、ペルソナの数と基本属性を見積もる ---
  console.log(`[Orchestrator - ${uniqueRequestId}] Calling EstimatorAgent...`);
  const estimationResponse = await estimatorAgent.generate(
    [{ role: "user", content: userMessageContent }], 
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
  
  const finderQuery = userMessageContent; 
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
    const attributesForFactoryPrompt = `ユーザーの当初の要望は「${userMessageContent}」です。
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
  const question = userMessageContent;
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
  const finalOutput = expertProposalSchema.parse({
    user_query: userMessageContent,
    estimated_personas: estimatedAttributes.map(attr => ({
        name: attr.name || "Unknown Persona",
        attributes_summary: Object.entries(attr)
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join(', '),
        role_description: attr.title || attr.persona_type || "N/A",
    })),
    expert_responses: personaAnswers.map(ans => ({
        persona_id: ans.persona_id,
        response_text: ans.error ? `Error: ${ans.error}` : ans.answer,
        persona_name: ans.persona_name,
        attributes: ans.attributes,
    })),
    summary: "複数の専門家からの意見をまとめました。", 
    next_steps: ["具体的なアクションプランの策定", "追加の質問"], 
  });
  
  console.log("[Orchestrator] Orchestration completed. Final output:", JSON.stringify(finalOutput, null, 2));
  return finalOutput;
} 