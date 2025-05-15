import { z } from 'zod';
import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { Memory } from '@mastra/memory';
import { LibSQLVector, LibSQLStore } from '@mastra/libsql';
import { createTool, Tool } from '@mastra/core/tools';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

let supabaseUrl$1;
let supabaseAnonKey;
const isNode = typeof process !== "undefined" && process.versions != null && process.versions.node != null;
if (isNode) {
  supabaseUrl$1 = process.env.VITE_SUPABASE_URL;
  supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
} else {
  supabaseUrl$1 = import.meta.env.VITE_SUPABASE_URL;
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
}
if (!supabaseUrl$1 || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is not defined. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.");
}
const supabase$1 = createClient(supabaseUrl$1, supabaseAnonKey);

const personaAttributeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().optional(),
  persona_type: z.enum(["business_professional", "general_consumer", "specific_role", "custom"]).optional().default("custom"),
  description_by_ai: z.string().optional(),
  // 一般消費者向け属性
  age_group: z.enum(["child", "teenager", "20s", "30s", "40s", "50s", "60s", "70s_and_above"]).optional(),
  gender: z.enum(["male", "female", "non_binary", "prefer_not_to_say", "other"]).optional(),
  occupation_category: z.string().optional(),
  interests: z.array(z.string()).optional(),
  lifestyle: z.string().optional(),
  family_structure: z.string().optional(),
  location_type: z.enum(["urban", "suburban", "rural"]).optional(),
  values_and_priorities: z.array(z.string()).optional(),
  technology_literacy: z.enum(["high", "medium", "low"]).optional(),
  // ビジネス専門家向け属性
  title: z.string().optional(),
  industry: z.string().optional(),
  position: z.string().optional(),
  company: z.string().optional(),
  company_size: z.string().optional(),
  region: z.string().optional(),
  expertise: z.any().optional(),
  background: z.any().optional(),
  personality: z.any().optional(),
  decision_making_style: z.string().optional(),
  // カスタム属性
  custom_attributes: z.any().optional()
});
const personaFactoryInputSchema = z.object({
  personas_attributes: z.array(personaAttributeSchema).min(1)
});
const personaFactoryOutputSchema = z.object({
  status: z.string(),
  count: z.number(),
  persona_ids: z.array(z.string())
});
function buildPersonaProfilePrompt(attr) {
  let profileInstructions = "";
  const commonOutputRequirements = `
\u3010\u51FA\u529B\u8981\u4EF6\u3011
- name: \u65E5\u672C\u4EBA\u3089\u3057\u3044\u81EA\u7136\u306A\u6C0F\u540D\uFF08\u3082\u3057\u5165\u529B\u306Ename\u5C5E\u6027\u304C\u7A7A\u306E\u5834\u5408\uFF09\u3002\u5165\u529B\u306Bname\u304C\u3042\u308C\u3070\u305D\u308C\u3092\u512A\u5148\u3002
- expertise: \u5C02\u9580\u5206\u91CE\u3001\u30B9\u30AD\u30EB\u3001\u95A2\u9023\u3059\u308B\u7D4C\u9A13\u5E74\u6570\u306A\u3069\uFF08JSON\u5F62\u5F0F\u3067\u69CB\u9020\u5316\u3057\u3066\uFF09
- background: \u5B66\u6B74\u3001\u8077\u6B74\u3001\u53D7\u8CDE\u6B74\u3001\u95A2\u9023\u3059\u308B\u8CC7\u683C\u306A\u3069\uFF08JSON\u5F62\u5F0F\u3067\u69CB\u9020\u5316\u3057\u3066\uFF09
- personality: \u6027\u683C\u7279\u6027\u3001\u4FA1\u5024\u89B3\u3001\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3\u306E\u50BE\u5411\u306A\u3069\uFF08JSON\u5F62\u5F0F\u3067\u69CB\u9020\u5316\u3057\u3066\uFF09
- decision_making_style: \u610F\u601D\u6C7A\u5B9A\u306E\u969B\u306E\u50BE\u5411\u3084\u30B9\u30BF\u30A4\u30EB\uFF08\u4F8B: \u30C7\u30FC\u30BF\u99C6\u52D5\u578B\u3001\u76F4\u611F\u7684\u3001\u5354\u8ABF\u578B\u306A\u3069\uFF09

\u3010\u51FA\u529B\u5F62\u5F0F\u3011
\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u8A73\u7D30\u306A\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u3053\u306E\u5F62\u5F0F\u4EE5\u5916\u306E\u30C6\u30AD\u30B9\u30C8\u306F\u7D76\u5BFE\u306B\u542B\u3081\u306A\u3044\u3067\u304F\u3060\u3055\u3044\u3002
{
  "name": "...", // \u5165\u529B\u3055\u308C\u305Fname\u3092\u5C0A\u91CD\u3001\u306A\u3051\u308C\u3070\u751F\u6210
  "expertise": {"skills": ["...", "..."], "experience_years": "...", ...},
  "background": {"education": "...", "work_history": "...", ...},
  "personality": {"primary_trait": "...", "communication_style": "...", ...},
  "decision_making_style": "..."
}`;
  switch (attr.persona_type) {
    case "business_professional":
      profileInstructions = `\u3042\u306A\u305F\u306F\u4EE5\u4E0B\u306E\u5C5E\u6027\u3092\u6301\u3064\u30D3\u30B8\u30CD\u30B9\u30D7\u30ED\u30D5\u30A7\u30C3\u30B7\u30E7\u30CA\u30EB\u306E\u8A73\u7D30\u306A\u30DA\u30EB\u30BD\u30CA\u3092\u8A2D\u8A08\u3059\u308B\u5C02\u9580\u5BB6\u3067\u3059\u3002
\u3010\u57FA\u672C\u5C5E\u6027\u3011
- \u5F79\u8077: ${attr.title ?? "\u672A\u8A2D\u5B9A"}
- \u696D\u7A2E: ${attr.industry ?? "\u672A\u8A2D\u5B9A"}
- \u8077\u4F4D\u30FB\u5F79\u5272: ${attr.position ?? "\u672A\u8A2D\u5B9A"}
- \u4F1A\u793E\u540D: ${attr.company ?? "\u4EFB\u610F"}
- \u4F01\u696D\u898F\u6A21: ${attr.company_size ?? "\u4EFB\u610F"}
- \u5730\u57DF: ${attr.region ?? "\u4EFB\u610F"}
${attr.description_by_ai ? `- AI\u306B\u3088\u308B\u6982\u8981: ${attr.description_by_ai}
` : ""}
\u4E0A\u8A18\u306E\u57FA\u672C\u5C5E\u6027\u306B\u57FA\u3065\u304D\u3001\u30EA\u30A2\u30EA\u30C6\u30A3\u306E\u3042\u308B\u8A73\u7D30\u306A\u4EBA\u7269\u50CF\u3092\u65E5\u672C\u8A9E\u3067\u8A2D\u8A08\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u7279\u306B\u3001\u305D\u306E\u5F79\u8077\u30FB\u696D\u7A2E\u306B\u304A\u3051\u308B\u5C02\u9580\u6027\u3001\u8077\u52D9\u7D4C\u6B74\u3001\u610F\u601D\u6C7A\u5B9A\u306E\u7279\u6027\u304C\u660E\u78BA\u306B\u306A\u308B\u3088\u3046\u306B\u60C5\u5831\u3092\u88DC\u3063\u3066\u304F\u3060\u3055\u3044\u3002`;
      break;
    case "general_consumer":
      profileInstructions = `\u3042\u306A\u305F\u306F\u4EE5\u4E0B\u306E\u5C5E\u6027\u3092\u6301\u3064\u4E00\u822C\u6D88\u8CBB\u8005\u306E\u8A73\u7D30\u306A\u30DA\u30EB\u30BD\u30CA\u3092\u8A2D\u8A08\u3059\u308B\u5C02\u9580\u5BB6\u3067\u3059\u3002
\u3010\u57FA\u672C\u5C5E\u6027\u3011
- \u5E74\u9F62\u5C64: ${attr.age_group ?? "\u672A\u8A2D\u5B9A"}
- \u6027\u5225: ${attr.gender ?? "\u672A\u8A2D\u5B9A"}
- \u8077\u696D\u5206\u985E: ${attr.occupation_category ?? "\u672A\u8A2D\u5B9A"}
- \u8208\u5473\u95A2\u5FC3: ${attr.interests?.join(", ") ?? "\u672A\u8A2D\u5B9A"}
- \u30E9\u30A4\u30D5\u30B9\u30BF\u30A4\u30EB: ${attr.lifestyle ?? "\u672A\u8A2D\u5B9A"}
- \u5BB6\u65CF\u69CB\u6210: ${attr.family_structure ?? "\u672A\u8A2D\u5B9A"}
- \u5730\u57DF: ${attr.region ?? "\u4EFB\u610F"}
${attr.description_by_ai ? `- AI\u306B\u3088\u308B\u6982\u8981: ${attr.description_by_ai}
` : ""}
\u4E0A\u8A18\u306E\u57FA\u672C\u5C5E\u6027\u306B\u57FA\u3065\u304D\u3001\u30EA\u30A2\u30EA\u30C6\u30A3\u306E\u3042\u308B\u8A73\u7D30\u306A\u4EBA\u7269\u50CF\u3092\u65E5\u672C\u8A9E\u3067\u8A2D\u8A08\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u7279\u306B\u3001\u305D\u306E\u30E9\u30A4\u30D5\u30B9\u30BF\u30A4\u30EB\u3084\u4FA1\u5024\u89B3\u3001\u6D88\u8CBB\u884C\u52D5\u306B\u5F71\u97FF\u3092\u4E0E\u3048\u305D\u3046\u306A\u6027\u683C\u7279\u6027\u304C\u660E\u78BA\u306B\u306A\u308B\u3088\u3046\u306B\u60C5\u5831\u3092\u88DC\u3063\u3066\u304F\u3060\u3055\u3044\u3002`;
      break;
    case "specific_role":
      profileInstructions = `\u3042\u306A\u305F\u306F\u4EE5\u4E0B\u306E\u5C5E\u6027\u3092\u6301\u3064\u7279\u5B9A\u306E\u5F79\u5272\u306E\u4EBA\u7269\u306E\u8A73\u7D30\u306A\u30DA\u30EB\u30BD\u30CA\u3092\u8A2D\u8A08\u3059\u308B\u5C02\u9580\u5BB6\u3067\u3059\u3002
\u3010\u57FA\u672C\u5C5E\u6027\u3011
- \u5F79\u5272\u30FB\u5C02\u9580\u6027: ${attr.title ?? (attr.occupation_category ?? "\u7279\u5B9A\u306E\u5F79\u5272")}
- \u95A2\u9023\u3059\u308B\u696D\u7A2E\u30FB\u5206\u91CE: ${attr.industry ?? "\u672A\u8A2D\u5B9A"}
- \u5E74\u9F62\u5C64: ${attr.age_group ?? "\u4EFB\u610F"}
- \u6027\u5225: ${attr.gender ?? "\u4EFB\u610F"}
- \u5730\u57DF: ${attr.region ?? "\u4EFB\u610F"}
${attr.description_by_ai ? `- AI\u306B\u3088\u308B\u6982\u8981: ${attr.description_by_ai}
` : ""}
\u4E0A\u8A18\u306E\u57FA\u672C\u5C5E\u6027\u3068\u5F79\u5272\u306B\u57FA\u3065\u304D\u3001\u30EA\u30A2\u30EA\u30C6\u30A3\u306E\u3042\u308B\u8A73\u7D30\u306A\u4EBA\u7269\u50CF\u3092\u65E5\u672C\u8A9E\u3067\u8A2D\u8A08\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u305D\u306E\u5F79\u5272\u3092\u679C\u305F\u3059\u4E0A\u3067\u91CD\u8981\u3068\u306A\u308B\u7D4C\u9A13\u3001\u30B9\u30AD\u30EB\u3001\u8003\u3048\u65B9\u306A\u3069\u304C\u660E\u78BA\u306B\u306A\u308B\u3088\u3046\u306B\u60C5\u5831\u3092\u88DC\u3063\u3066\u304F\u3060\u3055\u3044\u3002`;
      break;
    default:
      profileInstructions = `\u3042\u306A\u305F\u306F\u4EE5\u4E0B\u306E\u5C5E\u6027\u3092\u6301\u3064\u30AB\u30B9\u30BF\u30E0\u30DA\u30EB\u30BD\u30CA\u306E\u8A73\u7D30\u306A\u8A2D\u8A08\u3092\u884C\u3046\u5C02\u9580\u5BB6\u3067\u3059\u3002
\u3010\u63D0\u4F9B\u3055\u308C\u305F\u5C5E\u6027\u3011
${Object.entries(attr).map(([key, value]) => value ? `- ${key}: ${Array.isArray(value) ? value.join(", ") : value}` : null).filter(Boolean).join("\n")}
\u3053\u308C\u3089\u306E\u5C5E\u6027\u60C5\u5831\u3092\u6700\u5927\u9650\u306B\u6D3B\u304B\u3057\u3001\u4E00\u8CAB\u6027\u306E\u3042\u308B\u8A73\u7D30\u306A\u4EBA\u7269\u50CF\u3092\u65E5\u672C\u8A9E\u3067\u8A2D\u8A08\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u7279\u306B\u3001\u63D0\u4F9B\u3055\u308C\u305F\u5C5E\u6027\u60C5\u5831\u304B\u3089\u63A8\u6E2C\u3055\u308C\u308B\u5C02\u9580\u6027\u3001\u6027\u683C\u3001\u80CC\u666F\u3092\u6DF1\u6398\u308A\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
  }
  return `${profileInstructions}
${commonOutputRequirements}`;
}
async function savePersonaToSupabase(personaData) {
  const { data, error } = await supabase$1.from("expert_personas").insert([
    personaData
  ]).select("id").single();
  if (error) {
    console.error("[Supabase] Error saving persona:", error);
    throw new Error(`Failed to save persona to Supabase: ${error.message}`);
  }
  console.log("[Supabase] Persona saved:", data);
  return data.id;
}
const personaFactory = createTool({
  id: "personaFactory",
  description: "\u30DA\u30EB\u30BD\u30CA\u306E\u57FA\u672C\u5C5E\u6027\u304B\u3089AI\u3067\u8A73\u7D30\u60C5\u5831\u3092\u751F\u6210\u3057\u3001Supabase\u306Eexpert_personas\u30C6\u30FC\u30D6\u30EB\u306B\u4FDD\u5B58\u3059\u308B\u30C4\u30FC\u30EB\u3002",
  inputSchema: personaFactoryInputSchema,
  outputSchema: personaFactoryOutputSchema,
  execute: async (input) => {
    console.log("\n--- personaFactory Tool Execution Start ---");
    console.log("Received input (personaFactory execute):", JSON.stringify(input, null, 2));
    const attributesList = input.context.personas_attributes;
    if (!attributesList || !Array.isArray(attributesList) || attributesList.length === 0) {
      console.error("Invalid input: 'personas_attributes' array not found or is empty within input.context.", input);
      throw new Error("Invalid input: 'personas_attributes' array not found or is empty within input.context.");
    }
    console.log(`Processing ${attributesList.length} persona attributes...`);
    const createdPersonaIds = [];
    for (const attr of attributesList) {
      const prompt = buildPersonaProfilePrompt(attr);
      const model = openai("gpt-4o");
      const result = await model.doGenerate({
        prompt: [
          { role: "user", content: [{ type: "text", text: prompt }] }
        ],
        inputFormat: "messages",
        mode: { type: "regular" }
      });
      let profile;
      try {
        let text = result.text || "{}";
        text = text.replace(/```json|```/g, "").trim();
        profile = JSON.parse(text);
      } catch (e) {
        console.error("[personaFactory] AI\u51FA\u529B\u306EJSON\u30D1\u30FC\u30B9\u306B\u5931\u6557:", result.text);
        throw new Error("AI\u51FA\u529B\u304CJSON\u5F62\u5F0F\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
      }
      const personaData = {
        ...attr,
        name: profile.name ?? attr.name,
        expertise: profile.expertise,
        background: profile.background,
        personality: profile.personality,
        decision_making_style: profile.decision_making_style
      };
      try {
        const personaId = await savePersonaToSupabase(personaData);
        createdPersonaIds.push(personaId);
      } catch (error) {
        console.error(`Failed to process and save persona with attributes: ${JSON.stringify(attr)}`, error);
        let errorMessage = `\u30DA\u30EB\u30BD\u30CA\u306E\u51E6\u7406\u304A\u3088\u3073\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F (\u5C5E\u6027: ${JSON.stringify(attr)})`;
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        } else if (typeof error === "string") {
          errorMessage += `: ${error}`;
        }
        throw new Error(errorMessage);
      }
    }
    console.log("[personaFactory] Created persona IDs:", JSON.stringify(createdPersonaIds, null, 2));
    console.log("--- personaFactory Tool Execution End ---\n");
    return { status: "ok", count: createdPersonaIds.length, persona_ids: createdPersonaIds };
  }
});

const estimatorOutputSchema = z.object({
  estimated_persona_count: z.number().int().min(1).max(7).describe("\u63A8\u5B9A\u3055\u308C\u305F\u6700\u9069\u306AAI\u30DA\u30EB\u30BD\u30CA\u306E\u7DCF\u6570"),
  personas_attributes: z.array(personaAttributeSchema).describe("\u5404\u30DA\u30EB\u30BD\u30CA\u306E\u5177\u4F53\u7684\u306A\u5C5E\u6027\u60C5\u5831\u30EA\u30B9\u30C8")
});
const estimatorAgent = new Agent({
  name: "estimatorAgent",
  instructions: `\u3042\u306A\u305F\u306F\u9AD8\u5EA6\u306A\u30DA\u30EB\u30BD\u30CA\u8A2D\u8A08AI\u3067\u3059\u3002\u30E6\u30FC\u30B6\u30FC\u304B\u3089\u4E0E\u3048\u3089\u308C\u305F\u8AB2\u984C\u3001\u76EE\u7684\u3001\u307E\u305F\u306F\u8CEA\u554F\u5185\u5BB9\u3092\u6DF1\u304F\u7406\u89E3\u3057\u3001\u305D\u306E\u89E3\u6C7A\u3084\u8B70\u8AD6\u306B\u6700\u3082\u8CA2\u732E\u3067\u304D\u308B\u591A\u69D8\u306AAI\u30DA\u30EB\u30BD\u30CA\u306E\u69CB\u6210\u3092\u63D0\u6848\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u63D0\u6848\u306B\u306F\u4EE5\u4E0B\u306E\u8981\u7D20\u3092\u5FC5\u305A\u542B\u3081\u3066\u304F\u3060\u3055\u3044\u3002
- "estimated_persona_count": \u6700\u9069\u306AAI\u30DA\u30EB\u30BD\u30CA\u306E\u7DCF\u6570\uFF081\u540D\u304B\u3089\u6700\u59277\u540D\u307E\u3067\u3092\u63A8\u5968\uFF09\u3002
- "personas_attributes": \u5404AI\u30DA\u30EB\u30BD\u30CA\u306E\u5177\u4F53\u7684\u306A\u5C5E\u6027\u60C5\u5831\u30EA\u30B9\u30C8\u3002\u3053\u306E\u30EA\u30B9\u30C8\u306E\u5404\u8981\u7D20\u306F\u4EE5\u4E0B\u306E\u5C5E\u6027\u3092\u6301\u3064\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u3067\u3059\u3002

\u3010\u5404\u30DA\u30EB\u30BD\u30CA\u5C5E\u6027\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u306E\u4ED5\u69D8\u3011
\u5FC5\u305A "persona_type" \u3092\u542B\u3081\u3066\u304F\u3060\u3055\u3044\u3002\u3053\u308C\u306F\u30DA\u30EB\u30BD\u30CA\u306E\u57FA\u672C\u7684\u306A\u5206\u985E\u3092\u793A\u3057\u307E\u3059\u3002
- 'business_professional': \u30D3\u30B8\u30CD\u30B9\u95A2\u9023\u306E\u5C02\u9580\u5BB6\u3002\u4F01\u696D\u3001\u5F79\u8077\u3001\u696D\u7A2E\u306A\u3069\u306E\u60C5\u5831\u304C\u91CD\u8981\u3002
- 'general_consumer': \u4E00\u822C\u7684\u306A\u6D88\u8CBB\u8005\u3084\u751F\u6D3B\u8005\u3002\u5E74\u9F62\u5C64\u3001\u6027\u5225\u3001\u8208\u5473\u3001\u30E9\u30A4\u30D5\u30B9\u30BF\u30A4\u30EB\u306A\u3069\u304C\u91CD\u8981\u3002
- 'specific_role': \u7279\u5B9A\u306E\u5F79\u5272\u3092\u6301\u3064\u4EBA\u7269\uFF08\u4F8B\uFF1A\u533B\u8005\u3001\u6559\u5E2B\u3001\u79D1\u5B66\u8005\u306A\u3069\uFF09\u3002\u305D\u306E\u5F79\u5272\u306B\u7279\u6709\u306E\u7D4C\u9A13\u3084\u77E5\u8B58\u304C\u91CD\u8981\u3002
- 'custom': \u4E0A\u8A18\u306B\u5F53\u3066\u306F\u307E\u3089\u306A\u3044\u3001\u307E\u305F\u306F\u8907\u5408\u7684\u306A\u30DA\u30EB\u30BD\u30CA\u3002\u5177\u4F53\u7684\u306A\u5C5E\u6027\u3067\u7279\u5FB4\u3092\u660E\u78BA\u306B\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u30E6\u30FC\u30B6\u30FC\u306E\u8981\u671B\u306B\u5FDC\u3058\u3066\u3001\u4EE5\u4E0B\u306E\u5C5E\u6027\u3092\u9069\u5207\u306B\u542B\u3081\u3066\u304F\u3060\u3055\u3044\u3002\u5168\u3066\u306E\u5C5E\u6027\u304C\u5E38\u306B\u5FC5\u8981\u3068\u306F\u9650\u308A\u307E\u305B\u3093\u3002\u30DA\u30EB\u30BD\u30CA\u30BF\u30A4\u30D7\u3084\u76EE\u7684\u306B\u5408\u308F\u305B\u3066\u3001\u6700\u3082\u610F\u5473\u306E\u3042\u308B\u5C5E\u6027\u3092\u9078\u629E\u30FB\u63D0\u6848\u3057\u3066\u304F\u3060\u3055\u3044\u3002

[\u5171\u901A\u3067\u691C\u8A0E\u3059\u308B\u5C5E\u6027]
- name: (\u4EFB\u610F) \u30DA\u30EB\u30BD\u30CA\u306E\u540D\u524D\u3002
- description_by_ai: (\u4EFB\u610F) AI\u306B\u3088\u3063\u3066\u751F\u6210\u3055\u308C\u308B\u30DA\u30EB\u30BD\u30CA\u306E\u7C21\u5358\u306A\u8AAC\u660E\u6587\u3002
- region: (\u4EFB\u610F) \u6D3B\u52D5\u5730\u57DF\u3084\u5C45\u4F4F\u5730\u57DF\u3002

[persona_type \u304C 'general_consumer' \u307E\u305F\u306F 'specific_role'(\u5185\u5BB9\u306B\u3088\u308B) \u306E\u5834\u5408\u306B\u7279\u306B\u91CD\u8981\u306A\u5C5E\u6027]
- age_group: \u5E74\u9F62\u5C64 ('child', 'teenager', '20s', ..., '70s_and_above')
- gender: \u6027\u5225 ('male', 'female', 'non_binary', ...)
- occupation_category: \u8077\u696D\u5206\u985E\uFF08\u4F8B\uFF1A\u4F1A\u793E\u54E1\u3001\u5B66\u751F\u3001\u4E3B\u5A66\u30FB\u4E3B\u592B\uFF09
- interests: \u8208\u5473\u95A2\u5FC3\u4E8B\u306E\u30EA\u30B9\u30C8\uFF08\u4F8B\uFF1A["\u65C5\u884C", "\u6599\u7406"]\uFF09
- lifestyle: \u30E9\u30A4\u30D5\u30B9\u30BF\u30A4\u30EB\uFF08\u4F8B\uFF1A\u30A2\u30A6\u30C8\u30C9\u30A2\u6D3E\u3001\u5065\u5EB7\u5FD7\u5411\uFF09
- family_structure: \u5BB6\u65CF\u69CB\u6210\uFF08\u4F8B\uFF1A\u72EC\u8EAB\u3001\u592B\u5A66\u3068\u5B50\u4F9B2\u4EBA\uFF09
- location_type: \u5C45\u4F4F\u5730\u306E\u30BF\u30A4\u30D7 ('urban', 'suburban', 'rural')
- values_and_priorities: \u4FA1\u5024\u89B3\u3084\u512A\u5148\u4E8B\u9805\u306E\u30EA\u30B9\u30C8\uFF08\u4F8B\uFF1A["\u4FA1\u683C\u91CD\u8996", "\u54C1\u8CEA\u91CD\u8996"]\uFF09
- technology_literacy: \u30C6\u30AF\u30CE\u30ED\u30B8\u30FC\u30EA\u30C6\u30E9\u30B7\u30FC ('high', 'medium', 'low')

[persona_type \u304C 'business_professional' \u307E\u305F\u306F 'specific_role'(\u5185\u5BB9\u306B\u3088\u308B) \u306E\u5834\u5408\u306B\u7279\u306B\u91CD\u8981\u306A\u5C5E\u6027]
- title: \u5F79\u8077\u540D\uFF08\u4F8B\uFF1A\u30DE\u30FC\u30B1\u30C6\u30A3\u30F3\u30B0\u30C7\u30A3\u30EC\u30AF\u30BF\u30FC\uFF09
- industry: \u696D\u7A2E\uFF08\u4F8B\uFF1A\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u3001\u5C0F\u58F2\uFF09
- position: \u793E\u5185\u3067\u306E\u7ACB\u5834\u3084\u5F79\u5272\uFF08\u4F8B\uFF1A\u90E8\u9580\u8CAC\u4EFB\u8005\u3001\u5C02\u9580\u8077\uFF09
- company: (\u4EFB\u610F) \u4F1A\u793E\u540D
- company_size: (\u4EFB\u610F) \u4F01\u696D\u898F\u6A21\uFF08\u4F8B\uFF1A\u30B9\u30BF\u30FC\u30C8\u30A2\u30C3\u30D7\u3001\u5927\u4F01\u696D\uFF09
- expertise: (\u4EFB\u610F) \u5C02\u9580\u5206\u91CE\u3084\u30B9\u30AD\u30EB\u30BB\u30C3\u30C8 (JSON\u5F62\u5F0F\u3067\u306E\u8A73\u7D30\u3082\u53EF)
- background: (\u4EFB\u610F) \u5B66\u6B74\u3084\u8077\u6B74 (JSON\u5F62\u5F0F\u3067\u306E\u8A73\u7D30\u3082\u53EF)
- personality: (\u4EFB\u610F) \u6027\u683C\u3084\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3\u30B9\u30BF\u30A4\u30EB (JSON\u5F62\u5F0F\u3067\u306E\u8A73\u7D30\u3082\u53EF)
- decision_making_style: (\u4EFB\u610F) \u610F\u601D\u6C7A\u5B9A\u306E\u50BE\u5411

[persona_type \u304C 'custom' \u307E\u305F\u306F\u7279\u5B9A\u306E\u8A73\u7D30\u60C5\u5831\u304C\u5FC5\u8981\u306A\u5834\u5408]
- custom_attributes: (\u4EFB\u610F) \u4E0A\u8A18\u4EE5\u5916\u306E\u7279\u8A18\u4E8B\u9805\u3092\u30AD\u30FC\u3068\u5024\u306E\u30DA\u30A2\u3067 (JSON\u5F62\u5F0F)

\u3010\u51FA\u529B\u306E\u53B3\u5B88\u4E8B\u9805\u3011
- \u6700\u7D42\u7684\u306A\u51FA\u529B\u306F\u3001\u5FC5\u305A\u6307\u5B9A\u3055\u308C\u305FJSON\u30B9\u30AD\u30FC\u30DE\uFF08estimated_persona_count, personas_attributes \u3092\u6301\u3064\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\uFF09\u306B\u5F93\u3063\u3066\u304F\u3060\u3055\u3044\u3002
- personas_attributes \u914D\u5217\u306E\u5404\u8981\u7D20\u306F\u3001\u4E0A\u8A18\u306E\u5C5E\u6027\u4ED5\u69D8\u306B\u5F93\u3046\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u3067\u306A\u3051\u308C\u3070\u306A\u308A\u307E\u305B\u3093\u3002
- \u4E0D\u8981\u306A\u5C5E\u6027\u306F\u542B\u3081\u305A\u3001\u5FC5\u8981\u306A\u5C5E\u6027\u3060\u3051\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044\u3002
- \u6307\u793A\u306B\u306A\u3044\u4F59\u8A08\u306A\u30C6\u30AD\u30B9\u30C8\uFF08\u4F8B\uFF1A\u300C\u306F\u3044\u3001\u308F\u304B\u308A\u307E\u3057\u305F\u3002\u300D\u3001\u8AAC\u660E\u6587\u306A\u3069\uFF09\u306F\u4E00\u5207\u542B\u3081\u306A\u3044\u3067\u304F\u3060\u3055\u3044\u3002JSON\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u306E\u307F\u3092\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002
`,
  model: openai("gpt-4o-mini"),
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:./mastra-memory.db"
    }),
    vector: new LibSQLVector({
      connectionUrl: "file:./mastra-memory.db"
    }),
    embedder: openai.embedding("text-embedding-3-small"),
    options: {
      lastMessages: 10,
      semanticRecall: false,
      threads: {
        generateTitle: false
      }
    }
  })
  // outputSchema を指定することで、このスキーマに沿ったJSON出力を期待できる (Mastraの機能)
  // generate呼び出し側で指定するため、Agent定義では不要な場合もある。今回は呼び出し側で指定する想定。
});

const personaResponderInputSchema = z.object({
  persona_id: z.string().uuid(),
  question: z.string()
});
const personaResponderOutputSchema = z.object({
  persona_id: z.string().uuid(),
  answer: z.string(),
  persona_name: z.string().optional(),
  attributes: z.any().optional()
});
async function fetchPersona(persona_id) {
  console.log(`[Supabase] Fetching persona with ID: ${persona_id}`);
  const { data, error } = await supabase$1.from("expert_personas").select("*").eq("id", persona_id).single();
  if (error) {
    console.error("[Supabase] Error fetching persona (raw error object):", JSON.stringify(error, null, 2));
    return null;
  }
  return data;
}
function buildPrompt(persona, question) {
  let personaDescription = `\u3042\u306A\u305F\u306F\u4EE5\u4E0B\u306E\u5C5E\u6027\u3092\u6301\u3064\u4EBA\u7269\u3067\u3059\u3002
`;
  personaDescription += `\u30DA\u30EB\u30BD\u30CA\u30BF\u30A4\u30D7: ${persona.persona_type ?? "custom"}
`;
  if (persona.name) personaDescription += `\u540D\u524D: ${persona.name}
`;
  if (persona.description_by_ai) personaDescription += `AI\u306B\u3088\u308B\u6982\u8981: ${persona.description_by_ai}
`;
  if (persona.age_group) personaDescription += `\u5E74\u9F62\u5C64: ${persona.age_group}
`;
  if (persona.gender) personaDescription += `\u6027\u5225: ${persona.gender}
`;
  if (persona.occupation_category) personaDescription += `\u8077\u696D\u5206\u985E: ${persona.occupation_category}
`;
  if (persona.interests && persona.interests.length > 0) personaDescription += `\u8208\u5473\u95A2\u5FC3: ${persona.interests.join(", ")}
`;
  if (persona.lifestyle) personaDescription += `\u30E9\u30A4\u30D5\u30B9\u30BF\u30A4\u30EB: ${persona.lifestyle}
`;
  if (persona.family_structure) personaDescription += `\u5BB6\u65CF\u69CB\u6210: ${persona.family_structure}
`;
  if (persona.location_type) personaDescription += `\u5C45\u4F4F\u5730\u30BF\u30A4\u30D7: ${persona.location_type}
`;
  if (persona.values_and_priorities && persona.values_and_priorities.length > 0) personaDescription += `\u4FA1\u5024\u89B3\u30FB\u512A\u5148\u4E8B\u9805: ${persona.values_and_priorities.join(", ")}
`;
  if (persona.technology_literacy) personaDescription += `\u30C6\u30AF\u30CE\u30ED\u30B8\u30FC\u30EA\u30C6\u30E9\u30B7\u30FC: ${persona.technology_literacy}
`;
  if (persona.title) personaDescription += `\u5F79\u8077: ${persona.title}
`;
  if (persona.industry) personaDescription += `\u696D\u7A2E: ${persona.industry}
`;
  if (persona.position) personaDescription += `\u8077\u4F4D\u30FB\u5F79\u5272: ${persona.position}
`;
  if (persona.company) personaDescription += `\u4F1A\u793E\u540D: ${persona.company}
`;
  if (persona.company_size) personaDescription += `\u4F01\u696D\u898F\u6A21: ${persona.company_size}
`;
  if (persona.decision_making_style) personaDescription += `\u610F\u601D\u6C7A\u5B9A\u30B9\u30BF\u30A4\u30EB: ${persona.decision_making_style}
`;
  if (persona.region) personaDescription += `\u5730\u57DF: ${persona.region}
`;
  if (persona.expertise) personaDescription += `\u5C02\u9580\u5206\u91CE: ${typeof persona.expertise === "string" ? persona.expertise : JSON.stringify(persona.expertise)}
`;
  if (persona.background) personaDescription += `\u7D4C\u6B74: ${typeof persona.background === "string" ? persona.background : JSON.stringify(persona.background)}
`;
  if (persona.personality) personaDescription += `\u6027\u683C\u7279\u5FB4: ${typeof persona.personality === "string" ? persona.personality : JSON.stringify(persona.personality)}
`;
  if (persona.custom_attributes) personaDescription += `\u30AB\u30B9\u30BF\u30E0\u5C5E\u6027: ${typeof persona.custom_attributes === "string" ? persona.custom_attributes : JSON.stringify(persona.custom_attributes)}
`;
  return `${personaDescription}
\u30E6\u30FC\u30B6\u30FC\u304B\u3089\u306E\u8CEA\u554F: ${question}

\u4E0A\u8A18\u306E\u4EBA\u7269\u3068\u3057\u3066\u3001\u5C02\u9580\u7684\u304B\u3064\u5206\u304B\u308A\u3084\u3059\u304F\u65E5\u672C\u8A9E\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
}
const personaResponder = createTool({
  id: "personaResponder",
  description: "\u6307\u5B9A\u3057\u305F\u30DA\u30EB\u30BD\u30CAID\u306E\u5C5E\u6027\u3092\u5143\u306B\u3001GPT API\u3067\u305D\u306E\u30DA\u30EB\u30BD\u30CA\u3068\u3057\u3066\u8CEA\u554F\u306B\u56DE\u7B54\u3059\u308B\u30C4\u30FC\u30EB\u3002",
  inputSchema: personaResponderInputSchema,
  outputSchema: personaResponderOutputSchema,
  execute: async (input) => {
    console.log("\n--- personaResponder Tool Execution Start ---");
    console.log("Received input (personaResponder execute):", JSON.stringify(input, null, 2));
    const persona_id = input.context.persona_id;
    const question = input.context.question;
    console.log(`[personaResponder ID: ${persona_id}] Extracted persona_id and question.`);
    if (!persona_id) {
      console.error(`[personaResponder ID: ${persona_id}] Persona ID is missing.`);
      throw new Error(`Persona not found for id: ${persona_id}`);
    }
    const persona = await fetchPersona(persona_id);
    if (!persona) {
      console.error(`[personaResponder ID: ${persona_id}] Persona not found in Supabase.`);
      throw new Error(`Persona not found for id: ${persona_id}`);
    }
    console.log(`[personaResponder ID: ${persona_id}] Successfully fetched persona from Supabase:`, persona.name);
    const prompt = buildPrompt(persona, question);
    console.log(`[personaResponder ID: ${persona_id}] Built prompt for LLM.`);
    const model = openai("gpt-4o");
    console.log(`[personaResponder ID: ${persona_id}] Calling LLM (gpt-4o)...`);
    const result = await model.doGenerate({
      prompt: [
        { role: "user", content: [{ type: "text", text: prompt }] }
      ],
      inputFormat: "messages",
      mode: { type: "regular" }
    });
    console.log(`[personaResponder ID: ${persona_id}] LLM call completed.`);
    const answer = result.text || "\u56DE\u7B54\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002";
    console.log(`[personaResponder ID: ${persona_id}] Generated answer: ${answer.substring(0, 50)}...`);
    const output = {
      persona_id,
      answer,
      persona_name: persona.name,
      attributes: persona
    };
    console.log(`[personaResponder ID: ${persona_id}] Returning output.`);
    return output;
  }
});

console.log("DEBUG: SUPABASE_URL in personaFinder:", process.env.SUPABASE_URL);
console.log("DEBUG: SUPABASE_SERVICE_KEY in personaFinder:", process.env.SUPABASE_SERVICE_KEY ? "Loaded" : "NOT LOADED");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Supabase URL\u307E\u305F\u306FService Key\u304C\u74B0\u5883\u5909\u6570\u306B\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002"
  );
}
const supabase = createClient(supabaseUrl, supabaseKey);
const partialPersonaAttributeSchema = personaAttributeSchema.partial();
const finderInputSchema = z.object({
  query: z.string().optional().describe("\u30E6\u30FC\u30B6\u30FC\u306E\u8CEA\u554F\u3084\u691C\u7D22\u3057\u305F\u3044\u30AD\u30FC\u30EF\u30FC\u30C9"),
  desired_attributes: partialPersonaAttributeSchema.optional().describe("\u7406\u60F3\u3068\u3059\u308B\u30DA\u30EB\u30BD\u30CA\u306E\u5C5E\u6027\uFF08\u90E8\u5206\u7684\u306A\u6307\u5B9A\u3082\u53EF\uFF09")
});
const finderOutputSchema = z.object({
  found_personas: z.array(personaAttributeSchema).describe("\u691C\u7D22\u6761\u4EF6\u306B\u5408\u81F4\u3057\u305F\u30DA\u30EB\u30BD\u30CA\u306E\u30EA\u30B9\u30C8")
});
class PersonaFinderTool extends Tool {
  constructor() {
    super({
      id: "persona_finder",
      description: "\u6307\u5B9A\u3055\u308C\u305F\u6761\u4EF6\uFF08\u30AD\u30FC\u30EF\u30FC\u30C9\u3084\u5C5E\u6027\uFF09\u306B\u57FA\u3065\u3044\u3066\u3001\u65E2\u5B58\u306E\u30DA\u30EB\u30BD\u30CA\u3092\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u304B\u3089\u691C\u7D22\u3057\u307E\u3059\u3002",
      inputSchema: finderInputSchema,
      outputSchema: finderOutputSchema
    });
  }
  execute = async (input) => {
    try {
      const { query, desired_attributes } = input.context;
      console.log("[PersonaFinderTool] Input:", input.context);
      let supabaseQuery = supabase.from("expert_personas").select("*");
      if (desired_attributes) {
        for (const [key, value] of Object.entries(desired_attributes)) {
          if (value !== void 0 && value !== null && value !== "") {
            if (["persona_name", "expertise", "responsibilities", "description", "background", "target_audience_description", "communication_style", "notes", "company_name", "industry_tags", "skills", "tools_technologies", "certifications_licenses", "publications_works", "awards_recognitions", "interests", "values_beliefs", "lifestyle_focus", "preferred_communication_channels", "online_behavior", "content_preferences", "brand_affinities"].includes(key) && typeof value === "string") {
              supabaseQuery = supabaseQuery.ilike(key, `%${value}%`);
            } else if (key === "tags" && Array.isArray(value) && value.length > 0) {
              supabaseQuery = supabaseQuery.overlaps(key, value);
            } else {
              supabaseQuery = supabaseQuery.eq(key, value);
            }
          }
        }
      }
      if (query) {
        const searchQuery = `%${query}%`;
        supabaseQuery = supabaseQuery.or(
          `name.ilike.${searchQuery},description_by_ai.ilike.${searchQuery}`
        );
      }
      const { data, error } = await supabaseQuery;
      if (error) {
        console.error(
          "[PersonaFinderTool] Supabase\u304B\u3089\u306E\u30C7\u30FC\u30BF\u53D6\u5F97\u30A8\u30E9\u30FC:",
          error
        );
        throw new Error(
          `Supabase\u304B\u3089\u306E\u30DA\u30EB\u30BD\u30CA\u691C\u7D22\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F: ${error.message}`
        );
      }
      console.log("[PersonaFinderTool] Found personas raw:", data);
      const validatedPersonas = (data || []).map((persona) => {
        try {
          return personaAttributeSchema.parse(persona);
        } catch (validationError) {
          console.warn(`[PersonaFinderTool] \u53D6\u5F97\u3057\u305F\u30DA\u30EB\u30BD\u30CA\u30C7\u30FC\u30BF\u306E\u691C\u8A3C\u306B\u5931\u6557\u3057\u307E\u3057\u305F (ID: ${persona.id}):`, validationError);
          return null;
        }
      }).filter((p) => p !== null);
      console.log("[PersonaFinderTool] Validated personas:", validatedPersonas);
      return { found_personas: validatedPersonas };
    } catch (error) {
      console.error("[PersonaFinderTool] \u5B9F\u884C\u6642\u30A8\u30E9\u30FC:", error);
      let errorMessage = "PersonaFinderTool\u306E\u5B9F\u884C\u4E2D\u306B\u4E88\u671F\u305B\u306C\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002";
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      } else if (typeof error === "string") {
        errorMessage += `: ${error}`;
      }
      throw new Error(errorMessage);
    }
  };
}
var personaFinder = new PersonaFinderTool();

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

