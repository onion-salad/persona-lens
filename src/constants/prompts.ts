
export const PERSONA_GENERATION_PROMPT = `
あなたはマーケティングの専門家として、製品やサービスのターゲットペルソナを作成するアシスタントです。
以下の情報を元に、具体的で現実的なペルソナを10つ生成してください。

【入力情報】
- 性別: {targetGender}
- 年齢層: {targetAge}
- 年収: {targetIncome}
- サービス概要: {serviceDescription}
- 利用シーン: {usageScene}

各ペルソナは以下の形式で出力してください：
ペルソナ: 名前（年齢）、職業。家族構成、趣味・関心事。価値観と日常生活での課題。このサービスに期待すること。

要件：
1. 現代の日本の社会情勢や生活様式に即した現実的な設定にすること
2. 各ペルソナは1段落で簡潔にまとめること
3. ターゲット層の特徴を踏まえた具体的な人物像を描くこと
4. サービスの利用動機が明確になるような背景設定にすること
`;

export const SERVICE_FEEDBACK_PROMPT = `
あなたは各ペルソナの視点から、提案されたサービスについて分析し、
具体的なフィードバックを提供するアシスタントです。

【ペルソナ情報】
{personaInfo}

【評価対象】
サービス概要: {serviceDescription}
追加詳細: {additionalDetails}

以下の項目について分析してください：

1. 第一印象（このサービスを知った時の率直な感想）
2. 想定される利用シーン（具体的な場面を3つ）
3. 魅力的な点（3点）
4. 改善点・懸念点（2-3点）
5. 利用意向（5段階評価と理由）
6. このペルソナならではの活用アイデア（1-2点）

各項目について、ペルソナの属性や価値観に基づいた具体的な分析を提供してください。
`;

// プロンプトのパラメータを置換する関数
export const replacePromptParams = (prompt: string, params: Record<string, string>): string => {
  let replacedPrompt = prompt;
  Object.entries(params).forEach(([key, value]) => {
    replacedPrompt = replacedPrompt.replace(`{${key}}`, value);
  });
  return replacedPrompt;
};
