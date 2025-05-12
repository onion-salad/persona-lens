import { z } from "zod";
import { type Context } from "hono"; // HonoのContextを仮定してインポート
import { orchestratorAgent } from "../agents/orchestratorAgent";
import { expertProposalSchema } from "../schemas/expertProposalSchema";

// リクエストボディのスキーマ
const RequestBodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    })
  ).min(1),
});

// ハンドラ関数はHonoのContextライクなものを期待
export async function handleGenerateExpertProposal(ctx: Context): Promise<Response | void> {
  // --- デバッグログ追加 ---
  console.log("handleGenerateExpertProposal called. ctx:", ctx);
  console.log("typeof ctx.get:", typeof ctx.get);
  console.log("typeof ctx.req:", typeof ctx.req);
  console.log("typeof ctx.json:", typeof ctx.json);
  // --- デバッグログ追加ここまで ---

  const logger = ctx.get('logger'); // MastraがHonoのctx.get/setでloggerを注入していると仮定
  const req = ctx.req;

  if (req.method !== 'POST') {
    // @ts-ignore // ctx.json が存在しない可能性を考慮
    return ctx.json({ message: 'Method Not Allowed' }, 405);
  }

  try {
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      // @ts-ignore // logger が存在しない可能性を考慮
      logger?.error('Failed to parse request body:', e);
      // @ts-ignore // ctx.json が存在しない可能性を考慮
      return ctx.json({ message: 'Invalid JSON body' }, 400);
    }

    let validatedBody;
    try {
      validatedBody = RequestBodySchema.parse(requestBody);
    } catch (validationError) {
      // @ts-ignore // logger が存在しない可能性を考慮
      logger?.error('Request body validation failed:', validationError);
      // @ts-ignore // ctx.json が存在しない可能性を考慮
      return ctx.json({ message: 'Invalid request body', details: (validationError as z.ZodError).errors }, 400);
    }

    const userMessage = validatedBody.messages.filter(m => m.role === 'user').pop();

    if (!userMessage) {
      // @ts-ignore // logger が存在しない可能性を考慮
      logger?.error('No user message found in the request body');
      // @ts-ignore // ctx.json が存在しない可能性を考慮
      return ctx.json({ message: 'User message is required' }, 400);
    }

    // @ts-ignore // logger が存在しない可能性を考慮
    logger?.info(`Received request for expert proposal with message: \\"${userMessage.content.substring(0, 50)}...\\"`);

    const result = await orchestratorAgent.generate(
      [userMessage],
      {
        output: expertProposalSchema,
      }
    );

    // @ts-ignore // logger が存在しない可能性を考慮
    logger?.info('Agent generated expert proposal successfully.');

    // @ts-ignore
    if (result.object) {
      // @ts-ignore // ctx.json が存在しない可能性を考慮
      return ctx.json(result.object, 200);
    } else {
      // @ts-ignore // logger が存在しない可能性を考慮
      logger?.error('Agent did not return a valid structured object.', result);
      // @ts-ignore // ctx.json が存在しない可能性を考慮
      return ctx.json({ message: 'Failed to generate structured proposal' }, 500);
    }

  } catch (error) {
    // @ts-ignore // logger が存在しない可能性を考慮
    logger?.error('Error in handleGenerateExpertProposal handler:', error);
    // @ts-ignore // ctx.json が存在しない可能性を考慮
    return ctx.json({ message: 'Internal server error' }, 500);
  }
} 