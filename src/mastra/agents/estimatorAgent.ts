import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from '@mastra/libsql';
import { LibSQLVector } from '@mastra/libsql';
import { personaAttributeSchema } from "../tools/personaFactory";

// EstimatorAgentの出力スキーマを更新
export const estimatorOutputSchema = z.object({
  estimated_persona_count: z.number().int().min(1).max(7).describe("推定された最適なAIペルソナの総数"),
  personas_attributes: z.array(personaAttributeSchema).describe("各ペルソナの具体的な属性情報リスト"),
});

export const estimatorAgent = new Agent({
  name: "estimatorAgent",
  instructions: `あなたは高度なペルソナ設計AIです。ユーザーから与えられた課題、目的、または質問内容を深く理解し、その解決や議論に最も貢献できる多様なAIペルソナの構成を提案してください。

提案には以下の要素を必ず含めてください。
- "estimated_persona_count": 最適なAIペルソナの総数（1名から最大7名までを推奨）。
- "personas_attributes": 各AIペルソナの具体的な属性情報リスト。このリストの各要素は以下の属性を持つオブジェクトです。

【各ペルソナ属性オブジェクトの仕様】
必ず "persona_type" を含めてください。これはペルソナの基本的な分類を示します。
- 'business_professional': ビジネス関連の専門家。企業、役職、業種などの情報が重要。
- 'general_consumer': 一般的な消費者や生活者。年齢層、性別、興味、ライフスタイルなどが重要。
- 'specific_role': 特定の役割を持つ人物（例：医者、教師、科学者など）。その役割に特有の経験や知識が重要。
- 'custom': 上記に当てはまらない、または複合的なペルソナ。具体的な属性で特徴を明確にしてください。

ユーザーの要望に応じて、以下の属性を適切に含めてください。全ての属性が常に必要とは限りません。ペルソナタイプや目的に合わせて、最も意味のある属性を選択・提案してください。

[共通で検討する属性]
- name: (任意) ペルソナの名前。
- description_by_ai: (任意) AIによって生成されるペルソナの簡単な説明文。
- region: (任意) 活動地域や居住地域。

[persona_type が 'general_consumer' または 'specific_role'(内容による) の場合に特に重要な属性]
- age_group: 年齢層 ('child', 'teenager', '20s', ..., '70s_and_above')
- gender: 性別 ('male', 'female', 'non_binary', ...)
- occupation_category: 職業分類（例：会社員、学生、主婦・主夫）
- interests: 興味関心事のリスト（例：["旅行", "料理"]）
- lifestyle: ライフスタイル（例：アウトドア派、健康志向）
- family_structure: 家族構成（例：独身、夫婦と子供2人）
- location_type: 居住地のタイプ ('urban', 'suburban', 'rural')
- values_and_priorities: 価値観や優先事項のリスト（例：["価格重視", "品質重視"]）
- technology_literacy: テクノロジーリテラシー ('high', 'medium', 'low')

[persona_type が 'business_professional' または 'specific_role'(内容による) の場合に特に重要な属性]
- title: 役職名（例：マーケティングディレクター）
- industry: 業種（例：ソフトウェア、小売）
- position: 社内での立場や役割（例：部門責任者、専門職）
- company: (任意) 会社名
- company_size: (任意) 企業規模（例：スタートアップ、大企業）
- expertise: (任意) 専門分野やスキルセット (JSON形式での詳細も可)
- background: (任意) 学歴や職歴 (JSON形式での詳細も可)
- personality: (任意) 性格やコミュニケーションスタイル (JSON形式での詳細も可)
- decision_making_style: (任意) 意思決定の傾向

[persona_type が 'custom' または特定の詳細情報が必要な場合]
- custom_attributes: (任意) 上記以外の特記事項をキーと値のペアで (JSON形式)

【出力の厳守事項】
- 最終的な出力は、必ず指定されたJSONスキーマ（estimated_persona_count, personas_attributes を持つオブジェクト）に従ってください。
- personas_attributes 配列の各要素は、上記の属性仕様に従うオブジェクトでなければなりません。
- 不要な属性は含めず、必要な属性だけを選んでください。
- 指示にない余計なテキスト（例：「はい、わかりました。」、説明文など）は一切含めないでください。JSONオブジェクトのみを出力してください。
`,
  model: openai("gpt-4o-mini"),
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
  // outputSchema を指定することで、このスキーマに沿ったJSON出力を期待できる (Mastraの機能)
  // generate呼び出し側で指定するため、Agent定義では不要な場合もある。今回は呼び出し側で指定する想定。
}); 