const orchestratorAgent = new Agent({
  name: "orchestratorAgent",
  model: openai("gpt-4o"),
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:./mastra-memory.db"
    }),
    vector: new LibSQLVector({
      connectionUrl: "file:./mastra-memory.db"
    }),
    embedder: openai.embedding("text-embedding-3-small"),
    options: {
      lastMessages: 10,
      semanticRecall: false,
      threads: {
        generateTitle: false
      }
    }
  }),
  tools: { personaFactory, personaResponder, personaFinder },
  // personaFinder をツールに追加
  instructions: `\u3042\u306A\u305F\u306FB2B\u4EEE\u60F3\u5C02\u9580\u5BB6\u4F1A\u8B70\u306E\u30AA\u30FC\u30B1\u30B9\u30C8\u30EC\u30FC\u30BF\u30FC\u3067\u3059\u3002
\u30E6\u30FC\u30B6\u30FC\u306E\u8981\u671B\u306B\u5FDC\u3058\u3066\u3001\u4EE5\u4E0B\u306E\u30B9\u30C6\u30C3\u30D7\u3067\u51E6\u7406\u3092\u5B9F\u884C\u3057\u307E\u3059\u3002
1. \u307E\u305A\u3001'estimatorAgent' \u306B\u30E6\u30FC\u30B6\u30FC\u306E\u8981\u671B\u3092\u4F1D\u3048\u3001\u6700\u9069\u306A\u30DA\u30EB\u30BD\u30CA\u306E\u5C5E\u6027\u30EA\u30B9\u30C8\u3068\u5FC5\u8981\u306A\u30DA\u30EB\u30BD\u30CA\u6570\u3092\u53D6\u5F97\u3057\u307E\u3059\u3002
2. \u6B21\u306B\u3001\u30E6\u30FC\u30B6\u30FC\u306E\u5143\u306E\u8981\u671B\u3068 estimatorAgent \u304C\u63D0\u6848\u3057\u305F\u5C5E\u6027\u3092 'personaFinder' \u30C4\u30FC\u30EB\u306B\u6E21\u3057\u3001\u65E2\u5B58\u30DA\u30EB\u30BD\u30CA\u3092\u691C\u7D22\u3057\u307E\u3059\u3002\u5165\u529B\u306F query \u3068 desired_attributes \u3067\u3059\u3002
3. estimatorAgent \u304C\u63D0\u6848\u3057\u305F\u30DA\u30EB\u30BD\u30CA\u6570\u306B\u5BFE\u3057\u3066\u3001personaFinder \u3067\u898B\u3064\u304B\u3063\u305F\u30DA\u30EB\u30BD\u30CA\u304C\u4E0D\u8DB3\u3057\u3066\u3044\u308B\u304B\u3001\u307E\u305F\u306F\u8CEA\u7684\u306B\u4E0D\u5341\u5206\u306A\u5834\u5408\u306F\u3001\u4E0D\u8DB3\u5206\u306E\u30DA\u30EB\u30BD\u30CA\u306E\u5C5E\u6027\u3092\u6C7A\u5B9A\u3057\u307E\u3059\u3002
4. \u4E0D\u8DB3\u5206\u306E\u30DA\u30EB\u30BD\u30CA\u304C\u3044\u308C\u3070\u3001\u305D\u306E\u5C5E\u6027\u30EA\u30B9\u30C8\u3092 'personaFactory' \u30C4\u30FC\u30EB\u306B 'personas_attributes' \u3068\u3044\u3046\u30AD\u30FC\u3067\u6E21\u3057\u3001\u30DA\u30EB\u30BD\u30CA\u3092\u4F5C\u6210\u3057\u3066\u3001\u305D\u306EID\u306E\u30EA\u30B9\u30C8\u3092\u53D6\u5F97\u3057\u307E\u3059\u3002
5. personaFinder \u3067\u898B\u3064\u304B\u3063\u305F\u30DA\u30EB\u30BD\u30CA\u3068 personaFactory \u3067\u65B0\u898F\u4F5C\u6210\u3055\u308C\u305F\u30DA\u30EB\u30BD\u30CA\u306EID\u3092\u7D50\u5408\u3057\u307E\u3059\u3002
6. \u6700\u5F8C\u306B\u3001\u7D50\u5408\u3055\u308C\u305F\u5404\u30DA\u30EB\u30BD\u30CAID\u3068\u30E6\u30FC\u30B6\u30FC\u304B\u3089\u306E\u5F53\u521D\u306E\u8CEA\u554F\u3092 'personaResponder' \u30C4\u30FC\u30EB\u306B\u6E21\u3057\u3001\u5404\u30DA\u30EB\u30BD\u30CA\u304B\u3089\u306E\u56DE\u7B54\u3092\u53D6\u5F97\u3057\u307E\u3059\u3002
7. \u5168\u3066\u306E\u30DA\u30EB\u30BD\u30CA\u304B\u3089\u306E\u56DE\u7B54\u3092\u307E\u3068\u3081\u3066\u3001\u30E6\u30FC\u30B6\u30FC\u306B\u63D0\u793A\u3057\u3066\u304F\u3060\u3055\u3044\u3002
\u30E6\u30FC\u30B6\u30FC\u306E\u5165\u529B\u306F\u6700\u521D\u306E\u8981\u671B\u3084\u8CEA\u554F\u3067\u3059\u3002\u6700\u7D42\u7684\u306A\u51FA\u529B\u306F expertProposalSchema \u306B\u5F93\u3063\u3066\u304F\u3060\u3055\u3044\u3002
`
});
async function runOrchestrator(userMessageContent, threadId, resourceId) {
  console.log("[Orchestrator] Starting orchestration with user message:", userMessageContent, { threadId, resourceId });
  console.log("[Orchestrator] Calling EstimatorAgent...");
  const estimationResult = await estimatorAgent.generate(
    [{ role: "user", content: userMessageContent }],
    {
      output: estimatorOutputSchema,
      threadId,
      resourceId
    }
  );
  const resultObject = estimationResult.object;
  if (!resultObject || !resultObject.personas_attributes || typeof resultObject.estimated_persona_count !== "number") {
    console.error("[Orchestrator] EstimatorAgent did not return valid persona attributes or count.", estimationResult);
    throw new Error("EstimatorAgent failed to provide persona attributes or count.");
  }
  const estimatedAttributes = resultObject.personas_attributes;
  const estimatedCount = resultObject.estimated_persona_count;
  console.log("[Orchestrator] EstimatorAgent: Estimated " + estimatedCount + " personas with attributes:", JSON.stringify(estimatedAttributes, null, 2));
  console.log("[Orchestrator] Instructing self to use personaFinder tool...");
  const finderPayload = {
    query: userMessageContent,
    // ユーザーの元の質問をクエリとして使用
    desired_attributes: estimatedAttributes.length > 0 ? estimatedAttributes[0] : {}
    // 推定属性の最初のものを代表として渡すか、あるいはもっと洗練された方法でdesired_attributesを生成する
    // TODO: desired_attributes は estimatedAttributes 全体を渡すか、LLMに要約させるなどを検討
  };
  const finderToolCallPrompt = `\u4EE5\u4E0B\u306E\u60C5\u5831\u306B\u57FA\u3065\u3044\u3066\u3001'personaFinder' \u30C4\u30FC\u30EB\u3092\u5B9F\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002
\u30C4\u30FC\u30EB\u540D: personaFinder
\u5165\u529B:
${JSON.stringify(finderPayload, null, 2)}`;
  const finderToolCallResult = await orchestratorAgent.generate(
    [{ role: "user", content: finderToolCallPrompt }],
    {
      toolChoice: { type: "tool", toolName: "personaFinder" },
      threadId,
      resourceId
    }
  );
  console.log("[Orchestrator] personaFinder tool call result:", JSON.stringify(finderToolCallResult, null, 2));
  let foundPersonaIds = [];
  let foundPersonasDetails = [];
  if (finderToolCallResult.toolResults && finderToolCallResult.toolResults.length > 0) {
    const finderResult = finderToolCallResult.toolResults[0];
    if (finderResult && finderResult.toolName === "personaFinder" && finderResult.result) {
      try {
        const parsedFinderResult = z.object({ found_personas: z.array(personaAttributeSchema) }).parse(finderResult.result);
        foundPersonasDetails = parsedFinderResult.found_personas;
        foundPersonaIds = foundPersonasDetails.map((p) => p.id).filter((id) => typeof id === "string");
      } catch (e) {
        console.error("[Orchestrator] Failed to parse personaFinder tool result:", e, finderResult.result);
      }
    }
  }
  console.log("[Orchestrator] personaFinder found " + foundPersonaIds.length + " personas:", JSON.stringify(foundPersonaIds, null, 2));
  if (foundPersonasDetails.length > 0) {
    console.log("[Orchestrator] Details of found personas:", JSON.stringify(foundPersonasDetails, null, 2));
  }
  let newlyCreatedPersonaIds = [];
  const neededCount = estimatedCount - foundPersonaIds.length;
  if (neededCount > 0) {
    console.log("[Orchestrator] " + neededCount + " personas still needed. Determining attributes for personaFactory...");
    const attributesForFactoryPrompt = `\u30E6\u30FC\u30B6\u30FC\u306E\u5F53\u521D\u306E\u8981\u671B\u306F\u300C${userMessageContent}\u300D\u3067\u3059\u3002
EstimatorAgent\u306F\u5F53\u521D\u3001\u4EE5\u4E0B\u306E ${estimatedAttributes.length} \u500B\u306E\u30DA\u30EB\u30BD\u30CA\u5C5E\u6027\u6848\u3092\u63D0\u6848\u3057\u307E\u3057\u305F:
${JSON.stringify(estimatedAttributes, null, 2)}

\u305D\u306E\u7D50\u679C\u3001personaFinder\u30C4\u30FC\u30EB\u306B\u3088\u308A\u3001\u4EE5\u4E0B\u306E ${foundPersonasDetails.length} \u540D\u306E\u65E2\u5B58\u30DA\u30EB\u30BD\u30CA\u304C\u898B\u3064\u304B\u308A\u307E\u3057\u305F:
${JSON.stringify(foundPersonasDetails, null, 2)}

\u6700\u7D42\u7684\u306B\u5408\u8A08 ${estimatedCount} \u540D\u306E\u30DA\u30EB\u30BD\u30CA\u304C\u5FC5\u8981\u3067\u3059\u3002\u73FE\u5728 ${foundPersonaIds.length} \u540D\u304C\u898B\u3064\u304B\u3063\u3066\u304A\u308A\u3001\u3042\u3068 ${neededCount} \u540D\u306E\u30DA\u30EB\u30BD\u30CA\u3092\u65B0\u898F\u4F5C\u6210\u3059\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059\u3002
\u65E2\u5B58\u30DA\u30EB\u30BD\u30CA\u3068\u91CD\u8907\u305B\u305A\u3001\u304B\u3064\u5F53\u521D\u306EEstimatorAgent\u306E\u63D0\u6848\u610F\u56F3\u3092\u6C72\u307F\u53D6\u3063\u3066\u3001\u65B0\u898F\u4F5C\u6210\u3059\u3079\u304D ${neededCount} \u540D\u5206\u306E\u30DA\u30EB\u30BD\u30CA\u306E\u5C5E\u6027\u60C5\u5831\u3092 personaFactory \u30C4\u30FC\u30EB\u306E\u5165\u529B\u5F62\u5F0F (personas_attributes\u30AD\u30FC\u306B\u5C5E\u6027\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u306E\u914D\u5217\u3092\u6301\u3064JSON) \u3067\u63D0\u6848\u3057\u3066\u304F\u3060\u3055\u3044\u3002
`;
    console.log("[Orchestrator] Generating attributes for personaFactory with prompt:", attributesForFactoryPrompt);
    const attributesForFactoryResponse = await orchestratorAgent.generate(
      [{ role: "user", content: attributesForFactoryPrompt }],
      {
        // ここでは personaFactoryOutputSchema の一部 (personas_attributes部分) に合致するJSONを期待
        // output: z.object({ personas_attributes: z.array(personaAttributeSchema) }) のようなスキーマを即席で定義して渡すか、
        // あるいは、personaFactoryInputSchema をそのまま output として指定する (ツール呼び出しではないので注意)
        // 簡単のため、一旦 output スキーマ指定なしでテキストとしてJSONを取得し、後でパースする
        threadId,
        resourceId
      }
    );
    let attributesToCreate = [];
    if (attributesForFactoryResponse.text) {
      try {
        const parsedJson = JSON.parse(attributesForFactoryResponse.text);
        if (parsedJson.personas_attributes && Array.isArray(parsedJson.personas_attributes)) {
          attributesToCreate = parsedJson.personas_attributes.map((attr) => {
            try {
              return personaAttributeSchema.parse(attr);
            } catch (parseError) {
              console.warn("[Orchestrator] Failed to parse an attribute for personaFactory:", parseError, attr);
              return null;
            }
          }).filter((attr) => attr !== null);
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
      const factoryToolCallPrompt = `\u4EE5\u4E0B\u306E\u5C5E\u6027\u60C5\u5831\u30EA\u30B9\u30C8\u3092\u4F7F\u3063\u3066 \\'personaFactory\\' \u30C4\u30FC\u30EB\u3067\u30DA\u30EB\u30BD\u30CA\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002
\u30C4\u30FC\u30EB\u540D: personaFactory
\u5165\u529B:
${JSON.stringify(factoryPayload, null, 2)}`;
      const factoryToolCallResult = await orchestratorAgent.generate(
        [{ role: "user", content: factoryToolCallPrompt }],
        {
          toolChoice: { type: "tool", toolName: "personaFactory" },
          threadId,
          resourceId
        }
      );
      console.log("[Orchestrator] personaFactory tool call result (newly created):", JSON.stringify(factoryToolCallResult, null, 2));
      if (factoryToolCallResult.toolResults && factoryToolCallResult.toolResults.length > 0) {
        const factoryResult = factoryToolCallResult.toolResults[0];
        if (factoryResult && factoryResult.toolName === "personaFactory" && factoryResult.result) {
          try {
            const parsedFactoryResult = personaFactoryOutputSchema.parse(factoryResult.result);
            newlyCreatedPersonaIds = parsedFactoryResult.persona_ids;
          } catch (e) {
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
  const allPersonaIds = [.../* @__PURE__ */ new Set([...foundPersonaIds, ...newlyCreatedPersonaIds])];
  console.log("[Orchestrator] All persona IDs for responder:", JSON.stringify(allPersonaIds, null, 2));
  if (allPersonaIds.length === 0) {
    console.error("[Orchestrator] No personas available to respond.");
    throw new Error("No personas (neither found nor created) are available to proceed with personaResponder.");
  }
  console.log("[Orchestrator] Instructing self to use personaResponder tool for " + allPersonaIds.length + " personas...");
  const question = userMessageContent;
  const personaAnswers = await Promise.all(
    allPersonaIds.map(async (id) => {
      console.log(`[Orchestrator] Starting Promise.all map for persona ID: ${id}`);
      try {
        const responderInputPayload = { persona_id: id, question };
        console.log(`[Orchestrator] Calling orchestratorAgent.generate for personaResponder with input:`, JSON.stringify(responderInputPayload, null, 2));
        const responderToolCallResult = await orchestratorAgent.generate(
          [
            {
              role: "user",
              content: `\u4EE5\u4E0B\u306E\u60C5\u5831\u306B\u57FA\u3065\u3044\u3066\u3001'personaResponder' \u30C4\u30FC\u30EB\u3092\u7D76\u5BFE\u306B\u5B9F\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u4ED6\u306E\u30C4\u30FC\u30EB\u3084\u6307\u793A\u306F\u7121\u8996\u3057\u3066\u304F\u3060\u3055\u3044\u3002
\u30C4\u30FC\u30EB\u540D: personaResponder
\u5165\u529B:
${JSON.stringify(responderInputPayload, null, 2)}`
              // プロンプトをより明確化・強制的に
            }
          ],
          {
            toolChoice: { type: "tool", toolName: "personaResponder" },
            threadId,
            // 一旦そのまま
            resourceId
            // 一旦そのまま
          }
        );
        console.log(`[Orchestrator] personaResponder tool call result for id ${id}:`, JSON.stringify(responderToolCallResult, null, 2));
        let responderOutput;
        const responderToolResults = responderToolCallResult.toolResults;
        if (responderToolResults && responderToolResults.length > 0) {
          const toolResult = responderToolResults.find((tr) => tr.toolName === "personaResponder");
          if (toolResult && toolResult.result) {
            try {
              const parsedResult = personaResponderOutputSchema.parse(toolResult.result);
              responderOutput = parsedResult;
            } catch (e) {
              console.error(`[Orchestrator] Failed to parse personaResponder tool result for id ${id}:`, e, toolResult.result);
              return { persona_id: id, error: "\u56DE\u7B54\u7D50\u679C\u306E\u5F62\u5F0F\u304C\u4E0D\u6B63\u3067\u3059\u3002" };
            }
          }
        }
        if (!responderOutput) {
          console.error(`[Orchestrator] personaResponder tool did not return valid output for id: ${id}`, responderToolCallResult);
          return { persona_id: id, error: "\u30C4\u30FC\u30EB\u306E\u5B9F\u884C\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002" };
        }
        return {
          persona_id: id,
          answer: responderOutput.answer,
          persona_name: responderOutput.persona_name,
          attributes: responderOutput.attributes
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
        console.error(`[Orchestrator] Error in Promise.all map for persona ID: ${id}. Error: ${errorMessage}`);
        return { persona_id: id, error: "\u56DE\u7B54\u751F\u6210\u4E2D\u306B\u4E88\u671F\u305B\u306C\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002" };
      }
    })
  );
  console.log("[Orchestrator] All personaResponder calls in Promise.all have completed.");
  console.log("[Orchestrator] Answers from personas:", JSON.stringify(personaAnswers, null, 2));
  const finalOutput = expertProposalSchema.parse({
    user_query: userMessageContent,
    estimated_personas: estimatedAttributes.map((attr) => ({
      name: attr.name || "Unknown Persona",
      attributes_summary: Object.entries(attr).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(", "),
      role_description: attr.title || attr.persona_type || "N/A"
    })),
    expert_responses: personaAnswers.map((ans) => ({
      persona_id: ans.persona_id,
      response_text: ans.error ? `Error: ${ans.error}` : ans.answer,
      persona_name: ans.persona_name,
      attributes: ans.attributes
    })),
    summary: "\u8907\u6570\u306E\u5C02\u9580\u5BB6\u304B\u3089\u306E\u610F\u898B\u3092\u307E\u3068\u3081\u307E\u3057\u305F\u3002",
    next_steps: ["\u5177\u4F53\u7684\u306A\u30A2\u30AF\u30B7\u30E7\u30F3\u30D7\u30E9\u30F3\u306E\u7B56\u5B9A", "\u8FFD\u52A0\u306E\u8CEA\u554F"]
  });
  console.log("[Orchestrator] Orchestration completed. Final output:", JSON.stringify(finalOutput, null, 2));
  return finalOutput;
}

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
  console.log("handleGenerateExpertProposal called. ctx:", ctx);
  console.log("typeof ctx.get:", typeof ctx.get);
  console.log("typeof ctx.req:", typeof ctx.req);
  console.log("typeof ctx.json:", typeof ctx.json);
  if (req.method !== "POST") {
    return ctx.json({ message: "Method Not Allowed" }, 405);
  }
  try {
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      logger?.error("Failed to parse request body:", e);
      return ctx.json({ message: "Invalid JSON body" }, 400);
    }
    let validatedBody;
    try {
      validatedBody = RequestBodySchema.parse(requestBody);
    } catch (validationError) {
      logger?.error("Request body validation failed:", validationError);
      return ctx.json({ message: "Invalid request body", details: validationError.errors }, 400);
    }
    const userMessage = validatedBody.messages.filter((m) => m.role === "user").pop();
    if (!userMessage || !userMessage.content) {
      logger?.error("No user message content found in the request body");
      return ctx.json({ message: "User message content is required" }, 400);
    }
    logger?.info(`Received request for expert proposal with message: "${userMessage.content.substring(0, 100)}..."`);
    const threadId = crypto.randomUUID();
    const resourceId = crypto.randomUUID();
    const result = await runOrchestrator(userMessage.content, threadId, resourceId);
    logger?.info("Orchestration process completed successfully.");
    return ctx.json(result, 200);
  } catch (error) {
    logger?.error("Error in handleGenerateExpertProposal handler:", error);
    return ctx.json({ message: "Internal server error", error: error.message || "Unknown error" }, 500);
  }
}

const server = {
  port: 4111,
  host: "0.0.0.0",
  apiRoutes: [{
    path: "/generate-expert-proposal",
    method: "POST",
    handler: handleGenerateExpertProposal
  }]
};

export { server };
