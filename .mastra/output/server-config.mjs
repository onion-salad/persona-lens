import { z } from 'zod';
import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';

const orchestratorAgent = new Agent({
  name: "orchestratorAgent",
  model: openai("gpt-4o"),
  // tools: { personaFactory }, // Structured Outputに集中するため、一旦ツール定義を除外
  instructions: `
\u3042\u306A\u305F\u306F\u30E6\u30FC\u30B6\u30FC\u306E\u8981\u671B\u3092\u5206\u6790\u3057\u3001\u6700\u9069\u306A\u4EEE\u60F3\u5C02\u9580\u5BB6\u30C1\u30FC\u30E0\u3092\u63D0\u6848\u3059\u308B\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u3067\u3059\u3002
\u30E6\u30FC\u30B6\u30FC\u304B\u3089\u306E\u5165\u529B\uFF08\u8AB2\u984C\u3084\u76EE\u7684\uFF09\u3092\u7406\u89E3\u3057\u3001\u63D0\u6848\u5185\u5BB9\u3092\u69CB\u9020\u5316\u3055\u308C\u305F\u30C7\u30FC\u30BF\u3068\u3057\u3066\u8FD4\u5374\u3057\u3066\u304F\u3060\u3055\u3044\u3002
\u91CD\u8981\u306A\u306E\u306F\u3001\u63D0\u6848\u3055\u308C\u308B\u5C02\u9580\u5BB6\u30EA\u30B9\u30C8(\`experts\`)\u3068\u305D\u306E\u30B5\u30DE\u30EA\u30FC(\`summary\`)\u3092\u660E\u78BA\u306B\u3059\u308B\u3053\u3068\u3067\u3059\u3002
`
  // output/structuredOutput は generate 時に指定するため、ここでは削除
});

const expertSchema = z.object({
  name: z.string().describe("\u5C02\u9580\u5BB6\u306E\u540D\u524D"),
  attributes: z.string().describe("\u5C02\u9580\u5BB6\u306E\u5C5E\u6027 (\u696D\u7A2E/\u5F79\u8077/\u898F\u6A21\u306A\u3069)"),
  profile: z.string().describe("\u5C02\u9580\u5BB6\u306E\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u6982\u8981")
});
const expertProposalSchema = z.object({
  experts: z.array(expertSchema).describe("\u63D0\u6848\u3055\u308C\u305F\u4EEE\u60F3\u5C02\u9580\u5BB6\u306E\u30EA\u30B9\u30C8"),
  summary: z.object({
    persona_count: z.number().describe("\u63D0\u6848\u3055\u308C\u305F\u30DA\u30EB\u30BD\u30CA\u306E\u6570"),
    main_attributes: z.string().describe("\u4E3B\u306A\u5C5E\u6027\u306E\u6982\u8981")
    // 必要であれば他のサマリー情報も追加可能
  }).describe("\u63D0\u6848\u306E\u30B5\u30DE\u30EA\u30FC")
});

const RequestBodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string()
    })
  ).min(1)
});
async function handleGenerateExpertProposal(ctx) {
  const logger = ctx.get("logger");
  const req = ctx.req;
  if (req.method !== "POST") {
    return ctx.json({ message: "Method Not Allowed" }, 405);
  }
  try {
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      logger.error("Failed to parse request body:", e);
      return ctx.json({ message: "Invalid JSON body" }, 400);
    }
    let validatedBody;
    try {
      validatedBody = RequestBodySchema.parse(requestBody);
    } catch (validationError) {
      logger.error("Request body validation failed:", validationError);
      return ctx.json({ message: "Invalid request body", details: validationError.errors }, 400);
    }
    const userMessage = validatedBody.messages.filter((m) => m.role === "user").pop();
    if (!userMessage) {
      logger.error("No user message found in the request body");
      return ctx.json({ message: "User message is required" }, 400);
    }
    logger.info(`Received request for expert proposal with message: "${userMessage.content.substring(0, 50)}..."`);
    const result = await orchestratorAgent.generate(
      [userMessage],
      {
        output: expertProposalSchema
      }
    );
    logger.info("Agent generated expert proposal successfully.");
    if (result.object) {
      return ctx.json(result.object, 200);
    } else {
      logger.error("Agent did not return a valid structured object.", result);
      return ctx.json({ message: "Failed to generate structured proposal" }, 500);
    }
  } catch (error) {
    logger.error("Error in handleGenerateExpertProposal handler:", error);
    return ctx.json({ message: "Internal server error" }, 500);
  }
}

const server = {
  port: 4111,
  host: "0.0.0.0",
  apiRoutes: [{
    path: "/api/generate-expert-proposal",
    method: "POST",
    handler: handleGenerateExpertProposal
  }]
};

export { server };
