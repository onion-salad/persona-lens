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
        temperature: 0.9,
        response_mime_type: "application/json"
      }
    })

    const feedbackPromises = personas.map(async (persona: string) => {
      const prompt = `
あなたは以下のペルソナになりきって、提示された複数のファーストビューの中から最適なものを選び、フィードバックを提供してください。

ペルソナ情報：
${persona}

評価対象の画像：
${imageUrls.map((url: string, index: number) => `画像${index + 1}: ${url}`).join('\n')}

以下のJSONスキーマに従って回答してください：

{
  "selectedImageIndex": number, // 画像の番号（1から始まる整数）
  "selectedImageUrl": string,   // 選択した画像のURL
  "feedback": string           // フィードバックの内容（300-400文字程度）
}

注意：
- 必ずJSONスキーマに従った形式で回答してください
- selectedImageIndexは数値で指定してください（クォートで囲まないでください）
- selectedImageUrlとfeedbackは文字列でクォートで囲んでください
- JSON以外の追加のテキストは含めないでください
`

      console.log('Sending prompt for persona:', prompt)

      try {
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        console.log('Raw response for persona:', text)
        
        try {
          // テキストからJSONを抽出
          const jsonResponse = JSON.parse(text);
          
          // 必要なフィールドの存在確認
          if (!jsonResponse.selectedImageIndex || !jsonResponse.selectedImageUrl || !jsonResponse.feedback) {
            console.error('Missing required fields in JSON response');
            return {
              persona,
              selectedImageUrl: imageUrls[0],
              feedback: "フィードバックの生成に失敗しました。"
            }
          }

          return {
            persona,
            ...jsonResponse
          }
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          return {
            persona,
            selectedImageUrl: imageUrls[0],
            feedback: "JSONの解析に失敗しました。"
          }
        }
      } catch (aiError) {
        console.error('Error generating AI response:', aiError);
        return {
          persona,
          selectedImageUrl: imageUrls[0],
          feedback: "AIからのレスポンス生成に失敗しました。"
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