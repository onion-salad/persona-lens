import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { PERSONA_GENERATION_PROMPT } from "../../../src/constants/prompts.ts"

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
    const prompt = PERSONA_GENERATION_PROMPT.replace('{targetGender}', targetGender)
      .replace('{targetAge}', targetAge)
      .replace('{targetIncome}', targetIncome)
      .replace('{serviceDescription}', serviceDescription)
      .replace('{usageScene}', usageScene);

    const response = await fetch("https://api.openai.com/v1/engines/davinci-codex/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer YOUR_OPENAI_API_KEY`,
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 150,
        n: 3,
        stop: null,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return new Response(JSON.stringify({ personas: data.choices.map(choice => choice.text.trim()) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error(data.error.message);
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
