import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const generatePromptWithImages = (content: string, imageUrls: string[], personas: string[]) => `
あなたは、各ペルソナの視点からファーストビューのフィードバックを提供するアシスタントです。
以下の情報を元に、具体的で建設的なフィードバックを生成してください：

ペルソナ情報：
${personas.join('\n\n')}

評価対象のコンテンツ：
${content}

画像URL：
${imageUrls.join('\n')}

フィードバックは以下の項目に分けて提供してください：
1. 第一印象（ファーストビューを見た時の率直な感想）
2. 魅力的な点（デザイン、レイアウト、視覚的な要素について3つ程度）
3. 改善点・懸念点（2-3点）
4. 総評（200文字程度）

フィードバックは以下の点に注意して作成してください：
- ペルソナの価値観や生活習慣に基づいた視点で評価
- ビジュアル面での具体的な評価
- 建設的で実行可能な改善提案
- 感情的な表現は避け、客観的な評価を心がける
`;

const generatePromptWithoutImages = (content: string, personas: string[]) => `
あなたは、各ペルソナの視点からサービスのフィードバックを提供するアシスタントです。
以下の情報を元に、具体的で建設的なフィードバックを生成してください：

ペルソナ情報：
${personas.join('\n\n')}

評価対象のサービス説明：
${content}

フィードバックは以下の項目に分けて提供してください：
1. 第一印象（サービスを知った時の率直な感想）
2. 魅力的な点（サービスの価値提案、差別化要因について3つ程度）
3. 改善点・懸念点（2-3点）
4. 総評（200文字程度）

フィードバックは以下の点に注意して作成してください：
- ペルソナの価値観や生活習慣に基づいた視点で評価
- サービスの本質的な価値に関する評価
- 建設的で実行可能な改善提案
- 感情的な表現は避け、客観的な評価を心がける
`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content, imageUrls, personas } = await req.json()

    // 画像の有無に応じてプロンプトを選択
    const prompt = imageUrls && imageUrls.length > 0
      ? generatePromptWithImages(content, imageUrls, personas)
      : generatePromptWithoutImages(content, personas);

    console.log('Generated prompt:', prompt);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that provides feedback from different persona perspectives."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (response.ok) {
      // フィードバックの構造を整形
      const feedbacks = personas.map((persona, index) => ({
        persona,
        feedback: {
          firstImpression: "First impression section from GPT response",
          appealPoints: ["Appeal point 1", "Appeal point 2", "Appeal point 3"],
          improvements: ["Improvement 1", "Improvement 2"],
          summary: "Summary section from GPT response"
        },
        selectedImageUrl: imageUrls && imageUrls.length > 0 ? imageUrls[0] : null
      }));

      return new Response(JSON.stringify({ feedbacks }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error(data.error.message);
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});