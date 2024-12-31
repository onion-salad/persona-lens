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
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    })

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

以下の形式で回答してください。必ず各項目を含めてください：

1. 選択した画像の番号（1から始まる整数）
2. 選択した画像のURL
3. フィードバックの内容（300-400文字程度）

回答は必ずJSON形式で、以下のキーを使用してください：
{
  "selectedImageIndex": 選択した画像の番号,
  "selectedImageUrl": "選択した画像のURL",
  "feedback": "フィードバックの内容"
}
`

      console.log('Sending prompt for persona:', prompt)

      try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        console.log('Raw response for persona:', text)
        
        try {
          // JSONの開始位置と終了位置を見つける
          const jsonStart = text.indexOf('{')
          const jsonEnd = text.lastIndexOf('}') + 1
          const jsonText = text.slice(jsonStart, jsonEnd)
          
          console.log('Extracted JSON text:', jsonText)
          
          const jsonResponse = JSON.parse(jsonText)
          console.log('Parsed JSON response:', jsonResponse)
          
          // 必要なフィールドの存在確認
          if (!jsonResponse.selectedImageIndex || !jsonResponse.selectedImageUrl || !jsonResponse.feedback) {
            console.error('Missing required fields in JSON response:', jsonResponse)
            return {
              persona,
              selectedImageUrl: imageUrls[0],
              feedback: "フィードバックの生成に失敗しました。必要なフィールドが不足しています。"
            }
          }

          return {
            persona,
            ...jsonResponse
          }
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError, 'Raw text:', text)
          return {
            persona,
            selectedImageUrl: imageUrls[0],
            feedback: "JSONの解析に失敗しました。レスポンスの形式が不正です。"
          }
        }
      } catch (aiError) {
        console.error('Error generating AI response:', aiError)
        return {
          persona,
          selectedImageUrl: imageUrls[0],
          feedback: "AIからのレスポンス生成に失敗しました。再試行してください。"
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