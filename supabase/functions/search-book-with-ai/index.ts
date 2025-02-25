
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
    const { isbn } = await req.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a book information specialist. When given an ISBN, provide detailed information about the book in a JSON format. Focus on Scandinavian books.
            Return ONLY a JSON object with these fields:
            - title (string)
            - author (string)
            - description (string, brief description of the book)
            - language (string, e.g. 'no', 'sv', 'da', 'en')
            If you're not confident about the information, return null for that field.`
          },
          {
            role: 'user',
            content: `Find information about the book with ISBN: ${isbn}. Return ONLY the JSON object, no other text.`
          }
        ],
      }),
    });

    const data = await response.json();
    let bookData = null;

    try {
      // Parse the generated text as JSON
      bookData = JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }

    return new Response(JSON.stringify({ bookData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in search-book-with-ai function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
