
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cleanJsonString = (str: string) => {
  // Remove markdown code blocks
  str = str.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  // Remove any leading/trailing whitespace
  str = str.trim();
  return str;
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
            
            Return ONLY the JSON object without any markdown formatting or code blocks. If you're not confident about any field, use null for that field's value.`
          },
          {
            role: 'user',
            content: `Find detailed information about the book with ISBN: ${isbn}. This is a Scandinavian book. Return ONLY the JSON object without any markdown or code blocks.`
          }
        ],
        temperature: 0.5
      }),
    });

    const data = await response.json();
    console.log('Raw OpenAI response:', data.choices[0]?.message?.content);
    
    let bookData = null;
    try {
      const content = data.choices[0]?.message?.content || '';
      const cleanContent = cleanJsonString(content);
      console.log('Cleaned content:', cleanContent);
      
      // Try to extract JSON if it's still wrapped in any text
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : cleanContent;
      
      bookData = JSON.parse(jsonString);
      console.log('Parsed book data:', bookData);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Clean content that failed to parse:', cleanContent);
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
