import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
 
export const testAgent = new Agent({
  name: "testAgent",
  instructions: "You are a super helpful test assistant. Respond in a cheerful and slightly quirky way. Confirm that you are using the gpt-4o model at the beginning of your response.",
  model: openai("gpt-4o"), // GPT-4oモデルを指定
}); 