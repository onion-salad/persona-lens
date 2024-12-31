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
    const { imageUrls, personas } = await req.json()
    console.log('Received request:', { imageUrls, personas })

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '')
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const feedbackPromises = personas.map(async (persona: string) => {
      const prompt = `
あなたは以下のペルソナになりきって、提示された複数のファーストビューの中から最適なものを選び、フィードバックを提供してください。

ペルソナ情報：
${persona}

評価対象の画像：
${imageUrls.map((url: string, index: number) => `画像${index + 1}: ${url}`).join('\n')}

以下の点を考慮してフィードバックを提供してください：
1. ファーストビューとしての第一印象
2. ターゲット層（あなた）にとっての訴求力
3. 改善点や提案

以下のJSONフォーマットで回答してください：
{
  "selectedImageIndex": 選択した画像の番号（1から始まる整数）,
  "selectedImageUrl": "選択した画像のURL",
  "feedback": "フィードバックの内容（300-400文字程度）"
}
`

      console.log('Sending prompt for persona:', prompt)

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      console.log('Received response:', text)
      
      try {
        const jsonResponse = JSON.parse(text)
        return {
          persona,
          ...jsonResponse
        }
      } catch (error) {
        console.error('Error parsing JSON response:', error)
        return {
          persona,
          selectedImageUrl: imageUrls[0],
          feedback: "フィードバックの解析に失敗しました。"
        }
      }
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