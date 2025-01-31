import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generatePromptWithImages = (content: string, persona: string, imageUrls: string[]) => `
あなたは、与えられたペルソナの視点から、サービスのファーストビュー画像に対するフィードバックを提供するアシスタントです。
以下の情報を元に、具体的で建設的なフィードバックを生成してください：

ペルソナ情報：
${persona}

評価対象のサービス概要：
${content}

提供された画像URL：
${imageUrls.join('\n')}

フィードバックは以下の項目に分けて提供してください：
1. 第一印象（画像を見た時の率直な感想）
2. 魅力的な点（3つ程度）
- 視覚的な要素に注目
- ターゲットユーザーへの訴求ポイント
- デザインの効果
3. 改善点・懸念点（2-3点）
- より効果的な視覚表現の提案
- ターゲットユーザーの視点での改善案
4. 総評（200文字程度）

フィードバックは以下の点に注意して作成してください：
- ペルソナの価値観や生活習慣に基づいた視点で評価
- 具体的な使用シーンを想定した実践的なコメント
- 建設的で実行可能な改善提案
- 感情的な表現は避け、客観的な評価を心がける
`;

const generatePromptWithoutImages = (content: string, persona: string) => `
あなたは、与えられたペルソナの視点から、サービスの説明に対するフィードバックを提供するアシスタントです。
以下の情報を元に、具体的で建設的なフィードバックを生成してください：

ペルソナ情報：
${persona}

評価対象のサービス概要：
${content}

フィードバックは以下の項目に分けて提供してください：
1. 第一印象（サービスを知った時の率直な感想）
2. 魅力的な点（3つ程度）
- サービスの価値提案
- ターゲットユーザーへの訴求ポイント
- 差別化要因
3. 改善点・懸念点（2-3点）
- より効果的な価値提案の方法
- ターゲットユーザーの視点での改善案
4. 総評（200文字程度）

フィードバックは以下の点に注意して作成してください：
- ペルソナの価値観や生活習慣に基づいた視点で評価
- 具体的な使用シーンを想定した実践的なコメント
- 建設的で実行可能な改善提案
- 感情的な表現は避け、客観的な評価を心がける
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content, imageUrls, personas } = await req.json();

    console.log('Received request:', { content, imageUrls, personas });

    const feedbacks = await Promise.all(personas.map(async (persona: string) => {
      const prompt = imageUrls && imageUrls.length > 0
        ? generatePromptWithImages(content, persona, imageUrls)
        : generatePromptWithoutImages(content, persona);

      console.log('Generated prompt:', prompt);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'あなたは、ユーザーの視点に立ってサービスを評価し、具体的で建設的なフィードバックを提供する専門家です。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const feedbackContent = data.choices[0].message.content;

      try {
        // フィードバックの内容をパースして構造化
        const lines = feedbackContent.split('\n');
        let section = '';
        let firstImpression = '';
        let appealPoints: string[] = [];
        let improvements: string[] = [];
        let summary = '';

        for (const line of lines) {
          if (line.includes('第一印象')) {
            section = 'firstImpression';
            continue;
          } else if (line.includes('魅力的な点')) {
            section = 'appealPoints';
            continue;
          } else if (line.includes('改善点')) {
            section = 'improvements';
            continue;
          } else if (line.includes('総評')) {
            section = 'summary';
            continue;
          }

          if (line.trim()) {
            switch (section) {
              case 'firstImpression':
                firstImpression = line.replace(/^[・-]?\s*/, '');
                break;
              case 'appealPoints':
                if (line.match(/^[・-]/)) {
                  appealPoints.push(line.replace(/^[・-]\s*/, ''));
                }
                break;
              case 'improvements':
                if (line.match(/^[・-]/)) {
                  improvements.push(line.replace(/^[・-]\s*/, ''));
                }
                break;
              case 'summary':
                summary = line.replace(/^[・-]?\s*/, '');
                break;
            }
          }
        }

        return {
          persona,
          feedback: {
            firstImpression,
            appealPoints,
            improvements,
            summary
          },
          selectedImageUrl: imageUrls && imageUrls.length > 0 ? imageUrls[0] : null
        };
      } catch (error) {
        console.error('Error parsing feedback:', error);
        return {
          persona,
          feedback: {
            firstImpression: 'JSONの解析に失敗しました',
            appealPoints: [],
            improvements: [],
            summary: 'レスポンスの形式が不正です'
          },
          selectedImageUrl: null
        };
      }
    }));

    console.log('Generated feedbacks:', feedbacks);

    return new Response(
      JSON.stringify({ feedbacks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});