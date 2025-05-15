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
  persona_type: z.string().optional(),
  description_by_ai: z.string().optional(),
  additional_notes: z.string().optional(),
  // 一般消費者向け属性
  age_group: z.string().optional(),
  gender: z.string().optional(),
  occupation_category: z.string().optional(),
  interests: z.array(z.string()).optional(),
  lifestyle: z.string().optional(),
  family_structure: z.string().optional(),
  location_type: z.string().optional(),
  values_and_priorities: z.array(z.string()).optional(),
  technology_literacy: z.string().optional(),
  // ビジネス専門家向け属性
  title: z.string().optional(),
  industry: z.string().optional(),
  position: z.string().optional(),
  company: z.string().optional(),
  company_size: z.string().optional(),
  region: z.string().optional(),
  expertise: z.record(z.string(), z.any()).optional(),
  background: z.record(z.string(), z.any()).optional(),
  personality: z.record(z.string(), z.any()).optional(),
  decision_making_style: z.string().optional(),
  // カスタム属性 (遺伝情報、健康状態、資産状況などを含むことを想定)
  custom_attributes: z.record(z.string(), z.any()).optional(),
  // タイムスタンプ
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
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
  const commonOutputRequirements = `
\u3010\u51FA\u529B\u8981\u4EF6\u3011
- name: \u65E5\u672C\u4EBA\u3089\u3057\u3044\u81EA\u7136\u306A\u6C0F\u540D\uFF08\u3082\u3057\u5165\u529B\u306Ename\u5C5E\u6027\u304C\u7A7A\u306E\u5834\u5408\uFF09\u3002\u5165\u529B\u306Bname\u304C\u3042\u308C\u3070\u305D\u308C\u3092\u512A\u5148\u3002
- expertise: \u5C02\u9580\u5206\u91CE\u3001\u30B9\u30AD\u30EB\u3001\u95A2\u9023\u3059\u308B\u7D4C\u9A13\u5E74\u6570\u306A\u3069\uFF08JSON\u5F62\u5F0F\u3067\u69CB\u9020\u5316\u3057\u3066\uFF09
- background: \u5B66\u6B74\u3001\u8077\u6B74\u3001\u53D7\u8CDE\u6B74\u3001\u95A2\u9023\u3059\u308B\u8CC7\u683C\u306A\u3069\uFF08JSON\u5F62\u5F0F\u3067\u69CB\u9020\u5316\u3057\u3066\uFF09
- personality: \u6027\u683C\u7279\u6027\u3001\u4FA1\u5024\u89B3\u3001\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3\u306E\u50BE\u5411\u306A\u3069\uFF08JSON\u5F62\u5F0F\u3067\u69CB\u9020\u5316\u3057\u3066\uFF09
- decision_making_style: \u610F\u601D\u6C7A\u5B9A\u306E\u969B\u306E\u50BE\u5411\u3084\u30B9\u30BF\u30A4\u30EB\uFF08\u4F8B: \u30C7\u30FC\u30BF\u99C6\u52D5\u578B\u3001\u76F4\u611F\u7684\u3001\u5354\u8ABF\u578B\u306A\u3069\uFF09
- description_by_ai: \u4E0A\u8A18\u306E\u60C5\u5831\u3092\u7DCF\u5408\u3057\u3001\u3053\u306E\u4EBA\u7269\u304C\u3069\u306E\u3088\u3046\u306A\u4EBA\u7269\u3067\u3042\u308B\u304B\u3092\u8A73\u7D30\u304B\u3064\u5177\u4F53\u7684\u306B\u8A18\u8FF0\u3057\u305F\u81EA\u7136\u306A\u65E5\u672C\u8A9E\u306E\u6587\u7AE0\u3002\u6700\u5927300\u5B57\u7A0B\u5EA6\u3002

\u3010\u51FA\u529B\u5F62\u5F0F\u3011
\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u8A73\u7D30\u306A\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u3053\u306E\u5F62\u5F0F\u4EE5\u5916\u306E\u30C6\u30AD\u30B9\u30C8\u306F\u7D76\u5BFE\u306B\u542B\u3081\u306A\u3044\u3067\u304F\u3060\u3055\u3044\u3002
{
  "name": "...", // \u5165\u529B\u3055\u308C\u305Fname\u3092\u5C0A\u91CD\u3001\u306A\u3051\u308C\u3070\u751F\u6210
  "expertise": {"skills": [...], "experience_years": "...", /* \u305D\u306E\u4ED6\u95A2\u9023\u60C5\u5831 */},
  "background": {"education": "...", "work_history": "...", /* \u305D\u306E\u4ED6\u95A2\u9023\u60C5\u5831 */},
  "personality": {"primary_trait": "...", "communication_style": "...", /* \u305D\u306E\u4ED6\u95A2\u9023\u60C5\u5831 */},
  "decision_making_style": "...",
  "description_by_ai": "..." // AI\u306B\u3088\u308B\u30DA\u30EB\u30BD\u30CA\u306E\u5305\u62EC\u7684\u306A\u8AAC\u660E\u6587
}`;
  const providedAttributesList = Object.entries(attr).map(([key, value]) => {
    if (value === void 0 || value === null || typeof value === "string" && value.trim() === "") return null;
    if (Array.isArray(value)) {
      return value.length > 0 ? `- ${key}: ${value.join(", ")}` : null;
    }
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0) {
      if (key === "custom_attributes") {
        const customAttrsString = Object.entries(value).map(([ck, cv]) => `  - ${ck}: ${typeof cv === "object" ? JSON.stringify(cv) : cv}`).join("\\n");
        return `- ${key}:\\n${customAttrsString}`;
      }
      return `- ${key}: ${JSON.stringify(value)}`;
    }
    if (typeof value === "string") {
      return `- ${key}: ${value}`;
    }
    return null;
  }).filter(Boolean);
  const providedAttributes = providedAttributesList.length > 0 ? providedAttributesList.join("\\n") : "\u5C5E\u6027\u60C5\u5831\u306F\u63D0\u4F9B\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u304C\u3001\u4E00\u822C\u7684\u306A\u4EBA\u7269\u50CF\u3092\u60F3\u50CF\u3057\u3066\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
  const ethicalConsideration = attr.custom_attributes ? "\\n\\n\u3010\u91CD\u8981: \u502B\u7406\u7684\u914D\u616E\u3011\\ncustom_attributes\u306B\u306F\u907A\u4F1D\u60C5\u5831\u3001\u5065\u5EB7\u72B6\u614B\u3001\u8CC7\u7523\u72B6\u6CC1\u306A\u3069\u306E\u6A5F\u5BC6\u60C5\u5831\u304C\u542B\u307E\u308C\u308B\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059\u3002\u3053\u308C\u3089\u306E\u60C5\u5831\u3092\u6271\u3046\u969B\u306F\u3001\u500B\u4EBA\u306E\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u3092\u5C0A\u91CD\u3057\u3001\u5DEE\u5225\u3084\u504F\u898B\u3092\u52A9\u9577\u3057\u306A\u3044\u3088\u3046\u6700\u5927\u9650\u306E\u6CE8\u610F\u3092\u6255\u3063\u3066\u304F\u3060\u3055\u3044\u3002\u751F\u6210\u3055\u308C\u308B\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u3067\u306F\u3001\u3053\u308C\u3089\u306E\u60C5\u5831\u3092\u76F4\u63A5\u7684\u30FB\u9732\u9AA8\u306B\u8868\u73FE\u3059\u308B\u306E\u3067\u306F\u306A\u304F\u3001\u4EBA\u7269\u306E\u80CC\u666F\u3084\u7279\u6027\u3068\u3057\u3066\u3001\u3088\u308A\u62BD\u8C61\u7684\u304B\u3064\u914D\u616E\u306E\u3042\u308B\u5F62\u3067\u8A00\u53CA\u3059\u308B\u306B\u7559\u3081\u3066\u304F\u3060\u3055\u3044\u3002" : "";
  const profileInstructions = `\u3042\u306A\u305F\u306F\u4EE5\u4E0B\u306E\u5C5E\u6027\u60C5\u5831\u3092\u6301\u3064\u4EBA\u7269\u306E\u8A73\u7D30\u306A\u30DA\u30EB\u30BD\u30CA\u3092\u8A2D\u8A08\u3059\u308B\u5C02\u9580\u5BB6\u3067\u3059\u3002
\u3010\u63D0\u4F9B\u3055\u308C\u305F\u5C5E\u6027\u3011
${providedAttributes}
${ethicalConsideration}

\u4E0A\u8A18\u306E\u5C5E\u6027\u60C5\u5831\u3092\u6700\u5927\u9650\u306B\u6D3B\u304B\u3057\u3001\u4E00\u8CAB\u6027\u306E\u3042\u308B\u8A73\u7D30\u306A\u4EBA\u7269\u50CF\u3092\u65E5\u672C\u8A9E\u3067\u8A2D\u8A08\u3057\u3066\u304F\u3060\u3055\u3044\u3002
\u7279\u306B\u3001\u63D0\u4F9B\u3055\u308C\u305F\u5C5E\u6027\u60C5\u5831\uFF08custom_attributes\u5185\u306E\u6A5F\u5FAE\u60C5\u5831\u3084additional_notes\u3092\u542B\u3080\uFF09\u304B\u3089\u63A8\u6E2C\u3055\u308C\u308B\u5C02\u9580\u6027\u3001\u6027\u683C\u3001\u80CC\u666F\u3001\u4FA1\u5024\u89B3\u3001\u610F\u601D\u6C7A\u5B9A\u306E\u30B9\u30BF\u30A4\u30EB\u3001\u305D\u3057\u3066\u4EBA\u7269\u306E\u5305\u62EC\u7684\u306A\u7279\u5FB4\u3092\u6DF1\u6398\u308A\u3057\u3001\u4E0A\u8A18\u306E\u3010\u51FA\u529B\u8981\u4EF6\u3011\u3068\u3010\u51FA\u529B\u5F62\u5F0F\u3011\u306B\u5F93\u3063\u3066\u60C5\u5831\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002
additional_notes \u306F\u30E6\u30FC\u30B6\u30FC\u306B\u3088\u308B\u8FFD\u8A18\u60C5\u5831\u3067\u3042\u308A\u3001\u91CD\u8981\u306A\u30D2\u30F3\u30C8\u3068\u306A\u308B\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059\u3002
custom_attributes \u306B\u306F\u3001\u305D\u306E\u4EBA\u7269\u306E\u3088\u308A\u500B\u4EBA\u7684\u306A\u5074\u9762\u304C\u542B\u307E\u308C\u3066\u3044\u308B\u5834\u5408\u304C\u3042\u308A\u307E\u3059\u3002\u3053\u308C\u3089\u3092\u7D71\u5408\u3057\u3066\u3001\u3088\u308A\u4EBA\u9593\u5473\u306E\u3042\u308B\u3001\u6DF1\u307F\u306E\u3042\u308B\u30DA\u30EB\u30BD\u30CA\u50CF\u3092\u69CB\u7BC9\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
  return `${profileInstructions}\\n${commonOutputRequirements}`;
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
    console.log("\\n--- personaFactory Tool Execution Start ---");
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
        // 入力された全属性をまず展開
        name: profile.name ?? attr.name,
        expertise: profile.expertise,
        background: profile.background,
        personality: profile.personality,
        decision_making_style: profile.decision_making_style,
        description_by_ai: profile.description_by_ai
        // AIによる説明も保存
        // additional_notes は attr からそのまま渡される
        // custom_attributes も attr からそのまま渡される
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
    console.log("--- personaFactory Tool Execution End ---\\n");
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
\u30E6\u30FC\u30B6\u30FC\u306E\u8981\u671B\u306B\u5FDC\u3058\u3066\u3001\u4EE5\u4E0B\u306E\u5C5E\u6027\u3092\u9069\u5207\u306B\u542B\u3081\u3066\u304F\u3060\u3055\u3044\u3002\u5168\u3066\u306E\u5C5E\u6027\u304C\u5E38\u306B\u5FC5\u8981\u3068\u306F\u9650\u308A\u307E\u305B\u3093\u3002\u30DA\u30EB\u30BD\u30CA\u306E\u30BF\u30A4\u30D7\u3084\u76EE\u7684\u306B\u5408\u308F\u305B\u3066\u3001\u6700\u3082\u610F\u5473\u306E\u3042\u308B\u5C5E\u6027\u3092\u81EA\u7531\u306B\u8A18\u8FF0\u30FB\u63D0\u6848\u3057\u3066\u304F\u3060\u3055\u3044\u3002

[\u57FA\u672C\u5C5E\u6027]

- persona_type: (\u63A8\u5968) \u30DA\u30EB\u30BD\u30CA\u306E\u5206\u985E\u3084\u5F79\u5272\u3092\u793A\u3059\u81EA\u7531\u306A\u8A18\u8FF0\uFF08\u4F8B\uFF1A\u7D4C\u9A13\u8C4A\u5BCC\u306A\u30DE\u30FC\u30B1\u30BF\u30FC\u3001\u30C6\u30AF\u30CE\u30ED\u30B8\u30FC\u306B\u8A73\u3057\u3044\u5927\u5B66\u751F\u3001\u74B0\u5883\u554F\u984C\u306B\u95A2\u5FC3\u306E\u3042\u308B\u4E3B\u5A66\u306A\u3069\uFF09\u3002\u3053\u306E\u60C5\u5831\u306F\u30DA\u30EB\u30BD\u30CA\u306E\u65B9\u5411\u6027\u3092\u5B9A\u3081\u308B\u4E0A\u3067\u91CD\u8981\u3067\u3059\u3002
- name: (\u4EFB\u610F) \u30DA\u30EB\u30BD\u30CA\u306E\u540D\u524D\u3002
- description_by_ai: (\u4EFB\u610F) AI\u306B\u3088\u3063\u3066\u751F\u6210\u3055\u308C\u308B\u30DA\u30EB\u30BD\u30CA\u306E\u7C21\u5358\u306A\u8AAC\u660E\u6587\u3002\u3053\u306E\u9805\u76EE\u306F personaFactory \u304C\u6700\u7D42\u7684\u306B\u751F\u6210\u3059\u308B\u305F\u3081\u3001\u3053\u3053\u3067\u306F\u7C21\u5358\u306A\u793A\u5506\u7A0B\u5EA6\u3067\u69CB\u3044\u307E\u305B\u3093\u3002
- additional_notes: (\u4EFB\u610F) \u30E6\u30FC\u30B6\u30FC\u304C\u63D0\u4F9B\u3057\u305F\u60C5\u5831\u3084\u3001AI\u304C\u7279\u306B\u8FFD\u8A18\u3059\u3079\u304D\u3068\u5224\u65AD\u3057\u305F\u30DA\u30EB\u30BD\u30CA\u306B\u95A2\u3059\u308B\u88DC\u8DB3\u60C5\u5831\u3084\u81EA\u7531\u8A18\u8FF0\u30E1\u30E2\u3002
- region: (\u4EFB\u610F) \u6D3B\u52D5\u5730\u57DF\u3084\u5C45\u4F4F\u5730\u57DF\u3002

[\u6D88\u8CBB\u8005\u3084\u7279\u5B9A\u306E\u5F79\u5272\u306E\u30DA\u30EB\u30BD\u30CA\u3067\u691C\u8A0E\u3059\u308B\u5C5E\u6027\u306E\u4F8B]

- age_group: \u5E74\u9F62\u5C64\u3092\u81EA\u7531\u8A18\u8FF0\uFF08\u4F8B\uFF1A20\u4EE3\u5F8C\u534A\u300140\u4EE3\u3001\u30B7\u30CB\u30A2\u5C64\u306A\u3069\uFF09\u3002
- gender: \u6027\u5225\u3092\u81EA\u7531\u8A18\u8FF0\uFF08\u4F8B\uFF1A\u7537\u6027\u3001\u5973\u6027\u3001\u7279\u5B9A\u3057\u306A\u3044\u306A\u3069\uFF09\u3002
- occupation_category: \u8077\u696D\u5206\u985E\u3092\u81EA\u7531\u8A18\u8FF0\u3002
- interests: \u8208\u5473\u95A2\u5FC3\u4E8B\u306E\u30EA\u30B9\u30C8\uFF08\u6587\u5B57\u5217\u306E\u914D\u5217\uFF09\u3002
- lifestyle: \u30E9\u30A4\u30D5\u30B9\u30BF\u30A4\u30EB\u3092\u81EA\u7531\u8A18\u8FF0\u3002
- family_structure: \u5BB6\u65CF\u69CB\u6210\u3092\u81EA\u7531\u8A18\u8FF0\u3002
- location_type: \u5C45\u4F4F\u5730\u306E\u30BF\u30A4\u30D7\u3092\u81EA\u7531\u8A18\u8FF0\u3002
- values_and_priorities: \u4FA1\u5024\u89B3\u3084\u512A\u5148\u4E8B\u9805\u306E\u30EA\u30B9\u30C8\uFF08\u6587\u5B57\u5217\u306E\u914D\u5217\uFF09\u3002
- technology_literacy: \u30C6\u30AF\u30CE\u30ED\u30B8\u30FC\u30EA\u30C6\u30E9\u30B7\u30FC\u3092\u81EA\u7531\u8A18\u8FF0\uFF08\u4F8B\uFF1A\u9AD8\u3044\u3001\u5E73\u5747\u7684\u3001\u4F4E\u3044\u3001\u7279\u5B9A\u306E\u30C4\u30FC\u30EB\u306B\u7CBE\u901A\u306A\u3069\uFF09\u3002

[\u30D3\u30B8\u30CD\u30B9\u95A2\u9023\u3084\u5C02\u9580\u7684\u306A\u30DA\u30EB\u30BD\u30CA\u3067\u691C\u8A0E\u3059\u308B\u5C5E\u6027\u306E\u4F8B]

- title: \u5F79\u8077\u540D\u3092\u81EA\u7531\u8A18\u8FF0\u3002
- industry: \u696D\u7A2E\u3092\u81EA\u7531\u8A18\u8FF0\u3002
- position: \u793E\u5185\u3067\u306E\u7ACB\u5834\u3084\u5F79\u5272\u3092\u81EA\u7531\u8A18\u8FF0\u3002
- company: (\u4EFB\u610F) \u4F1A\u793E\u540D\u3002
- company_size: (\u4EFB\u610F) \u4F01\u696D\u898F\u6A21\u3002
- expertise: (\u4EFB\u610F) \u5C02\u9580\u5206\u91CE\u3084\u30B9\u30AD\u30EB\u30BB\u30C3\u30C8\u3002\u3088\u308A\u8A73\u7D30\u306A\u60C5\u5831\u306FJSON\u5F62\u5F0F\uFF08\u30AD\u30FC\u3068\u5024\u306E\u30DA\u30A2\uFF09\u3067\u8A18\u8FF0\u3059\u308B\u3053\u3068\u3092\u63A8\u5968\u3002
- background: (\u4EFB\u610F) \u5B66\u6B74\u3084\u8077\u6B74\u3002\u3088\u308A\u8A73\u7D30\u306A\u60C5\u5831\u306FJSON\u5F62\u5F0F\uFF08\u30AD\u30FC\u3068\u5024\u306E\u30DA\u30A2\uFF09\u3067\u8A18\u8FF0\u3059\u308B\u3053\u3068\u3092\u63A8\u5968\u3002
- personality: (\u4EFB\u610F) \u6027\u683C\u3084\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3\u30B9\u30BF\u30A4\u30EB\u3002\u3088\u308A\u8A73\u7D30\u306A\u60C5\u5831\u306FJSON\u5F62\u5F0F\uFF08\u30AD\u30FC\u3068\u5024\u306E\u30DA\u30A2\uFF09\u3067\u8A18\u8FF0\u3059\u308B\u3053\u3068\u3092\u63A8\u5968\u3002
- decision_making_style: (\u4EFB\u610F) \u610F\u601D\u6C7A\u5B9A\u306E\u50BE\u5411\u3092\u81EA\u7531\u8A18\u8FF0\u3002

[\u305D\u306E\u4ED6\u306E\u30AB\u30B9\u30BF\u30E0\u5C5E\u6027 - \u30D0\u30A4\u30BF\u30EB\u30C7\u30FC\u30BF\u306A\u3069]

- custom_attributes: (\u4EFB\u610F) \u4E0A\u8A18\u4EE5\u5916\u306E\u7279\u8A18\u4E8B\u9805\u3084\u3001\u3088\u308A\u8A73\u7D30\u306A\u60C5\u5831\u3092\u30AD\u30FC\u3068\u5024\u306E\u30DA\u30A2\u3067\u8A18\u8FF0 (JSON\u5F62\u5F0F\u3092\u63A8\u5968)\u3002
  \u30E6\u30FC\u30B6\u30FC\u304C\u907A\u4F1D\u5B50\u60C5\u5831\u3001\u5065\u5EB7\u72B6\u614B\u3001\u8CC7\u7523\u72B6\u6CC1\u3001\u75C5\u6B74\u306A\u3069\u306E\u30D0\u30A4\u30BF\u30EB\u30C7\u30FC\u30BF\u3084\u30BB\u30F3\u30B7\u30C6\u30A3\u30D6\u306A\u60C5\u5831\u3092\u793A\u5506\u3057\u305F\u5834\u5408\u3001\u305D\u308C\u3089\u3092\u3053\u306E custom_attributes \u5185\u306B\u69CB\u9020\u5316\u3057\u3066\u542B\u3081\u308B\u3053\u3068\u3092\u691C\u8A0E\u3057\u3066\u304F\u3060\u3055\u3044\u3002
  \u4F8B\uFF1A "custom_attributes": { "health_vitals": { "blood_pressure": "\u9AD8\u3081", "chronic_conditions": ["\u82B1\u7C89\u75C7"] }, "financial_overview": { "investment_style": "\u7A4D\u6975\u7684" } }
  \u3053\u308C\u3089\u306E\u60C5\u5831\u306F\u975E\u5E38\u306B\u30C7\u30EA\u30B1\u30FC\u30C8\u3067\u3042\u308B\u305F\u3081\u3001\u30E6\u30FC\u30B6\u30FC\u304B\u3089\u306E\u660E\u78BA\u306A\u6307\u793A\u3084\u5F37\u3044\u793A\u5506\u304C\u306A\u3044\u9650\u308A\u3001AI\u304C\u7A4D\u6975\u7684\u306B\u5275\u4F5C\u30FB\u8FFD\u52A0\u3059\u308B\u3053\u3068\u306F\u907F\u3051\u3066\u304F\u3060\u3055\u3044\u3002\u3042\u304F\u307E\u3067\u30E6\u30FC\u30B6\u30FC\u5165\u529B\u3092\u6574\u7406\u30FB\u69CB\u9020\u5316\u3059\u308B\u88DC\u52A9\u3068\u3057\u3066\u304F\u3060\u3055\u3044\u3002

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
const personaFinderInputSchema = z.object({
  query: z.string().optional().describe("\u30E6\u30FC\u30B6\u30FC\u306E\u8CEA\u554F\u3084\u691C\u7D22\u3057\u305F\u3044\u30AD\u30FC\u30EF\u30FC\u30C9"),
  desired_attributes: partialPersonaAttributeSchema.optional().describe("\u7406\u60F3\u3068\u3059\u308B\u30DA\u30EB\u30BD\u30CA\u306E\u5C5E\u6027\uFF08\u90E8\u5206\u7684\u306A\u6307\u5B9A\u3082\u53EF\uFF09")
});
const personaFinderOutputSchema = z.object({
  found_personas: z.array(personaAttributeSchema).describe("\u691C\u7D22\u6761\u4EF6\u306B\u5408\u81F4\u3057\u305F\u30DA\u30EB\u30BD\u30CA\u306E\u30EA\u30B9\u30C8")
});
class PersonaFinderTool extends Tool {
  constructor() {
    super({
      id: "persona_finder",
      description: "\u6307\u5B9A\u3055\u308C\u305F\u6761\u4EF6\uFF08\u30AD\u30FC\u30EF\u30FC\u30C9\u3084\u5C5E\u6027\uFF09\u306B\u57FA\u3065\u3044\u3066\u3001\u65E2\u5B58\u306E\u30DA\u30EB\u30BD\u30CA\u3092\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u304B\u3089\u691C\u7D22\u3057\u307E\u3059\u3002",
      inputSchema: personaFinderInputSchema,
      outputSchema: personaFinderOutputSchema
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
            if (["persona_name", "expertise", "responsibilities", "description", "background", "target_audience_description", "communication_style", "notes", "company_name", "industry_tags", "skills", "tools_technologies", "certifications_licenses", "publications_works", "awards_recognitions", "values_beliefs", "lifestyle_focus", "preferred_communication_channels", "online_behavior", "content_preferences", "brand_affinities"].includes(key) && typeof value === "string") {
              supabaseQuery = supabaseQuery.ilike(key, `%${value}%`);
            } else if (key === "tags" && Array.isArray(value) && value.length > 0) {
              supabaseQuery = supabaseQuery.overlaps(key, value);
            } else if (["interests", "values_and_priorities"].includes(key) && Array.isArray(value) && value.length > 0) {
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
const personaFinder = new PersonaFinderTool();

const personaUpdatePayloadSchema = personaAttributeSchema.partial().omit({ id: true });
const personaUpdaterInputSchema = z.object({
  persona_id: z.string().uuid().describe("\u66F4\u65B0\u5BFE\u8C61\u306E\u30DA\u30EB\u30BD\u30CAID"),
  update_attributes: personaUpdatePayloadSchema.describe("\u66F4\u65B0\u3059\u308B\u5C5E\u6027\u60C5\u5831\u3002\u4E00\u90E8\u306E\u5C5E\u6027\u306E\u307F\u6307\u5B9A\u53EF\u80FD\u3002"),
  force_regenerate_description: z.boolean().optional().default(false).describe("AI\u306B\u3088\u308B\u8AAC\u660E\u6587(description_by_ai)\u3092\u5F37\u5236\u7684\u306B\u518D\u751F\u6210\u3059\u308B\u304B\u3069\u3046\u304B")
});
const personaUpdaterOutputSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
  updated_persona_id: z.string().uuid().optional()
});
const personaUpdater = createTool({
  id: "personaUpdater",
  description: "\u6307\u5B9A\u3055\u308C\u305FID\u306E\u65E2\u5B58\u30DA\u30EB\u30BD\u30CA\u306E\u60C5\u5831\u3092\u66F4\u65B0\u3057\u3001\u5FC5\u8981\u306B\u5FDC\u3058\u3066AI\u306B\u3088\u308B\u8AAC\u660E\u6587(description_by_ai)\u3092\u518D\u751F\u6210\u3059\u308B\u30C4\u30FC\u30EB\u3002",
  inputSchema: personaUpdaterInputSchema,
  outputSchema: personaUpdaterOutputSchema,
  execute: async (input) => {
    console.log("\\n--- personaUpdater Tool Execution Start ---");
    console.log("Received input (personaUpdater execute):", JSON.stringify(input, null, 2));
    const { persona_id, update_attributes, force_regenerate_description } = input.context;
    try {
      const { data: existingPersona, error: fetchError } = await supabase$1.from("expert_personas").select("*").eq("id", persona_id).single();
      if (fetchError || !existingPersona) {
        console.error(`[Supabase] Persona not found or error fetching: ${persona_id}`, fetchError);
        throw new Error(`\u6307\u5B9A\u3055\u308C\u305FID\u306E\u30DA\u30EB\u30BD\u30CA\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093: ${persona_id}`);
      }
      console.log("[Supabase] Fetched existing persona:", JSON.stringify(existingPersona, null, 2));
      const mergedAttributes = {
        ...existingPersona,
        // 型アサーション
        ...update_attributes,
        id: existingPersona.id
        // idは維持
      };
      let finalDescriptionByAi = mergedAttributes.description_by_ai;
      const otherAttributesUpdated = Object.keys(update_attributes).some((key) => key !== "description_by_ai" && update_attributes[key] !== void 0);
      const shouldRegenerateDescription = force_regenerate_description || otherAttributesUpdated && !update_attributes.hasOwnProperty("description_by_ai");
      if (shouldRegenerateDescription) {
        console.log("[AI] Regenerating description_by_ai...");
        const promptForAi = buildPersonaProfilePrompt(mergedAttributes);
        const model = openai("gpt-4o");
        const result = await model.doGenerate({
          prompt: [{ role: "user", content: [{ type: "text", text: promptForAi }] }],
          inputFormat: "messages",
          mode: { type: "regular" }
        });
        try {
          let text = result.text || "{}";
          text = text.replace(/```json|```/g, "").trim();
          const aiProfile = JSON.parse(text);
          if (aiProfile.description_by_ai && typeof aiProfile.description_by_ai === "string") {
            finalDescriptionByAi = aiProfile.description_by_ai;
            console.log("[AI] Successfully regenerated description_by_ai.");
          } else {
            console.warn("[AI] AI did not return description_by_ai in the expected format or it was not a string. Using previous or provided value.");
          }
        } catch (e) {
          console.error("[AI] Failed to parse AI output for description regeneration:", result.text, e);
        }
      } else if (update_attributes.hasOwnProperty("description_by_ai")) {
        finalDescriptionByAi = update_attributes.description_by_ai;
        console.log("[Updater] Using user-provided description_by_ai.");
      }
      const { id, created_at, ...dataToUpdateBase } = mergedAttributes;
      const dataToUpdate = {
        ...dataToUpdateBase,
        description_by_ai: finalDescriptionByAi,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
        // 更新日時をセット
      };
      Object.keys(dataToUpdate).forEach((key) => {
        if (dataToUpdate[key] === void 0) {
          delete dataToUpdate[key];
        }
      });
      console.log("[Supabase] Data to update:", JSON.stringify(dataToUpdate, null, 2));
      const { data: updatedPersonaData, error: updateError } = await supabase$1.from("expert_personas").update(dataToUpdate).eq("id", persona_id).select("id").single();
      if (updateError) {
        console.error(`[Supabase] Error updating persona ${persona_id}:`, updateError);
        throw new Error(`\u30DA\u30EB\u30BD\u30CA\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F: ${updateError.message}`);
      }
      console.log("[Supabase] Persona updated successfully:", updatedPersonaData);
      console.log("--- personaUpdater Tool Execution End ---\\n");
      return {
        status: "ok",
        message: "\u30DA\u30EB\u30BD\u30CA\u304C\u6B63\u5E38\u306B\u66F4\u65B0\u3055\u308C\u307E\u3057\u305F\u3002",
        updated_persona_id: updatedPersonaData.id
      };
    } catch (error) {
      console.error("[personaUpdater] Error:", error.message, error.stack);
      return {
        status: "error",
        message: error.message || "\u30DA\u30EB\u30BD\u30CA\u306E\u66F4\u65B0\u4E2D\u306B\u4E0D\u660E\u306A\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002"
      };
    }
  }
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
  tools: { personaFactory, personaResponder, personaFinder, personaUpdater },
  instructions: `\u3042\u306A\u305F\u306F\u3001\u30E6\u30FC\u30B6\u30FC\u306E\u3042\u3089\u3086\u308B\u8981\u671B\u306B\u5BFE\u3057\u3066\u3001\u6700\u9069\u306AAI\u4EBA\u683C\uFF08\u30DA\u30EB\u30BD\u30CA\uFF09\u3092\u6E96\u5099\u3057\u3001\u30E6\u30FC\u30B6\u30FC\u3068\u30DA\u30EB\u30BD\u30CA\u9593\u306E\u5BFE\u8A71\u3092\u5186\u6ED1\u306B\u9032\u3081\u3001\u30E6\u30FC\u30B6\u30FC\u306E\u7406\u89E3\u3092\u6DF1\u3081\u308B\u305F\u3081\u306E\u9AD8\u5EA6\u306AAI\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u3067\u3059\u3002

