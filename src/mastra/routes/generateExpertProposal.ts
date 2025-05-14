import { z } from "zod";
import { type Context } from "hono"; // HonoのContextを仮定してインポート
// orchestratorAgentの直接呼び出しは不要になる
// import { orchestratorAgent } from "../agents/orchestratorAgent";
import { runOrchestrator } from "../agents/orchestratorAgent"; // runOrchestratorをインポート
import crypto from 'crypto'; // cryptoモジュールをインポート
// expertProposalSchema は runOrchestrator 内部で使われるため、ここでの直接利用は不要になる場合がある

// リクエストボディのスキーマ
const RequestBodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    })
  ).min(1),
});

// ハンドラ関数
export async function handleGenerateExpertProposal(ctx: Context): Promise<Response | void> {
  const logger = ctx.get('logger');
  const req = ctx.req;

  // デバッグログは残しても良いが、本番では削除またはレベル調整を検討
  console.log("handleGenerateExpertProposal called. ctx:", ctx);
  console.log("typeof ctx.get:", typeof ctx.get);
  console.log("typeof ctx.req:", typeof ctx.req);
  console.log("typeof ctx.json:", typeof ctx.json);

  if (req.method !== 'POST') {
    // @ts-ignore
    return ctx.json({ message: 'Method Not Allowed' }, 405);
  }

  try {
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      logger?.error('Failed to parse request body:', e);
      // @ts-ignore
      return ctx.json({ message: 'Invalid JSON body' }, 400);
    }

    let validatedBody;
    try {
      validatedBody = RequestBodySchema.parse(requestBody);
    } catch (validationError) {
      logger?.error('Request body validation failed:', validationError);
      // @ts-ignore
      return ctx.json({ message: 'Invalid request body', details: (validationError as z.ZodError).errors }, 400);
    }

    const userMessage = validatedBody.messages.filter(m => m.role === 'user').pop();

    if (!userMessage || !userMessage.content) { // contentの存在もチェック
      logger?.error('No user message content found in the request body');
      // @ts-ignore
      return ctx.json({ message: 'User message content is required' }, 400);
    }

    logger?.info(`Received request for expert proposal with message: \"${userMessage.content.substring(0, 100)}...\"`);

    // runOrchestrator を呼び出し、結果を受け取る
    // threadIdとresourceIdを生成して渡す
    const threadId = crypto.randomUUID();
    const resourceId = crypto.randomUUID(); // 本来はユーザーIDなどに紐づける
    const result = await runOrchestrator(userMessage.content, threadId, resourceId);

    logger?.info('Orchestration process completed successfully.');

    // runOrchestrator が最終的なレスポンスオブジェクトを返すので、それをそのまま返す
    // @ts-ignore
    return ctx.json(result, 200);

  } catch (error: any) { // エラーの型をanyに
    logger?.error('Error in handleGenerateExpertProposal handler:', error);
    // @ts-ignore
    return ctx.json({ message: 'Internal server error', error: error.message || 'Unknown error' }, 500);
  }
} 