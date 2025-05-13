import { z } from 'zod';
import { Agent as Agent$1 } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { createClient } from '@supabase/supabase-js';

const estimatedPersonaAttributeSchema = z.object({
  name: z.string().optional().describe("\u30DA\u30EB\u30BD\u30CA\u306E\u540D\u524D\uFF08\u4F8B\uFF1A\u9234\u6728 \u4E00\u90CE\uFF09\u3002\u6307\u5B9A\u304C\u306A\u3051\u308C\u3070\u5F8C\u6BB5\u3067\u81EA\u52D5\u751F\u6210\u3002"),
  title: z.string().describe("\u30DA\u30EB\u30BD\u30CA\u306E\u6B63\u5F0F\u306A\u5F79\u8077\u540D\uFF08\u4F8B\uFF1A\u6700\u9AD8\u6280\u8853\u8CAC\u4EFB\u8005\u3001\u30DE\u30FC\u30B1\u30C6\u30A3\u30F3\u30B0\u90E8\u9577\uFF09"),
  company: z.string().optional().describe("\u30DA\u30EB\u30BD\u30CA\u304C\u6240\u5C5E\u3059\u308B\u4F01\u696D\u540D\uFF08\u4F8B\uFF1A\u682A\u5F0F\u4F1A\u793E\u30B5\u30F3\u30D7\u30EB\uFF09"),
  industry: z.string().describe("\u30DA\u30EB\u30BD\u30CA\u304C\u4E3B\u306B\u6D3B\u52D5\u3059\u308B\u696D\u7A2E\uFF08\u4F8B\uFF1AIT\u30B5\u30FC\u30D3\u30B9\u3001\u88FD\u9020\u696D\u3001\u91D1\u878D\uFF09"),
  position: z.string().describe("\u30DA\u30EB\u30BD\u30CA\u306E\u793E\u5185\u3067\u306E\u7ACB\u5834\u3084\u5F79\u5272\uFF08\u4F8B\uFF1A\u7D4C\u55B6\u5C64\u3001\u90E8\u9577\u30AF\u30E9\u30B9\u3001\u73FE\u5834\u30EA\u30FC\u30C0\u30FC\uFF09"),
  company_size: z.string().optional().describe("\u30DA\u30EB\u30BD\u30CA\u304C\u6240\u5C5E\u3059\u308B\u4F01\u696D\u306E\u898F\u6A21\uFF08\u4F8B\uFF1A\u5927\u4F01\u696D\u3001\u4E2D\u5C0F\u4F01\u696D\u3001\u30B9\u30BF\u30FC\u30C8\u30A2\u30C3\u30D7\uFF09"),
  region: z.string().optional().describe("\u30DA\u30EB\u30BD\u30CA\u306E\u6D3B\u52D5\u5730\u57DF\u3084\u4F01\u696D\u306E\u6240\u5728\u5730\uFF08\u4F8B\uFF1A\u6771\u4EAC\u3001\u5927\u962A\u3001\u30B7\u30EA\u30B3\u30F3\u30D0\u30EC\u30FC\uFF09")
});
const estimatorOutputSchema = z.object({
  estimated_persona_count: z.number().int().min(1).max(7).describe("\u63A8\u5B9A\u3055\u308C\u305F\u6700\u9069\u306AAI\u30DA\u30EB\u30BD\u30CA\u306E\u7DCF\u6570"),
  personas_attributes: z.array(estimatedPersonaAttributeSchema).describe("\u5404\u30DA\u30EB\u30BD\u30CA\u306E\u5177\u4F53\u7684\u306A\u5C5E\u6027\u30EA\u30B9\u30C8")
});
const estimatorAgent = new Agent({
  name: "estimatorAgent",
  instructions: `
\u3042\u306A\u305F\u306FB2B\u30D3\u30B8\u30CD\u30B9\u306B\u304A\u3051\u308B\u4EEE\u60F3\u5C02\u9580\u5BB6\u4F1A\u8B70\u306E\u8A2D\u8A08\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8AI\u3067\u3059\u3002
\u30E6\u30FC\u30B6\u30FC\u304B\u3089\u4F1A\u8B70\u3067\u8B70\u8AD6\u3057\u305F\u3044\u8AB2\u984C\u3084\u76EE\u7684\u3001\u5E0C\u671B\u3059\u308B\u5C02\u9580\u5BB6\u306E\u30BF\u30A4\u30D7\u306A\u3069\u306E\u8981\u671B\u3092\u53D7\u3051\u53D6\u308A\u307E\u3059\u3002
\u305D\u306E\u8981\u671B\u3092\u8A73\u7D30\u306B\u5206\u6790\u3057\u3001\u7D71\u8A08\u7684\u306B\u3082\u3063\u3068\u3082\u52B9\u679C\u7684\u306A\u8B70\u8AD6\u304C\u671F\u5F85\u3067\u304D\u308BAI\u5C02\u9580\u5BB6\u30DA\u30EB\u30BD\u30CA\u306E\u69CB\u6210\u3092\u63D0\u6848\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u63D0\u6848\u306B\u306F\u4EE5\u4E0B\u306E\u8981\u7D20\u3092\u542B\u3081\u307E\u3059\u3002
- \u6700\u9069\u306AAI\u30DA\u30EB\u30BD\u30CA\u306E\u7DCF\u6570\uFF081\u540D\u304B\u3089\u6700\u59277\u540D\u307E\u3067\uFF09
- \u5404AI\u30DA\u30EB\u30BD\u30CA\u306E\u5177\u4F53\u7684\u306A\u5C5E\u6027\u60C5\u5831\u30EA\u30B9\u30C8

\u5C5E\u6027\u60C5\u5831\u306B\u306F\u3001\u4EE5\u4E0B\u306E\u9805\u76EE\u3092\u5FC5\u305A\u542B\u3081\u3066\u304F\u3060\u3055\u3044\u3002\u4E0D\u8DB3\u3057\u3066\u3044\u308B\u5834\u5408\u306F\u3001\u30E6\u30FC\u30B6\u30FC\u306E\u8981\u671B\u304B\u3089\u63A8\u6E2C\u3057\u305F\u308A\u3001\u4E00\u822C\u7684\u306A\u30D3\u30B8\u30CD\u30B9\u6163\u884C\u306B\u57FA\u3065\u3044\u3066\u88DC\u5B8C\u3057\u3066\u304F\u3060\u3055\u3044\u3002
- title: \u30DA\u30EB\u30BD\u30CA\u306E\u6B63\u5F0F\u306A\u5F79\u8077\u540D\uFF08\u4F8B\uFF1A\u6700\u9AD8\u60C5\u5831\u8CAC\u4EFB\u8005\u3001\u55B6\u696D\u672C\u90E8\u9577\u3001\u4EBA\u4E8B\u90E8\u9577\uFF09
- industry: \u30DA\u30EB\u30BD\u30CA\u304C\u4E3B\u306B\u6D3B\u52D5\u3059\u308B\u696D\u7A2E\uFF08\u4F8B\uFF1A\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u958B\u767A\u3001\u88FD\u9020\u696D\u3001\u5C0F\u58F2\u696D\u3001\u91D1\u878D\u30B5\u30FC\u30D3\u30B9\uFF09
- position: \u30DA\u30EB\u30BD\u30CA\u306E\u793E\u5185\u3067\u306E\u7ACB\u5834\u3084\u5F79\u5272\uFF08\u4F8B\uFF1A\u7D4C\u55B6\u5E79\u90E8\u3001\u90E8\u9580\u8CAC\u4EFB\u8005\u3001\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30EA\u30FC\u30C0\u30FC\u3001\u5C02\u9580\u8077\uFF09

\u53EF\u80FD\u3067\u3042\u308C\u3070\u3001\u4EE5\u4E0B\u306E\u5C5E\u6027\u60C5\u5831\u3082\u5177\u4F53\u7684\u306B\u63D0\u6848\u3057\u3066\u304F\u3060\u3055\u3044\u3002
- name: \u30DA\u30EB\u30BD\u30CA\u306E\u6C0F\u540D\uFF08\u4F8B\uFF1A\u5C71\u7530 \u592A\u90CE\uFF09\u3002\u305F\u3060\u3057\u3001\u5FC5\u9808\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002
- company: \u30DA\u30EB\u30BD\u30CA\u304C\u6240\u5C5E\u3059\u308B\u4F01\u696D\u540D\uFF08\u4F8B\uFF1A\u3007\u3007\u682A\u5F0F\u4F1A\u793E\uFF09\u3002\u3053\u3061\u3089\u3082\u5FC5\u9808\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002
- company_size: \u30DA\u30EB\u30BD\u30CA\u304C\u6240\u5C5E\u3059\u308B\u4F01\u696D\u306E\u60F3\u5B9A\u898F\u6A21\uFF08\u4F8B\uFF1A\u5927\u4F01\u696D\u3001\u4E2D\u5805\u4F01\u696D\u3001\u4E2D\u5C0F\u4F01\u696D\u3001\u30B9\u30BF\u30FC\u30C8\u30A2\u30C3\u30D7\uFF09
- region: \u30DA\u30EB\u30BD\u30CA\u306E\u4E3B\u306A\u6D3B\u52D5\u5730\u57DF\u3084\u4F01\u696D\u306E\u6240\u5728\u5730\uFF08\u4F8B\uFF1A\u95A2\u6771\u3001\u95A2\u897F\u3001\u30A2\u30E1\u30EA\u30AB\u897F\u6D77\u5CB8\uFF09

\u6700\u7D42\u7684\u306A\u51FA\u529B\u306F\u3001\u6307\u5B9A\u3055\u308C\u305FJSON\u30B9\u30AD\u30FC\u30DE\u306B\u5F93\u3063\u305F\u5F62\u5F0F\u3067\u306A\u3051\u308C\u3070\u306A\u308A\u307E\u305B\u3093\u3002\u4ED6\u306E\u30C6\u30AD\u30B9\u30C8\u306F\u4E00\u5207\u542B\u3081\u306A\u3044\u3067\u304F\u3060\u3055\u3044\u3002
`,
  model: openai("gpt-4o-mini")
  // コストと速度を考慮してminiに
  // outputSchema を指定することで、このスキーマに沿ったJSON出力を期待できる (Mastraの機能)
  // generate呼び出し側で指定するため、Agent定義では不要な場合もある。今回は呼び出し側で指定する想定。
});