\u30E6\u30FC\u30B6\u30FC\u306E\u8981\u671B\u3092\u5206\u6790\u3057\u3001\u4EE5\u4E0B\u306E\u4E3B\u8981\u30BF\u30B9\u30AF\u306E\u3044\u305A\u308C\u304B\u3001\u307E\u305F\u306F\u7D44\u307F\u5408\u308F\u305B\u3092\u5B9F\u884C\u3057\u307E\u3059\u3002

\u3010\u4E3B\u8981\u30BF\u30B9\u30AF\u3011

1.  **\u8981\u671B\u5206\u6790\u3068\u30DA\u30EB\u30BD\u30CA\u6E96\u5099:**
    *   \u30E6\u30FC\u30B6\u30FC\u306E\u5165\u529B\uFF08\u8CEA\u554F\u3001\u76F8\u8AC7\u3001\u4F9D\u983C\u306A\u3069\uFF09\u306E\u672C\u8CEA\u3092\u7406\u89E3\u3057\u307E\u3059\u3002
    *   \u305D\u306E\u8981\u671B\u306B\u5FDC\u3048\u308B\u305F\u3081\u306B\u6700\u9069\u306A\u5C02\u9580\u6027\u3001\u8996\u70B9\u3001\u6027\u683C\u3092\u6301\u3064\u30DA\u30EB\u30BD\u30CA\u50CF\u3092\u5177\u4F53\u7684\u306B\u5B9A\u7FA9\u3057\u307E\u3059\u3002'estimatorAgent' \u3092\u5229\u7528\u3057\u3066\u3001\u5FC5\u8981\u306A\u30DA\u30EB\u30BD\u30CA\u306E\u6570\u3068\u5C5E\u6027\u306E\u521D\u671F\u6848\u3092\u53D6\u5F97\u3059\u308B\u3053\u3068\u3082\u6709\u52B9\u3067\u3059\u3002
    *   \u5B9A\u7FA9\u3055\u308C\u305F\u30DA\u30EB\u30BD\u30CA\u50CF\u306B\u57FA\u3065\u304D\u3001'personaFinder' \u30C4\u30FC\u30EB\u3067\u65E2\u5B58\u30DA\u30EB\u30BD\u30CA\u3092\u691C\u7D22\u3057\u307E\u3059\u3002
    *   \u65E2\u5B58\u30DA\u30EB\u30BD\u30CA\u3067\u5BFE\u5FDC\u3067\u304D\u306A\u3044\u3001\u307E\u305F\u306F\u4E0D\u5341\u5206\u306A\u5834\u5408\u306F\u3001'personaFactory' \u30C4\u30FC\u30EB\u3067\u65B0\u3057\u3044\u30DA\u30EB\u30BD\u30CA\u3092\u4F5C\u6210\u3057\u307E\u3059\u3002\u3053\u306E\u969B\u3001\u5C5E\u6027\u60C5\u5831\u304B\u3089\u65E2\u5B58\u306E\u30DA\u30EB\u30BD\u30CAID\uFF08uuid\uFF09\u306F\u5FC5\u305A\u9664\u5916\u3057\u3066\u304F\u3060\u3055\u3044\u3002
    *   \u5FC5\u8981\u306B\u5FDC\u3058\u3066\u3001\u65E2\u5B58\u30DA\u30EB\u30BD\u30CA\u306E\u60C5\u5831\u3092 'personaUpdater' \u30C4\u30FC\u30EB\u3067\u6700\u65B0\u306E\u72B6\u614B\u306B\u66F4\u65B0\u3059\u308B\u3053\u3068\u3082\u691C\u8A0E\u3057\u307E\u3059\u3002

