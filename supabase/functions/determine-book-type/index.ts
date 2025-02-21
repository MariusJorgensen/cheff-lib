
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, author } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that determines whether a book is fiction or non-fiction. Only respond with either "fiction" or "non-fiction".'
          },
          {
            role: 'user',
            content: `Please determine if this book is fiction or non-fiction based on the following information:
              Title: ${title}
              Author: ${author}
              Description: ${description}
              
              Respond with ONLY the word "fiction" or "non-fiction".`
          }
        ],
      }),
    });

    const data = await response.json();
    const bookType = data.choices[0].message.content.toLowerCase().includes('fiction') ? 'fiction' : 'non-fiction';

    return new Response(
      JSON.stringify({ bookType }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, bookType: 'non-fiction' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
