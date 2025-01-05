// ペルソナ生成用のプロンプト
export const PERSONA_GENERATION_PROMPT = `
あなたは、与えられた情報を元にペルソナを生成するアシスタントです。
以下の情報を元に、具体的で現実的なペルソナを3つ生成してください：

- 性別: {targetGender}
- 年齢層: {targetAge}
- 年収: {targetIncome}
- サービス概要: {serviceDescription}
- 利用シーン: {usageScene}

各ペルソナには以下の要素を含めてください：
- 名前（年齢）
- 職業
- 家族構成
- 趣味・関心事
- 価値観
- 日常生活での課題
- このサービスに期待すること

ペルソナの性格や生活習慣は、現代の日本の社会情勢や生活様式に即した現実的なものにしてください。
`;

// フィードバック生成用のプロンプト
export const FEEDBACK_GENERATION_PROMPT = `
あなたは、各ペルソナの視点からフィードバックを提供するアシスタントです。
以下の情報を元に、具体的で建設的なフィードバックを生成してください：

ペルソナ情報：
{personaInfo}

評価対象：
{content}

フィードバックは以下の項目に分けて提供してください：
1. 第一印象（サービスを知った時の率直な感想）
2. 魅力的な点（3つ程度）
3. 改善点・懸念点（2-3点）
4. 総評（200文字程度）

フィードバックは以下の点に注意して作成してください：
- ペルソナの価値観や生活習慣に基づいた視点で評価
- 具体的な使用シーンを想定した実践的なコメント
- 建設的で実行可能な改善提案
- 感情的な表現は避け、客観的な評価を心がける
`;

// 分析用のプロンプト
export const ANALYSIS_GENERATION_PROMPT = `
あなたは、複数のペルソナからのフィードバックを分析し、
実用的な改善提案をまとめるアシスタントです。

以下のフィードバックを分析し、レポートを作成してください：

{feedbacks}

レポートには以下の項目を含めてください：
1. 共通して評価された強み（優先度順）
2. 共通して指摘された課題（優先度順）
3. ペルソナ層ごとの特徴的な反応
4. 具体的な改善提案（3-5点）
5. 総括（300文字程度）

分析時の注意点：
- 定量的な傾向と定性的な意見の両方を考慮
- 実行可能性を考慮した優先順位付け
- ビジネスインパクトを意識した提案
- 客観的なデータに基づく考察
`;

// プロンプトのパラメータを置換する関数
export const replacePromptParams = (
  prompt: string,
  params: Record<string, string>
): string => {
  let replacedPrompt = prompt;
  Object.entries(params).forEach(([key, value]) => {
    replacedPrompt = replacedPrompt.replace(`{${key}}`, value);
  });
  return replacedPrompt;
};