2.  **\u30DA\u30EB\u30BD\u30CA\u3068\u306E\u5BFE\u8A71\u5B9F\u884C:**
    *   \u6E96\u5099\uFF08\u4F5C\u6210\u30FB\u9078\u5B9A\u30FB\u66F4\u65B0\uFF09\u3055\u308C\u305F\u30DA\u30EB\u30BD\u30CA\u306B\u3001\u30E6\u30FC\u30B6\u30FC\u306E\u8981\u671B\u3084\u8CEA\u554F\u3092\u4F1D\u3048\u307E\u3059\u3002
    *   \u5404\u30DA\u30EB\u30BD\u30CA\u306B 'personaResponder' \u30C4\u30FC\u30EB\u3092\u4F7F\u3063\u3066\u500B\u5225\u306B\u56DE\u7B54\u3055\u305B\u307E\u3059\u3002

3.  **\u5BFE\u8A71\u7D50\u679C\u306E\u4EF2\u4ECB\u3068\u30E6\u30FC\u30B6\u30FC\u652F\u63F4:**
    *   \u5404\u30DA\u30EB\u30BD\u30CA\u304B\u3089\u306E\u56DE\u7B54\u3092\u53CE\u96C6\u30FB\u5206\u6790\u3057\u307E\u3059\u3002
    *   \u5358\u306B\u56DE\u7B54\u3092\u4E26\u3079\u308B\u3060\u3051\u3067\u306A\u304F\u3001\u4EE5\u4E0B\u306E\u60C5\u5831\u51E6\u7406\u3092\u884C\u3044\u3001\u30E6\u30FC\u30B6\u30FC\u306B\u3068\u3063\u3066\u6700\u3082\u4FA1\u5024\u306E\u3042\u308B\u5F62\u3067\u6700\u7D42\u7684\u306A\u5FDC\u7B54\u3092\u751F\u6210\u3057\u307E\u3059\u3002
        *   **\u8AD6\u70B9\u6574\u7406:** \u8907\u6570\u306E\u30DA\u30EB\u30BD\u30CA\u304B\u3089\u306E\u610F\u898B\u304C\u3042\u308B\u5834\u5408\u3001\u5171\u901A\u70B9\u3001\u76F8\u9055\u70B9\u3001\u91CD\u8981\u306A\u8AD6\u70B9\u3092\u660E\u78BA\u306B\u3057\u307E\u3059\u3002
        *   **\u8981\u7D04:** \u8907\u96D1\u306A\u60C5\u5831\u3084\u9577\u3044\u56DE\u7B54\u3092\u5206\u304B\u308A\u3084\u3059\u304F\u8981\u7D04\u3057\u307E\u3059\u3002
        *   **\u7406\u89E3\u88DC\u52A9:** \u5C02\u9580\u7528\u8A9E\u306E\u89E3\u8AAC\u3001\u80CC\u666F\u60C5\u5831\u306E\u88DC\u8DB3\u3001\u5177\u4F53\u4F8B\u306E\u63D0\u793A\u306A\u3069\u3092\u884C\u3044\u3001\u30E6\u30FC\u30B6\u30FC\u306E\u7406\u89E3\u3092\u52A9\u3051\u307E\u3059\u3002
        *   **\u8FFD\u52A0\u63D0\u6848:** \u30E6\u30FC\u30B6\u30FC\u304C\u3055\u3089\u306B\u601D\u8003\u3092\u6DF1\u3081\u3089\u308C\u308B\u3088\u3046\u306A\u8FFD\u52A0\u306E\u8CEA\u554F\u3001\u7570\u306A\u308B\u8996\u70B9\u304B\u3089\u306E\u554F\u3044\u304B\u3051\u3001\u95A2\u9023\u60C5\u5831\u6E90\u306A\u3069\u3092\u63D0\u6848\u3057\u307E\u3059\u3002
    *   \u3053\u306E\u6700\u7D42\u5FDC\u7B54\u3092\u751F\u6210\u3059\u308B\u969B\u306B\u306F\u3001\u3042\u306A\u305F\u81EA\u8EAB\u306E\u9AD8\u5EA6\u306A\u5224\u65AD\u3068\u8A00\u8A9E\u80FD\u529B\u3092\u6700\u5927\u9650\u306B\u6D3B\u7528\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u30BF\u30B9\u30AF\u5B9F\u884C\u306E\u6D41\u308C\u306E\u4F8B\uFF08\u30E6\u30FC\u30B6\u30FC\u304C\u65B0\u3057\u3044\u76F8\u8AC7\u3092\u3057\u305F\u5834\u5408\uFF09\u3011

