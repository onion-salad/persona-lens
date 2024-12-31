import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { targetGender, targetAge, targetIncome, serviceDescription, usageScene } = await req.json()
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '')
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    let prompt = `
    以下の条件に基づいて、サービスのターゲットとなる10人の具体的なペルソナを生成してください。

    サービス情報：
    - サービス概要：${serviceDescription}
    - 利用シーン：${usageScene}

    ターゲット条件：
    - 性別：${targetGender === 'all' ? '指定なし' : targetGender === 'male' ? '男性' : '女性'}
    - 年代：${targetAge === 'all' ? '指定なし' : targetAge}
    - 年収：${targetIncome === 'all' ? '指定なし' : targetIncome === 'low' ? '〜400万円' : targetIncome === 'middle' ? '400-800万円' : '800万円〜'}

    各ペルソナについて、以下の要素を含めて具体的に描写してください：
    - 年齢
    - 性別
    - 職業
    - 年収
    - 家族構成
    - 趣味・関心
    - 日常生活での課題
    - このサービスに対する期待や不安

    ペルソナは現実的で具体的な人物像とし、多様な視点を持つように設定してください。
    各ペルソナは3-4行の文章で表現し、箇条書きは避けてください。

    出力形式：
    1. [ペルソナの説明]
    2. [ペルソナの説明]
    ...
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const personas = text
      .split(/\d+\.\s+/)
      .filter(persona => persona.trim() !== '')
      .map(persona => persona.trim())

    console.log('Generated personas:', personas)

    return new Response(
      JSON.stringify({ personas }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    console.error('Error generating personas:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})