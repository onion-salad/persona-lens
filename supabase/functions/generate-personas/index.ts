import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    以下の形式で10人分のペルソナを生成してください：
    - 年齢
    - 性別
    - 職業
    - 趣味
    - 性格
    - 課題や悩み
    
    できるだけ多様な属性と背景を持つペルソナを生成してください。
    各ペルソナは3-4行程度の簡潔な文章で表現してください。
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // テキストを行で分割し、空行を除去して各ペルソナを抽出
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