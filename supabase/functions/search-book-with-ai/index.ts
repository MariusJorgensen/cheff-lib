
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
    console.log('Searching for ISBN:', isbn);

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
            
            The response MUST be a valid JSON object with these fields:
            {
              "title": "string",
              "author": "string",
              "description": "string (brief description of the book)",
              "language": "string (e.g. 'no', 'sv', 'da', 'en')"
            }
            
            If you're not confident about any field, use null for that field's value. Make sure the response is VALID JSON.`
          },
          {
            role: 'user',
            content: `Find detailed information about the book with ISBN: ${isbn}. This is a Scandinavian book. Return ONLY a valid JSON object, no other text or explanations.`
          }
        ],
        temperature: 0.5 // Lower temperature for more consistent JSON output
      }),
    });

    const data = await response.json();
    console.log('OpenAI response:', data.choices[0]?.message?.content);
    
    let bookData = null;
    try {
      const content = data.choices[0]?.message?.content || '';
      // Try to extract JSON if it's wrapped in any text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      bookData = JSON.parse(jsonString);
      
      console.log('Parsed book data:', bookData);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw content:', data.choices[0]?.message?.content);
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
