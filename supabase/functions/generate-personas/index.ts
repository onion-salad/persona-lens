import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    以下の内容に対してフィードバックを提供するのに適した5人のペルソナを生成してください：

    対象内容：${content}

    各ペルソナについて、以下の形式で生成してください：
    - 年齢
    - 性別
    - 職業
    - 趣味
    - 性格
    - この内容に関連する経験や視点

    できるだけ多様な属性と背景を持つペルソナを生成し、
    特に対象内容に関連する経験や知見を持つ人物像を設定してください。
    各ペルソナは3-4行程度の簡潔な文章で表現してください。
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const personas = text
      .split('\n')
      .filter(line => line.trim() !== '')
      .join('\n')
      .split(/\d+\.\s+/)
      .filter(persona => persona.trim() !== '')
      .map(persona => persona.trim());

    console.log('Generated personas:', personas);

    return new Response(
      JSON.stringify({ personas }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error generating personas:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});