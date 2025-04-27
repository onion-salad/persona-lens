import { GoogleGenerativeAI } from "@google/generative-ai";

// APIキーを環境変数から取得
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Gemini APIクライアントの初期化
const genAI = new GoogleGenerativeAI(API_KEY);

// モデル設定
const modelName = "gemini-1.5-pro";
const model = genAI.getGenerativeModel({ model: modelName });

// ペルソナ生成用のプロンプトテンプレート
const generatePersonaPrompt = (data: any) => {
  return `
あなたは優れたペルソナ作成の専門家です。以下の情報に基づいて、リアルで詳細なペルソナを作成してください。

## プロジェクト情報
- プロジェクト名: ${data.projectName}
- 製品/サービス: ${data.productDescription}

## ターゲット情報
- 年齢層: ${data.targetAudience.ageRange[0]}歳〜${data.targetAudience.ageRange[1]}歳
- 性別: ${data.targetAudience.genders.join(', ') || '指定なし'}
- 職業: ${data.targetAudience.occupations.join(', ') || '指定なし'}
- 地域: ${data.targetAudience.locations.join(', ') || '指定なし'}
- 収入レベル: ${data.targetAudience.incomeLevel}

## 特性情報
- 性格特性: ${data.personalityTraits.join(', ') || '指定なし'}
- 興味・関心: ${data.interests.join(', ') || '指定なし'}
- 課題・悩み: ${data.painPoints.join(', ') || '指定なし'}
- 目標: ${data.goals.join(', ') || '指定なし'}
- 技術リテラシー: ${data.technicalLevel}/5

## 追加情報
${data.additionalContext || '特になし'}

## 出力形式
${data.outputFormat === 'concise' ? '簡潔な要点のみ' : 
  data.outputFormat === 'detailed' ? '詳細なストーリー付き' : 
  '構造化されたセクション分け'}

## 詳細度
${data.detailLevel}/5（1: 最小限、5: 非常に詳細）

## 出力内容
以下の情報を含むペルソナを${data.personaCount}人分作成してください：
1. 基本情報（名前、年齢、性別、職業、居住地、家族構成）
2. 経歴（学歴、職歴、重要なライフイベント）
3. 性格特性（価値観、行動パターン、意思決定スタイル）
4. 日常生活（典型的な1日、趣味、習慣）
5. 技術利用（デバイス、アプリ、オンライン行動）
6. 消費行動（購買意思決定プロセス、ブランド選好）
7. 目標と課題（短期・長期目標、直面している課題）
8. 製品/サービスとの関係（ニーズ、期待、懸念）

各ペルソナは一貫性があり、リアルで具体的な人物像を描いてください。ステレオタイプを避け、複雑で多面的な人物像を作成してください。

出力はJSON形式で、以下の構造にしてください：
\`\`\`json
{
  "personas": [
    {
      "id": "1",
      "name": "名前",
      "age": 年齢,
      "gender": "性別",
      "occupation": "職業",
      "location": "居住地",
      "family": "家族構成",
      "background": "経歴",
      "personality": "性格特性",
      "dailyLife": "日常生活",
      "techUsage": "技術利用",
      "consumptionBehavior": "消費行動",
      "goalsAndChallenges": "目標と課題",
      "relationToProduct": "製品/サービスとの関係"
    },
    // 他のペルソナ...
  ]
}
\`\`\`
`;
};