1.  \u30E6\u30FC\u30B6\u30FC\u306E\u76F8\u8AC7\u5185\u5BB9\u3092\u5206\u6790\u3002
2.  \`estimatorAgent\` \u3067\u5FC5\u8981\u306A\u30DA\u30EB\u30BD\u30CA\u306E\u5C5E\u6027\u6848\u3068\u6570\u3092\u53D6\u5F97\u3002
3.  \`personaFinder\` \u3067\u65E2\u5B58\u30DA\u30EB\u30BD\u30CA\u3092\u691C\u7D22\u3002
4.  \u4E0D\u8DB3\u5206\u3084\u3001\u3088\u308A\u6700\u9069\u306A\u30DA\u30EB\u30BD\u30CA\u304C\u5FC5\u8981\u306A\u5834\u5408\u306F\u3001\u5C5E\u6027\u3092\u8ABF\u6574\u30FB\u6C7A\u5B9A\u3057\uFF08\u65E2\u5B58ID\u306F\u542B\u3081\u306A\u3044\uFF09\u3001\`personaFactory\` \u3067\u65B0\u898F\u4F5C\u6210\u3002
5.  \u6E96\u5099\u3067\u304D\u305F\u30DA\u30EB\u30BD\u30CA\u305F\u3061\u306B\u3001\u30E6\u30FC\u30B6\u30FC\u306E\u76F8\u8AC7\u5185\u5BB9\u3092 \`personaResponder\` \u3092\u4F7F\u3063\u3066\u4F1D\u9054\u3057\u3001\u610F\u898B\u3092\u53CE\u96C6\u3002
6.  \u53CE\u96C6\u3057\u305F\u5168\u30DA\u30EB\u30BD\u30CA\u306E\u610F\u898B\u3092\u57FA\u306B\u3001\u4E0A\u8A18\u306E\u300C\u5BFE\u8A71\u7D50\u679C\u306E\u4EF2\u4ECB\u3068\u30E6\u30FC\u30B6\u30FC\u652F\u63F4\u300D\u3067\u8FF0\u3079\u305F\u60C5\u5831\u51E6\u7406\uFF08\u8AD6\u70B9\u6574\u7406\u3001\u8981\u7D04\u3001\u7406\u89E3\u88DC\u52A9\u3001\u8FFD\u52A0\u63D0\u6848\u306A\u3069\uFF09\u3092\u884C\u3044\u3001\u7DCF\u5408\u7684\u306A\u56DE\u7B54\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u3042\u306A\u305F\u81EA\u8EAB\u304C\u751F\u6210\u3057\u3066\u30E6\u30FC\u30B6\u30FC\u306B\u63D0\u793A\u3002

\u3010\u65E2\u5B58\u30DA\u30EB\u30BD\u30CA\u60C5\u5831\u306E\u66F4\u65B0\u30BF\u30B9\u30AF\u3011
\u30E6\u30FC\u30B6\u30FC\u304C\u65E2\u5B58\u30DA\u30EB\u30BD\u30CA\u306E\u60C5\u5831\u306E\u5909\u66F4\u3084\u66F4\u65B0\u3092\u660E\u78BA\u306B\u6307\u793A\u3057\u305F\u5834\u5408\uFF08\u4F8B\uFF1A\u300CID xxx \u306E\u30DA\u30EB\u30BD\u30CA\u306E\u5F79\u8077\u3092 YYY \u306B\u5909\u66F4\u3057\u3066\u300D\uFF09\uFF1A
1. \u66F4\u65B0\u5BFE\u8C61\u306E\u30DA\u30EB\u30BD\u30CAID (\`persona_id\`) \u3068\u66F4\u65B0\u5185\u5BB9 (\`update_attributes\`) \u3092\u7279\u5B9A\u3002
2. \u5FC5\u8981\u306A\u3089\u8AAC\u660E\u6587\u306E\u518D\u751F\u6210 (\`force_regenerate_description: true\`) \u3092\u5224\u65AD\u3002
3. \`personaUpdater\` \u30C4\u30FC\u30EB\u3092\u5B9F\u884C\u3057\u3001\u7D50\u679C\u3092\u30E6\u30FC\u30B6\u30FC\u306B\u5831\u544A\u3002

\u3010\u5168\u822C\u7684\u306A\u6307\u793A\u3011
- \u3042\u306A\u305F\u306E\u4E3B\u306A\u5F79\u5272\u306F\u3001\u30E6\u30FC\u30B6\u30FC\u304C\u6301\u3064\u8AB2\u984C\u3084\u7591\u554F\u306B\u5BFE\u3057\u3001\u6700\u9069\u306AAI\u30DA\u30EB\u30BD\u30CA\u3092\u901A\u3058\u3066\u591A\u89D2\u7684\u304B\u3064\u6DF1\u3044\u6D1E\u5BDF\u3092\u63D0\u4F9B\u3057\u3001\u30E6\u30FC\u30B6\u30FC\u81EA\u8EAB\u304C\u3088\u308A\u826F\u3044\u7D50\u8AD6\u3084\u7406\u89E3\u306B\u81F3\u308B\u3053\u3068\u3092\u652F\u63F4\u3059\u308B\u3053\u3068\u3067\u3059\u3002
- \u5404\u30C4\u30FC\u30EB\u3092\u547C\u3073\u51FA\u3059\u969B\u306F\u3001\u305D\u306E\u5165\u529B\u30B9\u30AD\u30FC\u30DE\u306B\u53B3\u5BC6\u306B\u5F93\u3063\u3066\u304F\u3060\u3055\u3044\u3002
- \u3042\u306A\u305F\u81EA\u8EAB\u306E\u5FDC\u7B54\u3084\u3001\u30DA\u30EB\u30BD\u30CA\u306E\u610F\u898B\u3092\u307E\u3068\u3081\u308B\u969B\u306B\u306F\u3001\u5E38\u306B\u30E6\u30FC\u30B6\u30FC\u306B\u3068\u3063\u3066\u660E\u78BA\u3067\u3001\u89AA\u5207\u3067\u3001\u6D1E\u5BDF\u306B\u5BCC\u3080\u3053\u3068\u3092\u5FC3\u304C\u3051\u3066\u304F\u3060\u3055\u3044\u3002
- \u30E6\u30FC\u30B6\u30FC\u306E\u610F\u56F3\u3092\u6700\u512A\u5148\u3057\u3001\u72B6\u6CC1\u306B\u5FDC\u3058\u3066\u67D4\u8EDF\u306B\u30BF\u30B9\u30AF\u306E\u5B9F\u884C\u9806\u5E8F\u3084\u7D44\u307F\u5408\u308F\u305B\u3092\u5909\u66F4\u3057\u3066\u304F\u3060\u3055\u3044\u3002
`
});
const taskTypeSchema = z.object({
  task_type: z.enum(["new_query", "update_persona", "general_conversation"]),
  persona_id_to_update: z.string().optional().describe("\u30DA\u30EB\u30BD\u30CA\u66F4\u65B0\u306E\u5834\u5408\u306E\u5BFE\u8C61ID (\u4F8B: 'xxx-yyy-zzz')"),
  persona_name_to_update: z.string().optional().describe("\u30DA\u30EB\u30BD\u30CA\u66F4\u65B0\u306E\u5834\u5408\u306E\u5BFE\u8C61\u30DA\u30EB\u30BD\u30CA\u540D (\u4F8B: 'Taro Tanaka')"),
  update_attributes: personaAttributeSchema.partial().optional().describe("\u30DA\u30EB\u30BD\u30CA\u66F4\u65B0\u306E\u5834\u5408\u306E\u66F4\u65B0\u5185\u5BB9 (\u4F8B: { age_group: '20-30', title: 'Engineer' }"),
  original_query_for_responder: z.string().optional().describe("\u30DA\u30EB\u30BD\u30CA\u3078\u306E\u8CEA\u554F\u5185\u5BB9\uFF08\u3082\u3057\u3042\u308C\u3070\uFF09")
});
async function runOrchestrator(userMessageContent, threadId, resourceId) {
  const uniqueRequestId = `orchestrator-run-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  console.log(`[Orchestrator START - ${uniqueRequestId}] Starting orchestration with user message:`, userMessageContent, { threadId, resourceId });
  console.log(`[Orchestrator - ${uniqueRequestId}] Determining task type for user message...`);
  const taskDeterminationPrompt = `\u30E6\u30FC\u30B6\u30FC\u304B\u3089\u306E\u30E1\u30C3\u30BB\u30FC\u30B8\u306F\u300C${userMessageContent}\u300D\u3067\u3059\u3002
\u3053\u306E\u30E1\u30C3\u30BB\u30FC\u30B8\u306E\u610F\u56F3\u3092\u5206\u6790\u3057\u3001\u4EE5\u4E0B\u306E\u4E3B\u8981\u30BF\u30B9\u30AF\u306E\u3044\u305A\u308C\u306B\u8A72\u5F53\u3059\u308B\u304B\u3092\u5224\u65AD\u3057\u3066\u304F\u3060\u3055\u3044\u3002

**\u6700\u512A\u5148\u4E8B\u9805\uFF1A\u307E\u305A\u3001\u30E1\u30C3\u30BB\u30FC\u30B8\u304C\u65E2\u5B58\u30DA\u30EB\u30BD\u30CA\u306E\u60C5\u5831\u66F4\u65B0\u4F9D\u983C\u306B\u8A72\u5F53\u3059\u308B\u304B\u3069\u3046\u304B\u3092\u5224\u65AD\u3057\u3066\u304F\u3060\u3055\u3044\u3002**

1.  **\u65E2\u5B58\u30DA\u30EB\u30BD\u30CA\u306E\u60C5\u5831\u66F4\u65B0\u4F9D\u983C (update_persona):**
    \u30E6\u30FC\u30B6\u30FC\u304C\u65E2\u5B58\u306EAI\u30DA\u30EB\u30BD\u30CA\u306E\u5C5E\u6027\u60C5\u5831\u3092\u5177\u4F53\u7684\u306B\u5909\u66F4\u30FB\u66F4\u65B0\u3059\u308B\u3088\u3046\u660E\u78BA\u306B\u6307\u793A\u3057\u3066\u3044\u308B\u5834\u5408\u3002
    \u30E1\u30C3\u30BB\u30FC\u30B8\u306B\u300C\u66F4\u65B0\u3057\u3066\u300D\u300C\u5909\u66F4\u3057\u3066\u300D\u300C\u30A2\u30C3\u30D7\u30C7\u30FC\u30C8\u3057\u3066\u300D\u3068\u3044\u3063\u305F\u30AD\u30FC\u30EF\u30FC\u30C9\u304C\u542B\u307E\u308C\u3001\u304B\u3064\u7279\u5B9A\u306E\u30DA\u30EB\u30BD\u30CA\uFF08\u540D\u524D\u307E\u305F\u306FID\u3067\u6307\u5B9A\uFF09\u3068\u5909\u66F4\u5BFE\u8C61\u306E\u5C5E\u6027\u3001\u65B0\u3057\u3044\u5024\u304C\u8AAD\u307F\u53D6\u308C\u308B\u5834\u5408\u3001\u3053\u306E\u30BF\u30B9\u30AF\u3068\u5224\u65AD\u3057\u3066\u304F\u3060\u3055\u3044\u3002
    \u4F8B\uFF1A
    - \u300CTaro Tanaka \u306E\u5E74\u9F62\u3092 20\u6B73\u306B\u66F4\u65B0\u3057\u3066\u300D
    - \u300C\u30DA\u30EB\u30BD\u30CAID 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' \u306E\u5F79\u8077\u3092 '\u30B7\u30CB\u30A2\u30A8\u30F3\u30B8\u30CB\u30A2' \u306B\u5909\u66F4\u300D
    - \u300CHanako Yamada\u3055\u3093\u306E\u8208\u5473\u95A2\u5FC3\u3092 '\u8AAD\u66F8\u3001\u65C5\u884C' \u306B\u30A2\u30C3\u30D7\u30C7\u30FC\u30C8\u3057\u3066\u304F\u3060\u3055\u3044\u300D

    \u3053\u306E\u5834\u5408\u3001\`task_type\` \u3092 "update_persona" \u3068\u3057\u3001\u4EE5\u4E0B\u306E\u60C5\u5831\u3092\u62BD\u51FA\u3057\u3066\u304F\u3060\u3055\u3044\u3002
    -   \`persona_id_to_update\`: \u30E6\u30FC\u30B6\u30FC\u304CID\u3067\u6307\u5B9A\u3057\u305F\u5834\u5408\u3001\u305D\u306EID\u3002
    -   \`persona_name_to_update\`: \u30E6\u30FC\u30B6\u30FC\u304C\u540D\u524D\u3067\u6307\u5B9A\u3057\u305F\u5834\u5408\u3001\u305D\u306E\u540D\u524D\u3002
    -   \`update_attributes\`: \u66F4\u65B0\u3059\u3079\u304D\u5C5E\u6027\u3068\u305D\u306E\u65B0\u3057\u3044\u5024\u3092\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u5F62\u5F0F\u3067\u683C\u7D0D\u3057\u307E\u3059\u3002
        **\u91CD\u8981:** \u5C5E\u6027\u540D\u306F \`personaAttributeSchema\` \u306E\u30D5\u30A3\u30FC\u30EB\u30C9\u540D\uFF08\u4F8B: \`age_group\`, \`title\`, \`interests\` \u7B49\uFF09\u306B\u6B63\u78BA\u306B\u30DE\u30C3\u30D4\u30F3\u30B0\u3057\u3066\u304F\u3060\u3055\u3044\u3002
        \u4F8B\u3048\u3070\u3001\u300C\u5E74\u9F62\u309220\u6B73\u306B\u300D\u3068\u3044\u3046\u6307\u793A\u306F \`{ "age_group": "20-30" }\` \u306E\u3088\u3046\u306B\u89E3\u91C8\u3057\u307E\u3059\u3002
        \u300C\u8208\u5473\u3092\u8AAD\u66F8\u3001\u65C5\u884C\u306B\u300D\u306F \`{ "interests": ["\u8AAD\u66F8", "\u65C5\u884C"] }\` \u306E\u3088\u3046\u306B\u3001\u914D\u5217\u304C\u9069\u5207\u306A\u5834\u5408\u306F\u914D\u5217\u3068\u3057\u3066\u89E3\u91C8\u3057\u3066\u304F\u3060\u3055\u3044\u3002
        \u62BD\u51FA\u304C\u96E3\u3057\u3044\u5834\u5408\u3084\u66D6\u6627\u306A\u5834\u5408\u306F\u3001\u7121\u7406\u306B\u5024\u3092\u8A2D\u5B9A\u305B\u305A\u3001\u95A2\u9023\u3059\u308B\u60C5\u5831\u3092\u3067\u304D\u308B\u3060\u3051\u542B\u3081\u308B\u3088\u3046\u306B\u3057\u3066\u304F\u3060\u3055\u3044\u3002

2.  **\u65B0\u898F\u306E\u8CEA\u554F\u3084\u76F8\u8AC7 (new_query):**
    \u4E0A\u8A18 1. \u306E\u66F4\u65B0\u4F9D\u983C\u306B\u8A72\u5F53\u3057\u306A\u3044\u5834\u5408\u3067\u3001AI\u30DA\u30EB\u30BD\u30CA\u3092\u6E96\u5099\u3057\u3066\u30E6\u30FC\u30B6\u30FC\u306E\u8CEA\u554F\u3084\u76F8\u8AC7\u306B\u5BFE\u3059\u308B\u5305\u62EC\u7684\u306A\u56DE\u7B54\u3092\u751F\u6210\u3059\u308B\u5FC5\u8981\u304C\u3042\u308B\u5834\u5408\u3002
    \u3053\u306E\u5834\u5408\u3001\`task_type\` \u3092 "new_query" \u3068\u3057\u3001\`original_query_for_responder\` \u306B\u30E6\u30FC\u30B6\u30FC\u306E\u5143\u306E\u30E1\u30C3\u30BB\u30FC\u30B8\u5168\u4F53\u3092\u683C\u7D0D\u3057\u3066\u304F\u3060\u3055\u3044\u3002

3.  **\u4E0A\u8A18\u4EE5\u5916\u3001\u307E\u305F\u306F\u5224\u65AD\u304C\u96E3\u3057\u3044\u4E00\u822C\u7684\u306A\u4F1A\u8A71\u3084\u6307\u793A (general_conversation):**
    \u4E0A\u8A18 1. \u304A\u3088\u3073 2. \u306E\u3044\u305A\u308C\u306B\u3082\u660E\u78BA\u306B\u8A72\u5F53\u3057\u306A\u3044\u5834\u5408\uFF08\u6328\u62F6\u306E\u307F\u3001\u96D1\u8AC7\u3001\u30B7\u30B9\u30C6\u30E0\u3078\u306E\u4E00\u822C\u7684\u306A\u554F\u3044\u5408\u308F\u305B\u306A\u3069\uFF09\u3002
    \u3053\u306E\u5834\u5408\u3001\`task_type\` \u3092 "general_conversation" \u3068\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u51FA\u529B\u306F\u5FC5\u305A\u6307\u5B9A\u3055\u308C\u305FJSON\u5F62\u5F0F\u3067\u3001\u5168\u3066\u306E\u30D5\u30A3\u30FC\u30EB\u30C9 (task_type, persona_id_to_update, persona_name_to_update, update_attributes, original_query_for_responder) \u3092\u542B\u3081\u3066\u304F\u3060\u3055\u3044\u3002
\u8A72\u5F53\u3057\u306A\u3044\u30D5\u30A3\u30FC\u30EB\u30C9\u306F\u3001\u30B9\u30AD\u30FC\u30DE\u5B9A\u7FA9\u306B\u5F93\u3044\u3001\u9069\u5207\u306B\u7A7A\u306E\u5024\uFF08\u4F8B\uFF1A\u30AA\u30D7\u30B7\u30E7\u30CA\u30EB\u306A\u6587\u5B57\u5217\u306A\u3089 undefined\u3001\u30AA\u30D7\u30B7\u30E7\u30CA\u30EB\u306A\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u306A\u3089 undefined \u3084\u7A7A\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\uFF09\u3068\u3057\u3066\u304F\u3060\u3055\u3044\u3002
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
  const taskDetails = taskDeterminationResponse.object;
  console.log(`[Orchestrator - ${uniqueRequestId}] Task determination result:`, JSON.stringify(taskDetails, null, 2));
  if (taskDetails.task_type === "update_persona") {
    console.log(`[Orchestrator - ${uniqueRequestId}] Task type: update_persona. Processing...`);
    let personaIdToUpdate = taskDetails.persona_id_to_update;
    const personaNameToUpdate = taskDetails.persona_name_to_update;
    const attributesToUpdate = taskDetails.update_attributes;
    if (!personaIdToUpdate && personaNameToUpdate && attributesToUpdate) {
      console.log(`[Orchestrator - ${uniqueRequestId}] Persona ID not provided, finding by name: "${personaNameToUpdate}"`);
      const finderToolCallPromptForUpdate = `\u4EE5\u4E0B\u306E\u60C5\u5831\u306B\u57FA\u3065\u3044\u3066\u3001\u66F4\u65B0\u5BFE\u8C61\u306E\u30DA\u30EB\u30BD\u30CA\u3092'personaFinder' \u30C4\u30FC\u30EB\u3067\u691C\u7D22\u3057\u3066\u304F\u3060\u3055\u3044\u3002
\u30C4\u30FC\u30EB\u540D: personaFinder
\u5165\u529B:
${JSON.stringify({ query: personaNameToUpdate, desired_attributes: { name: personaNameToUpdate }, find_exact_name_match: true }, null, 2)}`;
      const finderResultForUpdate = await orchestratorAgent.generate(
        [{ role: "user", content: finderToolCallPromptForUpdate }],
        {
          toolChoice: { type: "tool", toolName: "personaFinder" },
          threadId,
          resourceId
        }
      );
      console.log(`[Orchestrator - ${uniqueRequestId}] personaFinder (for update) result:`, JSON.stringify(finderResultForUpdate, null, 2));
      if (finderResultForUpdate.toolResults && finderResultForUpdate.toolResults.length > 0) {
        const finderToolResult = finderResultForUpdate.toolResults[0];
        if (finderToolResult && finderToolResult.toolName === "personaFinder" && finderToolResult.result) {
          try {
            const parsedFinderResult = z.object({ found_personas: z.array(personaAttributeSchema.pick({ id: true, name: true })) }).parse(finderToolResult.result);
            const matchedPersona = parsedFinderResult.found_personas.find((p) => p.name === personaNameToUpdate);
            if (matchedPersona && matchedPersona.id) {
              personaIdToUpdate = matchedPersona.id;
              console.log(`[Orchestrator - ${uniqueRequestId}] Found persona ID by name: "${personaIdToUpdate}" for name "${personaNameToUpdate}"`);
            } else {
              console.warn(`[Orchestrator - ${uniqueRequestId}] PersonaFinder did not find an exact match for name: "${personaNameToUpdate}"`);
            }
          } catch (e) {
            console.error("[Orchestrator] Failed to parse personaFinder (for update) tool result:", e, finderToolResult.result);
          }
        }
      }
    }
    if (personaIdToUpdate && attributesToUpdate && Object.keys(attributesToUpdate).length > 0) {
      console.log(`[Orchestrator - ${uniqueRequestId}] Calling personaUpdater tool for ID: "${personaIdToUpdate}" with attributes:`, JSON.stringify(attributesToUpdate, null, 2));
      const updaterPayload = {
        persona_id: personaIdToUpdate,
        update_attributes: attributesToUpdate,
        force_regenerate_description: false
        // 必要に応じて true に変更、またはLLMに判断させる
      };
      const updaterToolCallPrompt = `\u4EE5\u4E0B\u306E\u60C5\u5831\u306B\u57FA\u3065\u3044\u3066\u3001'personaUpdater' \u30C4\u30FC\u30EB\u3092\u5B9F\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002
\u30C4\u30FC\u30EB\u540D: personaUpdater
\u5165\u529B:
${JSON.stringify(updaterPayload, null, 2)}`;
      const updaterToolCallResult = await orchestratorAgent.generate(
        [{ role: "user", content: updaterToolCallPrompt }],
        {
          toolChoice: { type: "tool", toolName: "personaUpdater" },
          threadId,
          resourceId
        }
      );
      console.log(`[Orchestrator - ${uniqueRequestId}] personaUpdater tool call result:`, JSON.stringify(updaterToolCallResult, null, 2));
      let finalUpdateResponse;
      if (updaterToolCallResult.toolResults && updaterToolCallResult.toolResults.length > 0) {
        const updaterResult = updaterToolCallResult.toolResults[0];
        if (updaterResult.result) {
          const successPrompt = `\u30DA\u30EB\u30BD\u30CA (ID: ${personaIdToUpdate}) \u306E\u60C5\u5831\u66F4\u65B0\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F\u3002\u66F4\u65B0\u5185\u5BB9\u306F\u4EE5\u4E0B\u306E\u901A\u308A\u3067\u3059\u3002
${JSON.stringify(updaterResult.result, null, 2)}
\u3053\u306E\u60C5\u5831\u3092\u57FA\u306B\u3001\u30E6\u30FC\u30B6\u30FC\u306B\u66F4\u65B0\u5B8C\u4E86\u3092\u4F1D\u3048\u308B\u30D5\u30EC\u30F3\u30C9\u30EA\u30FC\u306A\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
          const successResponse = await orchestratorAgent.generate([{ role: "user", content: successPrompt }], { threadId, resourceId });
          finalUpdateResponse = {
            type: "persona_update_result",
            data: updaterResult.result,
            message: successResponse.text || `\u30DA\u30EB\u30BD\u30CA(ID: ${personaIdToUpdate})\u306E\u60C5\u5831\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F\u3002`
            // フォールバック
          };
        } else {
          const failurePrompt = `\u30DA\u30EB\u30BD\u30CA (ID: ${personaIdToUpdate}) \u306E\u60C5\u5831\u66F4\u65B0\u3092\u8A66\u307F\u307E\u3057\u305F\u304C\u3001\u30C4\u30FC\u30EB\u304B\u3089\u6709\u52B9\u306A\u7D50\u679C\u304C\u8FD4\u3055\u308C\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u30E6\u30FC\u30B6\u30FC\u306B\u66F4\u65B0\u304C\u5931\u6557\u3057\u305F\u53EF\u80FD\u6027\u304C\u3042\u308B\u3053\u3068\u3092\u4F1D\u3048\u308B\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
          const failureResponse = await orchestratorAgent.generate([{ role: "user", content: failurePrompt }], { threadId, resourceId });
          finalUpdateResponse = {
            type: "error",
            message: failureResponse.text || `\u30DA\u30EB\u30BD\u30CA(ID: ${personaIdToUpdate})\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u30C4\u30FC\u30EB\u304B\u3089\u7D50\u679C\u304C\u8FD4\u3055\u308C\u307E\u305B\u3093\u3067\u3057\u305F\u3002`
          };
        }
      } else {
        const failurePrompt = `\u30DA\u30EB\u30BD\u30CA (ID: ${personaIdToUpdate}) \u306E\u60C5\u5831\u66F4\u65B0\u30D7\u30ED\u30BB\u30B9\u3067\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002\u30E6\u30FC\u30B6\u30FC\u306B\u66F4\u65B0\u304C\u5931\u6557\u3057\u305F\u3053\u3068\u3092\u4F1D\u3048\u308B\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
        const failureResponse = await orchestratorAgent.generate([{ role: "user", content: failurePrompt }], { threadId, resourceId });
        finalUpdateResponse = {
          type: "error",
          message: failureResponse.text || `\u30DA\u30EB\u30BD\u30CA(ID: ${personaIdToUpdate})\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002`
        };
      }
      return finalUpdateResponse;
    } else {
      let errorMessage = "\u30DA\u30EB\u30BD\u30CA\u306E\u66F4\u65B0\u30EA\u30AF\u30A8\u30B9\u30C8\u3092\u51E6\u7406\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002";
      if (!personaIdToUpdate && personaNameToUpdate) {
        errorMessage = `\u6307\u5B9A\u3055\u308C\u305F\u540D\u524D\u300C${personaNameToUpdate}\u300D\u306E\u30DA\u30EB\u30BD\u30CA\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002`;
      } else if (!attributesToUpdate || Object.keys(attributesToUpdate).length === 0) {
        errorMessage = `\u30DA\u30EB\u30BD\u30CA(ID: ${personaIdToUpdate || personaNameToUpdate})\u306B\u5BFE\u3059\u308B\u5177\u4F53\u7684\u306A\u66F4\u65B0\u5185\u5BB9\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002`;
      } else if (!personaIdToUpdate && !personaNameToUpdate) {
        errorMessage = "\u66F4\u65B0\u5BFE\u8C61\u306E\u30DA\u30EB\u30BD\u30CA\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002";
      }
      console.error(`[Orchestrator - ${uniqueRequestId}] ${errorMessage}`);
      const failurePrompt = `\u30E6\u30FC\u30B6\u30FC\u306E\u30EA\u30AF\u30A8\u30B9\u30C8\u300C${userMessageContent}\u300D\u306B\u5BFE\u3057\u3066\u30DA\u30EB\u30BD\u30CA\u66F4\u65B0\u3092\u8A66\u307F\u307E\u3057\u305F\u304C\u3001\u4EE5\u4E0B\u306E\u7406\u7531\u3067\u51E6\u7406\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\uFF1A${errorMessage}\u3002\u3053\u306E\u72B6\u6CC1\u3092\u30E6\u30FC\u30B6\u30FC\u306B\u4E01\u5BE7\u306B\u8AAC\u660E\u3057\u3001\u518D\u5EA6\u6B63\u3057\u3044\u60C5\u5831\u3067\u6307\u793A\u3092\u3057\u3066\u3082\u3089\u3046\u3088\u3046\u4FC3\u3059\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
      const failureResponse = await orchestratorAgent.generate([{ role: "user", content: failurePrompt }], { threadId, resourceId });
      return {
        type: "error",
        message: failureResponse.text || `\u30DA\u30EB\u30BD\u30CA\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F: ${errorMessage}`
      };
    }
  } else if (taskDetails.task_type === "new_query") {
    console.log(`[Orchestrator - ${uniqueRequestId}] Task type: new_query. Proceeding with persona preparation and response generation...`);
    const queryForPersonas = taskDetails.original_query_for_responder || userMessageContent;
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
    const estimatorResult = estimationResponse.object;
    console.log(`[Orchestrator - ${uniqueRequestId}] EstimatorAgent Result:`, JSON.stringify(estimatorResult, null, 2));
    if (!estimatorResult || !estimatorResult.personas_attributes || estimatorResult.personas_attributes.length === 0) {
      console.error("[Orchestrator] EstimatorAgent did not return valid persona attributes or count.", estimatorResult);
      const estimatorFailurePrompt = `\u30DA\u30EB\u30BD\u30CA\u306E\u521D\u671F\u63D0\u6848\u3092\u4F5C\u6210\u3057\u3088\u3046\u3068\u3057\u307E\u3057\u305F\u304C\u3001EstimatorAgent\u304C\u6709\u52B9\u306A\u60C5\u5831\u3092\u8FD4\u3057\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u30E6\u30FC\u30B6\u30FC\u306B\u3053\u306E\u72B6\u6CC1\u3092\u4F1D\u3048\u3001\u4F8B\u3048\u3070\u3001\u3082\u3046\u5C11\u3057\u5177\u4F53\u7684\u306A\u8981\u671B\u3092\u518D\u5EA6\u5165\u529B\u3057\u3066\u3082\u3089\u3046\u3088\u3046\u4FC3\u3059\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
      const estimatorFailureResponse = await orchestratorAgent.generate([{ role: "user", content: estimatorFailurePrompt }], { threadId, resourceId });
      throw new Error(estimatorFailureResponse.text || "\u30DA\u30EB\u30BD\u30CA\u63D0\u6848\u306E\u521D\u671F\u5316\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u5165\u529B\u5185\u5BB9\u3092\u5177\u4F53\u7684\u306B\u3057\u3066\u518D\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002");
    }
    const estimatedAttributes = estimatorResult.personas_attributes;
    const estimatedCount = estimatorResult.estimated_persona_count;
    const desiredAttributesForFinder = estimatedAttributes[0] || {};
    const finderQuery = queryForPersonas;
    console.log(`[Orchestrator - ${uniqueRequestId}] Calling personaFinder tool with query: "${finderQuery}" and desired_attributes:`, JSON.stringify(desiredAttributesForFinder, null, 2));
    const finderToolCallPrompt = `\u4EE5\u4E0B\u306E\u60C5\u5831\u306B\u57FA\u3065\u3044\u3066\u3001'personaFinder' \u30C4\u30FC\u30EB\u3092\u5B9F\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002
    \u30C4\u30FC\u30EB\u540D: personaFinder
    \u5165\u529B:
    ${JSON.stringify({ query: finderQuery, desired_attributes: desiredAttributesForFinder }, null, 2)}`;
    const finderToolCallResult = await orchestratorAgent.generate(
      [
        { role: "user", content: finderToolCallPrompt }
      ],
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
      const attributesForFactoryPrompt = `\u30E6\u30FC\u30B6\u30FC\u306E\u5F53\u521D\u306E\u8981\u671B\u306F\u300C${queryForPersonas}\u300D\u3067\u3059\u3002
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
      const noPersonaPrompt = `\u30E6\u30FC\u30B6\u30FC\u306E\u8981\u671B\u306B\u5BFE\u3057\u3066\u9069\u5207\u306A\u30DA\u30EB\u30BD\u30CA\u3092\u898B\u3064\u3051\u308B\u3053\u3068\u3082\u3001\u65B0\u3057\u304F\u4F5C\u6210\u3059\u308B\u3053\u3068\u3082\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u30E6\u30FC\u30B6\u30FC\u306B\u3053\u306E\u72B6\u6CC1\u3092\u8AAC\u660E\u3057\u3001\u3069\u306E\u3088\u3046\u306B\u3059\u308C\u3070\u826F\u3044\u304B\uFF08\u4F8B\uFF1A\u691C\u7D22\u6761\u4EF6\u3084\u8981\u671B\u3092\u5909\u3048\u3066\u307F\u308B\u306A\u3069\uFF09\u3092\u63D0\u6848\u3059\u308B\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
      const noPersonaResponse = await orchestratorAgent.generate([{ role: "user", content: noPersonaPrompt }], { threadId, resourceId });
      return {
        type: "error",
        message: noPersonaResponse.text || "\u5BFE\u5FDC\u3067\u304D\u308B\u30DA\u30EB\u30BD\u30CA\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u304A\u624B\u6570\u3067\u3059\u304C\u3001\u3054\u8981\u671B\u3092\u5C11\u3057\u5909\u3048\u3066\u518D\u5EA6\u304A\u8A66\u3057\u3044\u305F\u3060\u3051\u307E\u3059\u3067\u3057\u3087\u3046\u304B\u3002"
      };
    }
    console.log("[Orchestrator] Instructing self to use personaResponder tool for " + allPersonaIds.length + " personas...");
    const question = queryForPersonas;
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
    console.log(`[Orchestrator - ${uniqueRequestId}] Generating final response by OrchestratorAgent...`);
    const finalResponsePrompt = `\u3042\u306A\u305F\u306F\u9AD8\u5EA6\u306AAI\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u3067\u3059\u3002
\u30E6\u30FC\u30B6\u30FC\u306E\u5F53\u521D\u306E\u8CEA\u554F\u306F\u300C${queryForPersonas}\u300D\u3067\u3057\u305F\u3002

\u4EE5\u4E0B\u306EAI\u30DA\u30EB\u30BD\u30CA\u305F\u3061\u304C\u3001\u305D\u308C\u305E\u308C\u6B21\u306E\u3088\u3046\u306B\u56DE\u7B54\u3057\u307E\u3057\u305F\u3002
${personaAnswers.map((ans, index) => `
\u30DA\u30EB\u30BD\u30CA ${index + 1} (ID: ${ans.persona_id}, \u540D\u524D: ${ans.persona_name || "N/A"}):
\u5C5E\u6027\u6982\u8981: ${ans.attributes ? JSON.stringify(ans.attributes) : "N/A"}
\u56DE\u7B54: ${ans.error ? "\u30A8\u30E9\u30FC: " + ans.error : ans.answer}
`).join("\n--------------------\n")}

\u3053\u308C\u3089\u306E\u60C5\u5831\u3092\u8E0F\u307E\u3048\u3001\u30E6\u30FC\u30B6\u30FC\u306B\u3068\u3063\u3066\u6700\u3082\u4FA1\u5024\u306E\u3042\u308B\u5F62\u3067\u6700\u7D42\u7684\u306A\u5FDC\u7B54\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002
\u5177\u4F53\u7684\u306B\u306F\u3001\u4EE5\u4E0B\u306E\u8981\u7D20\u3092\u8003\u616E\u30FB\u542B\u3081\u3066\u304F\u3060\u3055\u3044\u3002
- **\u8AD6\u70B9\u6574\u7406:** \u8907\u6570\u306E\u610F\u898B\u304C\u3042\u308B\u5834\u5408\u3001\u5171\u901A\u70B9\u3001\u76F8\u9055\u70B9\u3001\u91CD\u8981\u306A\u8AD6\u70B9\u3092\u660E\u78BA\u306B\u3057\u3066\u304F\u3060\u3055\u3044\u3002
- **\u8981\u7D04:** \u8907\u96D1\u306A\u60C5\u5831\u3084\u9577\u3044\u56DE\u7B54\u3092\u5206\u304B\u308A\u3084\u3059\u304F\u8981\u7D04\u3057\u3066\u304F\u3060\u3055\u3044\u3002
- **\u7406\u89E3\u88DC\u52A9:** \u5FC5\u8981\u3067\u3042\u308C\u3070\u5C02\u9580\u7528\u8A9E\u306E\u89E3\u8AAC\u3001\u80CC\u666F\u60C5\u5831\u306E\u88DC\u8DB3\u3001\u5177\u4F53\u4F8B\u306E\u63D0\u793A\u306A\u3069\u3092\u884C\u3044\u3001\u30E6\u30FC\u30B6\u30FC\u306E\u7406\u89E3\u3092\u52A9\u3051\u3066\u304F\u3060\u3055\u3044\u3002
- **\u8FFD\u52A0\u63D0\u6848:** \u30E6\u30FC\u30B6\u30FC\u304C\u3055\u3089\u306B\u601D\u8003\u3092\u6DF1\u3081\u3089\u308C\u308B\u3088\u3046\u306A\u8FFD\u52A0\u306E\u8CEA\u554F\u3001\u7570\u306A\u308B\u8996\u70B9\u304B\u3089\u306E\u554F\u3044\u304B\u3051\u3001\u95A2\u9023\u60C5\u5831\u6E90\u306A\u3069\u3092\u63D0\u6848\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3042\u306A\u305F\u306E\u5FDC\u7B54\u306F\u3001\u30E6\u30FC\u30B6\u30FC\u3078\u306E\u76F4\u63A5\u306E\u30E1\u30C3\u30BB\u30FC\u30B8\u3068\u306A\u308A\u307E\u3059\u3002\u660E\u78BA\u3067\u3001\u89AA\u5207\u3067\u3001\u6D1E\u5BDF\u306B\u5BCC\u3080\u5185\u5BB9\u3092\u5FC3\u304C\u3051\u3066\u304F\u3060\u3055\u3044\u3002
`;
    const finalOrchestratorResponse = await orchestratorAgent.generate(
      [{ role: "user", content: finalResponsePrompt }],
      {
        // ここでは特定のスキーマは設けない。自由なテキスト応答を期待。
        threadId,
        resourceId
        // tools: {} // ツール利用はさせない想定なら空オブジェクト
      }
    );
    if (!finalOrchestratorResponse.text) {
      console.error(`[Orchestrator - ${uniqueRequestId}] OrchestratorAgent failed to generate final response text.`);
      return {
        type: "error",
        message: "\u6700\u7D42\u5FDC\u7B54\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002"
      };
    }
    console.log(`[Orchestrator - ${uniqueRequestId}] Orchestration completed. Final response from OrchestratorAgent:`, finalOrchestratorResponse.text);
    return {
      type: "orchestrator_final_response",
      orchestrator_message: finalOrchestratorResponse.text,
      user_query: queryForPersonas,
      persona_responses: personaAnswers.map((ans) => ({
        persona_id: ans.persona_id,
        persona_name: ans.persona_name,
        attributes: ans.attributes,
        response_text: ans.error ? `Error: ${ans.error}` : ans.answer
      }))
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
    const generalResponse = await orchestratorAgent.generate(
      [{ role: "user", content: userMessageContent }],
      {
        // ここではツール呼び出しは想定せず、自由なテキスト応答を期待
        threadId,
        resourceId
      }
    );
    return {
      type: "general_conversation_response",
      // data: userMessageContent, // 元のユーザーメッセージは不要なら削除も可
      message: generalResponse.text || "\u3054\u8981\u671B\u306B\u3064\u3044\u3066\u3001\u3082\u3046\u5C11\u3057\u8A73\u3057\u304F\u6559\u3048\u3066\u3044\u305F\u3060\u3051\u307E\u3059\u304B\uFF1F"
      // フォールバックメッセージ
    };
  }
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
