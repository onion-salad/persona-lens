import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const PERSONA_GENERATION_PROMPT = `
あなたは、与えられた情報を元にペルソナを生成するアシスタントです。
以下の情報を元に、具体的で現実的なペルソナを3つ生成してください：

- 性別: {targetGender}
- 年齢層: {targetAge}
- 年収: {targetIncome}
- サービス概要: {serviceDescription}
- 利用シーン: {usageScene}

各ペルソナには以下の要素を含めてください：
- 名前（年齢）
- 職業
- 家族構成
- 趣味・関心事
- 価値観
- 日常生活での課題
- このサービスに期待すること

ペルソナの性格や生活習慣は、現代の日本の社会情勢や生活様式に即した現実的なものにしてください。
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
    const { targetGender, targetAge, targetIncome, serviceDescription, usageScene } = await req.json()

    // プロンプトのパラメータを置換
    const prompt = PERSONA_GENERATION_PROMPT
      .replace('{targetGender}', targetGender)
      .replace('{targetAge}', targetAge)
      .replace('{targetIncome}', targetIncome)
      .replace('{serviceDescription}', serviceDescription)
      .replace('{usageScene}', usageScene);

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
            content: "You are a helpful assistant that generates personas based on the given information."
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
      const personas = [data.choices[0].message.content];
      return new Response(JSON.stringify({ personas }), {
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