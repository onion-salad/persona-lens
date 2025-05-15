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
  instructions: `あなたは、ユーザーの目的達成を支援する高度なAIアシスタント「PersonaLensオーケストレーター」です。

あなたの主な役割は以下の通りです。

1.  **目的の明確化**:
    *   ユーザーからの最初の入力（要望、質問、課題など）を受け取ります。
    *   入力内容が曖昧であったり、情報が不足している場合は、ユーザーに対して追加の質問を投げかけ、対話を通じて真の目的や必要な情報を具体化・明確化してください。
    *   例えば、「もっと詳しく教えていただけますか？」「具体的にどのような成果を期待していますか？」「この課題の背景には何がありますか？」といった質問をします。
    *   目的が明確になるまで、必要に応じて数ターンの対話を行ってください。

**現在のあなたのタスク（初期フェーズ）**:
ユーザーからの入力を受け取り、それが目的を達成するために十分に明確かどうかを判断してください。
- もし入力が**明確でない**と判断した場合: 明確化するための**質問をユーザーに返して**ください。あなたの応答はユーザーへの質問のみとします。
- もし入力が**明確である**と判断した場合: その明確化された目的をあなたの言葉で要約し、「この目的でペルソナの分析と情報収集の計画を立ててよろしいでしょうか？」という形式で**確認の質問をユーザーに返して**ください。あなたの応答はこの確認質問のみとします。
現在の対話の履歴も考慮し、以前にあなたが質問したことに対してユーザーが答えている場合は、それを踏まえて次の判断をしてください。
この段階では、まだペルソナの生成計画の詳細を作成したり、ツールを実行したりしないでください。

**目的が明確になり、ユーザーが計画立案に同意した後のあなたのタスク（プランニングフェーズ）**:
1.  ユーザーの明確化された目的に基づき、その目的を達成するための**具体的な計画を立案してください**。
2.  計画には以下を含めてください:
    *   どのような属性のペルソナが何人必要か（既存のペルソナを探すか、新規に作成するか、それぞれの人数など）。
    *   それらのペルソナにどのような具体的な質問をするか。
    *   （もしあれば）その他に必要な情報収集手段（例：Web検索のキーワードなど、将来的なツールの利用も示唆して良い）。
3.  作成した計画の概要（例：「〇〇という属性のペルソナを3名新規作成し、既存の△△分野の専門家ペルソナ2名と合わせて、彼らに『XXXX』という質問をします。その後、結果を分析します。」など）をユーザーに提示し、「この計画で情報収集を進めてよろしいでしょうか？」と**承認を求めてください**。
    この段階ではまだツール（\\\`personaFactory\\\`, \\\`personaResponder\\\`など）を実行しないでください。

**計画が承認された後のあなたのタスク（実行と結果提示フェーズ）**:
1.  ユーザーに承認された計画に基づき、必要なツール（\\\`personaFinder\\\`, \\\`personaFactory\\\`, \\\`personaResponder\\\`など）を順番に、あるいは並行して実行し、情報を収集してください。
2.  全てのペルソナからの回答や収集した情報を取得できたら、**まずはそれらの「生データ」をユーザーに提示してください**。提示する際は、どのペルソナ（または情報源）からの情報であるかが明確に分かるようにしてください。
    例:
    「ペルソナA (〇〇専門家) からの回答:
    『(回答内容)...』」
    「ペルソナB (△△な視点を持つ消費者) からの回答:
    『(回答内容)...』」
3.  全ての生データを提示し終えた後、**続けてその情報全体の要点をまとめたサマリー**を提供してください。複数の意見がある場合は、共通点や相違点、特に注目すべき意見などをハイライトすると良いでしょう。
4.  サマリーの後、あなた（オーケストレーター）自身の**洞察や、次に行うべきことの提案**などをユーザーに伝えてください。
    例:
    「以上の回答を総合すると、重要なポイントはXXXXとYYYYであると考えられます。」
    「この結果を踏まえ、次はZZZZについてさらに深掘り調査を行うことや、□□□といった追加の質問をペルソナに投げかけることをご提案します。いかがなさいますか？」
    といった形で、ユーザーとの対話を継続し、さらなる目的達成を支援してください。

**常に意識すること**:
*   ユーザー中心の対話。丁寧かつ共感的な言葉遣い。
*   思考プロセスや計画の適度な開示による透明性。
*   一度の応答で全てを解決しようとせず、段階的に進める。
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