// フィードバック生成用のプロンプトテンプレート
const generateFeedbackPrompt = (data: any, personas: any[]) => {
  const selectedPersonas = personas.filter(p => data.targetPersonas.includes(p.id));
  
  return `
あなたは優れたユーザーフィードバック生成の専門家です。以下の情報に基づいて、リアルで詳細なフィードバックを作成してください。

## プロジェクト情報
- プロジェクト名: ${data.projectName}
- 製品/サービス: ${data.productDescription}
${data.productUrl ? `- 製品URL: ${data.productUrl}` : ''}
${data.productImages.length > 0 ? `- 製品画像: ${data.productImages.join(', ')}` : ''}

## 評価基準
- 評価ポイント: ${data.evaluationPoints.join(', ') || '指定なし'}
- 評価カテゴリ: ${
  Object.entries(data.evaluationCriteria)
    .filter(([_, value]) => value)
    .map(([key, _]) => {
      const categoryMap: Record<string, string> = {
        usability: '使いやすさ',
        design: 'デザイン',
        functionality: '機能性',
        pricing: '価格設定',
        marketFit: '市場適合性',
        uniqueness: '独自性'
      }
      return categoryMap[key]
    })
    .join(', ')
}

## 追加情報
${data.additionalContext || '特になし'}

## フィードバックタイプ
${
  data.feedbackType === 'comprehensive' ? '総合評価' : 
  data.feedbackType === 'specific' ? '特定機能評価' : 
  '比較評価'
}

## 詳細度
${data.feedbackDepth}/5（1: 最小限、5: 非常に詳細）

## ペルソナ情報
${selectedPersonas.map(p => `
### ペルソナ${p.id}: ${p.name}
- 年齢: ${p.age}歳
- 性別: ${p.gender}
- 職業: ${p.occupation}
- 居住地: ${p.location}
- 家族構成: ${p.family}
- 性格特性: ${p.personality}
- 技術利用: ${p.techUsage}
- 消費行動: ${p.consumptionBehavior}
- 目標と課題: ${p.goalsAndChallenges}
`).join('\n')}

## 出力内容
上記のペルソナになりきって、製品/サービスに対する詳細なフィードバックを提供してください。
各ペルソナの視点から、以下の情報を含むフィードバックを作成してください：

1. 全体的な印象
2. 良いと感じた点
3. 改善が必要と感じた点
4. 具体的な提案
5. 使用シナリオでの体験
6. 評価スコア（10点満点）

出力はJSON形式で、以下の構造にしてください：
\`\`\`json
{
  "feedback": [
    {
      "personaId": "ペルソナID",
      "personaName": "ペルソナ名",
      "overallImpression": "全体的な印象",
      "positivePoints": ["良い点1", "良い点2", ...],
      "negativePoints": ["改善点1", "改善点2", ...],
      "suggestions": ["提案1", "提案2", ...],
      "userExperience": "使用シナリオでの体験",
      "score": 評価スコア
    },
    // 他のペルソナからのフィードバック...
  ],
  "summary": {
    "averageScore": 平均スコア,
    "keyPositives": ["主な良い点1", "主な良い点2", ...],
    "keyNegatives": ["主な改善点1", "主な改善点2", ...],
    "keySuggestions": ["主な提案1", "主な提案2", ...]
  }
}
\`\`\`
`;
};

// ペルソナ生成関数
export const generatePersonas = async (formData: any) => {
  try {
    if (!API_KEY) {
      throw new Error("Gemini API key is not set");
    }

    const prompt = generatePersonaPrompt(formData);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSONを抽出
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                      text.match(/```\n([\s\S]*?)\n```/) ||
                      text.match(/{[\s\S]*}/);
                      
    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        return { error: "Failed to parse response", rawText: text };
      }
    } else {
      return { error: "No JSON found in response", rawText: text };
    }
  } catch (error) {
    console.error("Error generating personas:", error);
    return { error: "Failed to generate personas", details: error };
  }
};

// フィードバック生成関数
export const generateFeedback = async (formData: any, personas: any[]) => {
  try {
    if (!API_KEY) {
      throw new Error("Gemini API key is not set");
    }

    const prompt = generateFeedbackPrompt(formData, personas);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSONを抽出
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                      text.match(/```\n([\s\S]*?)\n```/) ||
                      text.match(/{[\s\S]*}/);
                      
    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        return { error: "Failed to parse response", rawText: text };
      }
    } else {
      return { error: "No JSON found in response", rawText: text };
    }
  } catch (error) {
    console.error("Error generating feedback:", error);
    return { error: "Failed to generate feedback", details: error };
  }
}; 