let supabaseUrl;
let supabaseAnonKey;
const isNode = typeof process !== "undefined" && process.versions != null && process.versions.node != null;
if (isNode) {
  supabaseUrl = process.env.VITE_SUPABASE_URL;
  supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
} else {
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
}
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is not defined. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.");
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const personaAttributeSchema = z.object({
  name: z.string().optional(),
  // 名前はAIが生成することも考慮しoptional
  title: z.string(),
  // 役職
  company: z.string().optional(),
  // 会社名
  industry: z.string(),
  // 業種
  position: z.string(),
  // 職位・役割
  company_size: z.string().optional(),
  // 企業規模
  region: z.string().optional()
  // 地域
  // expertise, background, personality, decision_making_style は一旦固定値 or 簡易生成
});
const personaFactoryInputSchema = z.object({
  context: z.object({
    personas_attributes: z.array(personaAttributeSchema)
    // 属性の配列
  }).optional(),
  personas_attributes: z.array(personaAttributeSchema).optional()
  // 直接渡される場合
});
const personaFactoryOutputSchema = z.object({
  status: z.string(),
  count: z.number(),
  persona_ids: z.array(z.string())
  // 作成されたペルソナのIDリスト
});
async function savePersonaToSupabase(personaData) {
  const { data, error } = await supabase.from("expert_personas").insert([
    {
      name: personaData.name || `${personaData.region || "\u4E0D\u660E\u5730\u57DF"}\u306E${personaData.company_size || "\u4E0D\u660E\u898F\u6A21"}\u306E${personaData.position}`,
      // 名前がなければ簡易生成
      title: personaData.title,
      company: personaData.company,
      industry: personaData.industry,
      position: personaData.position,
      company_size: personaData.company_size,
      region: personaData.region,
      expertise: { skills: ["\u4EA4\u6E09", "\u6226\u7565\u7ACB\u6848"], experience_years: 10 },
      // ダミー
      background: { education: "MBA", work_history: "\u5927\u624BIT\u4F01\u696D\u3067\u306E\u30DE\u30CD\u30FC\u30B8\u30E3\u30FC\u7D4C\u9A13" },
      // ダミー
      personality: { type: "\u5206\u6790\u7684", communication: "\u76F4\u63A5\u7684" },
      // ダミー
      decision_making_style: "\u30C7\u30FC\u30BF\u99C6\u52D5\u578B\u3001\u5408\u8B70\u3092\u91CD\u8996"
      // ダミー
    }
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
  description: "B2B\u30DA\u30EB\u30BD\u30CA\u5C5E\u6027\u304B\u3089\u8A73\u7D30\u60C5\u5831\u3092\u751F\u6210\u3057\u3001Supabase\u306Eexpert_personas\u30C6\u30FC\u30D6\u30EB\u306B\u4FDD\u5B58\u3059\u308B\u30C4\u30FC\u30EB\u3002",
  inputSchema: personaFactoryInputSchema,
  outputSchema: personaFactoryOutputSchema,
  execute: async (input) => {
    console.log("\\n--- personaFactory Tool Execution Start ---");
    console.log("Received validated input:", JSON.stringify(input, null, 2));
    const attributesList = input?.context?.personas_attributes || input?.personas_attributes;
    if (!attributesList || !Array.isArray(attributesList) || attributesList.length === 0) {
      console.error("Invalid input: 'personas_attributes' array not found or is empty.", input);
      throw new Error("Invalid input: 'personas_attributes' array not found or is empty.");
    }
    console.log(`Processing ${attributesList.length} persona attributes...`);
    const createdPersonaIds = [];
    for (const attr of attributesList) {
      try {
        const personaId = await savePersonaToSupabase(attr);
        createdPersonaIds.push(personaId);
      } catch (error) {
        console.error(`Failed to process and save persona with attributes: ${JSON.stringify(attr)}`, error);
        throw error;
      }
    }
    console.log("--- personaFactory Tool Execution End ---\\n");
    return { status: "ok", count: createdPersonaIds.length, persona_ids: createdPersonaIds };
  }
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

new Agent$1({
  name: "orchestratorAgent",
  model: openai("gpt-4o-mini"),
  // こちらもminiに統一。必要に応じてgpt-4oに戻す。
  tools: { personaFactory },
  // personaFactoryツールを登録
  instructions: `
\u3042\u306A\u305F\u306F\u30E6\u30FC\u30B6\u30FC\u306E\u8AB2\u984C\u3084\u8981\u671B\u3092\u5206\u6790\u3057\u3001\u6700\u9069\u306AB2B\u4EEE\u60F3\u5C02\u9580\u5BB6\u30C1\u30FC\u30E0\u3092\u7DE8\u6210\u3057\u3001\u305D\u306E\u5C02\u9580\u5BB6\u30C1\u30FC\u30E0\u306B\u8AB2\u984C\u306B\u3064\u3044\u3066\u8B70\u8AD6\u3055\u305B\u3001\u6700\u7D42\u7684\u306A\u63D0\u6848\u3092\u751F\u6210\u3059\u308B\u30AA\u30FC\u30B1\u30B9\u30C8\u30EC\u30FC\u30BF\u30FC\u3067\u3059\u3002
\u4E00\u9023\u306E\u51E6\u7406\u3092\u30B9\u30C6\u30C3\u30D7\u30D0\u30A4\u30B9\u30C6\u30C3\u30D7\u3067\u5B9F\u884C\u3057\u307E\u3059\u3002

\u30B9\u30C6\u30C3\u30D71: \u30E6\u30FC\u30B6\u30FC\u306E\u5165\u529B\uFF08\u8AB2\u984C\u3001\u76EE\u7684\u3001\u5E0C\u671B\u3059\u308B\u5C02\u9580\u5BB6\u306E\u30BF\u30A4\u30D7\u306A\u3069\uFF09\u3092\u5206\u6790\u3057\u307E\u3059\u3002
\u30B9\u30C6\u30C3\u30D72: \u5206\u6790\u7D50\u679C\u3092\u57FA\u306B\u3001\`estimatorAgent\` \u3092\u547C\u3073\u51FA\u3057\u3066\u3001\u6700\u9069\u306AAI\u30DA\u30EB\u30BD\u30CA\u306E\u6570\u3068\u5404\u30DA\u30EB\u30BD\u30CA\u306E\u5C5E\u6027\uFF08title, industry, position\u306A\u3069\uFF09\u3092\u63A8\u5B9A\u3055\u305B\u307E\u3059\u3002
\u30B9\u30C6\u30C3\u30D73: \`estimatorAgent\` \u306E\u51FA\u529B\u3092\u53D7\u3051\u53D6\u308A\u3001\u305D\u308C\u3092 \`personaFactory\` \u30C4\u30FC\u30EB\u306B\u6E21\u3057\u3066\u3001\u5C02\u9580\u5BB6\u30DA\u30EB\u30BD\u30CA\u3092\u751F\u6210\u30FB\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306B\u4FDD\u5B58\u3055\u305B\u307E\u3059\u3002
\u30B9\u30C6\u30C3\u30D74: (MVP\u3067\u306F\u3053\u3053\u307E\u3067) \u751F\u6210\u3055\u308C\u305F\u30DA\u30EB\u30BD\u30CA\u306E\u60C5\u5831\uFF08ID\u30EA\u30B9\u30C8\u3084\u5C5E\u6027\uFF09\u3092\u6700\u7D42\u7D50\u679C\u3068\u3057\u3066\u307E\u3068\u3081\u307E\u3059\u3002\u5C06\u6765\u7684\u306B\u306F\u3001\u3053\u308C\u3089\u306E\u30DA\u30EB\u30BD\u30CA\u306B\u8AB2\u984C\u306B\u3064\u3044\u3066\u8B70\u8AD6\u3055\u305B\u3001\u305D\u306E\u7D50\u679C\u3092\u307E\u3068\u3081\u307E\u3059\u3002

\u6700\u7D42\u7684\u306A\u51FA\u529B\u306F\u3001\u30D5\u30ED\u30F3\u30C8\u30A8\u30F3\u30C9\u304C\u53D7\u3051\u53D6\u308B\u305F\u3081\u306E \`expertProposalSchema\` \u306B\u5F93\u3063\u305FJSON\u5F62\u5F0F\u3067\u306A\u3051\u308C\u3070\u306A\u308A\u307E\u305B\u3093\u3002
\u73FE\u6642\u70B9\u3067\u306F\u3001\`experts\` \u306B\u306F \`personaFactory\` \u3067\u4F5C\u6210\u3055\u308C\u305F\u30DA\u30EB\u30BD\u30CA\u306E\u57FA\u672C\u60C5\u5831\uFF08ID\u3001\u540D\u524D\u3001\u5C5E\u6027\u306A\u3069\uFF09\u3092\u542B\u3081\u3001\`summary\` \u306B\u306F\u51E6\u7406\u306E\u6982\u8981\u3092\u542B\u3081\u3066\u304F\u3060\u3055\u3044\u3002
\u5404\u30DA\u30EB\u30BD\u30CA\u306E\u56DE\u7B54\u306F\u307E\u3060\u53CE\u96C6\u3057\u306A\u3044\u305F\u3081\u3001\`experts.answer\` \u30D5\u30A3\u30FC\u30EB\u30C9\u306F\u7A7A\u307E\u305F\u306F\u56FA\u5B9A\u5024\u3067\u69CB\u3044\u307E\u305B\u3093\u3002
`
});
async function runOrchestrator(userMessageContent) {
  console.log("[Orchestrator] Starting orchestration with user message:", userMessageContent);
  console.log("[Orchestrator] Calling EstimatorAgent...");
  const estimationResult = await estimatorAgent.generate(
    [{ role: "user", content: userMessageContent }],
    // ユーザーメッセージを渡す
    {
      output: estimatorOutputSchema
      // Zodスキーマを指定して構造化出力を得る
    }
  );
  if (!estimationResult.object || !estimationResult.object.personas_attributes) {
    console.error("[Orchestrator] EstimatorAgent did not return valid persona attributes.", estimationResult);
    throw new Error("EstimatorAgent failed to provide persona attributes.");
  }
  const personaAttributes = estimationResult.object.personas_attributes;
  console.log("[Orchestrator] EstimatorAgent returned attributes:", JSON.stringify(personaAttributes, null, 2));
  console.log("[Orchestrator] Calling personaFactory tool...");
  const factoryResult = await personaFactory.execute({
    context: {
      personas_attributes: personaAttributes
    }
  });
  if (factoryResult.status !== "ok" || !factoryResult.persona_ids) {
    console.error("[Orchestrator] personaFactory tool execution failed or did not return IDs.", factoryResult);
    throw new Error("personaFactory tool failed.");
  }
  console.log("[Orchestrator] personaFactory tool returned persona IDs:", factoryResult.persona_ids);
  const createdPersonas = [];
  if (factoryResult.persona_ids.length > 0) {
    const { data: personasData, error: personasError } = await supabase.from("expert_personas").select("*").in("id", factoryResult.persona_ids);
    if (personasError) {
      console.error("[Orchestrator] Error fetching created personas from Supabase:", personasError);
      throw new Error("Failed to fetch created personas.");
    }
    if (personasData) {
      for (const p of personasData) {
        createdPersonas.push({
          id: p.id,
          name: p.name,
          attributes: {
            // より詳細な属性オブジェクト
            title: p.title,
            industry: p.industry,
            position: p.position,
            company: p.company,
            company_size: p.company_size,
            region: p.region
          },
          profile: `\u5C02\u9580\u5206\u91CE: ${JSON.stringify(p.expertise)}, \u7D4C\u6B74: ${JSON.stringify(p.background)}, \u6027\u683C: ${JSON.stringify(p.personality)}`,
          // プロフィール概要
          answer: "(\u73FE\u6642\u70B9\u3067\u306F\u56DE\u7B54\u672A\u53CE\u96C6)"
          // MVPでは回答はダミー
        });
      }
    }
  }
  const finalOutput = {
    experts: createdPersonas,
    summary: {
      // @ts-ignore
      persona_count: estimationResult.object.estimated_persona_count,
      // @ts-ignore
      main_attributes: `Estimator\u304C\u63D0\u6848\u3057\u305F${estimationResult.object.estimated_persona_count}\u540D\u306E\u5C02\u9580\u5BB6\u304C\u4F5C\u6210\u3055\u308C\u307E\u3057\u305F\u3002`
      // TODO: もっと詳細なサマリーを生成
    }
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
    const result = await runOrchestrator(userMessage.content);
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
