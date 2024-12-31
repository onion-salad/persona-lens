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
    const { content, personas } = await req.json()
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '')
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const feedbackPromises = personas.map(async (persona: string) => {
      const prompt = `
      あなたは以下のペルソナとして、提示された内容にフィードバックを提供してください：

      ペルソナ設定：
      ${persona}

      フィードバックする内容：
      ${content}

      このペルソナの視点から、以下の点を考慮してフィードバックを提供してください：
      - ペルソナの経験や背景に基づいた具体的な意見
      - 改善点や提案
      - 良い点や評価できる点
      - 実践的なアドバイス

      フィードバックは300-400文字程度で、具体的かつ建設的な内容にしてください。
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    })

    const feedbacks = await Promise.all(feedbackPromises)
    console.log('Generated feedbacks:', feedbacks)

    return new Response(
      JSON.stringify({ feedbacks }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    console.error('Error generating feedback:', error)
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