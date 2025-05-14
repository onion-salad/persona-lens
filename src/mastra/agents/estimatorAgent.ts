import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from '@mastra/libsql';
import { LibSQLVector } from '@mastra/libsql';

// EstimatorAgentの出力スキーマ (personaFactoryの入力と整合性を取る)
const estimatedPersonaAttributeSchema = z.object({
  name: z.string().optional().describe("ペルソナの名前（例：鈴木 一郎）。指定がなければ後段で自動生成。"),
  title: z.string().describe("ペルソナの正式な役職名（例：最高技術責任者、マーケティング部長）"),
  company: z.string().optional().describe("ペルソナが所属する企業名（例：株式会社サンプル）"),
  industry: z.string().describe("ペルソナが主に活動する業種（例：ITサービス、製造業、金融）"),
  position: z.string().describe("ペルソナの社内での立場や役割（例：経営層、部長クラス、現場リーダー）"),
  company_size: z.string().optional().describe("ペルソナが所属する企業の規模（例：大企業、中小企業、スタートアップ）"),
  region: z.string().optional().describe("ペルソナの活動地域や企業の所在地（例：東京、大阪、シリコンバレー）"),
});

export const estimatorOutputSchema = z.object({
  estimated_persona_count: z.number().int().min(1).max(7).describe("推定された最適なAIペルソナの総数"),
  personas_attributes: z.array(estimatedPersonaAttributeSchema).describe("各ペルソナの具体的な属性リスト"),
});

export const estimatorAgent = new Agent({
  name: "estimatorAgent",
  instructions: `
あなたはB2Bビジネスにおける仮想専門家会議の設計アシスタントAIです。
ユーザーから会議で議論したい課題や目的、希望する専門家のタイプなどの要望を受け取ります。
その要望を詳細に分析し、統計的にもっとも効果的な議論が期待できるAI専門家ペルソナの構成を提案してください。

提案には以下の要素を含めます。
- 最適なAIペルソナの総数（1名から最大7名まで）
- 各AIペルソナの具体的な属性情報リスト

属性情報には、以下の項目を必ず含めてください。不足している場合は、ユーザーの要望から推測したり、一般的なビジネス慣行に基づいて補完してください。
- title: ペルソナの正式な役職名（例：最高情報責任者、営業本部長、人事部長）
- industry: ペルソナが主に活動する業種（例：ソフトウェア開発、製造業、小売業、金融サービス）
- position: ペルソナの社内での立場や役割（例：経営幹部、部門責任者、プロジェクトリーダー、専門職）

可能であれば、以下の属性情報も具体的に提案してください。
- name: ペルソナの氏名（例：山田 太郎）。ただし、必須ではありません。
- company: ペルソナが所属する企業名（例：〇〇株式会社）。こちらも必須ではありません。
- company_size: ペルソナが所属する企業の想定規模（例：大企業、中堅企業、中小企業、スタートアップ）
- region: ペルソナの主な活動地域や企業の所在地（例：関東、関西、アメリカ西海岸）

最終的な出力は、指定されたJSONスキーマに従った形式でなければなりません。他のテキストは一切含めないでください。
`,
  model: openai("gpt-4o-mini"), // コストと速度を考慮してminiに
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../../../mastra-memory.db'
    }),
    vector: new LibSQLVector({
      connectionUrl: 'file:../../../mastra-memory.db'
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
  // outputSchema を指定することで、このスキーマに沿ったJSON出力を期待できる (Mastraの機能)
  // generate呼び出し側で指定するため、Agent定義では不要な場合もある。今回は呼び出し側で指定する想定。
}); 