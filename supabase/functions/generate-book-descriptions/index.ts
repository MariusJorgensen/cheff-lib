
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, author, description } = await req.json();

    const bookPrompt = `Write a concise (2-3 sentences) description of the book "${title}" by ${author}. If relevant, mention its significance or impact. Base it on this information: ${description}`;
    const authorPrompt = `Write a concise (2-3 sentences) professional biography of ${author}. Focus on their expertise, background, and notable works including "${title}".`;

    const [bookResponse, authorResponse] = await Promise.all([
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a professional book critic and biographer.' },
            { role: 'user', content: bookPrompt }
          ],
        }),
      }),
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a professional book critic and biographer.' },
            { role: 'user', content: authorPrompt }
          ],
        }),
      })
    ]);

    const [bookData, authorData] = await Promise.all([
      bookResponse.json(),
      authorResponse.json()
    ]);

    return new Response(JSON.stringify({
      bookDescription: bookData.choices[0].message.content.trim(),
      authorDescription: authorData.choices[0].message.content.trim()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating descriptions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
