import { z } from "zod";

// 専門家一人分のスキーマ
const expertSchema = z.object({
  name: z.string().describe("専門家の名前"),
  attributes: z.string().describe("専門家の属性 (業種/役職/規模など)"),
  profile: z.string().describe("専門家のプロフィール概要"),
});

// 最終的な応答全体のスキーマ
export const expertProposalSchema = z.object({
  experts: z
    .array(expertSchema)
    .describe("提案された仮想専門家のリスト"),
  summary: z
    .object({
      persona_count: z.number().describe("提案されたペルソナの数"),
      main_attributes: z
        .string()
        .describe("主な属性の概要"),
      // 必要であれば他のサマリー情報も追加可能
    })
    .describe("提案のサマリー"),
});

// スキーマからTypeScriptの型を生成 (任意だが便利)
export type ExpertProposal = z.infer<typeof expertProposalSchema>; 