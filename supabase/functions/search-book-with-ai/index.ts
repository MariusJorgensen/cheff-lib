
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
            content: `You are a specialized book information system with extensive knowledge of Scandinavian literature and academic publications. Your task is to provide detailed information about books based on their ISBN numbers.

When given an ISBN:
1. Search your knowledge for any information about this book
2. Focus especially on Norwegian, Swedish, Danish, and other Nordic publications
3. Even if you only have partial information, include what you know
4. Format your response as a clean JSON object

Response format:
{
  "title": "complete book title",
  "author": "full author name",
  "description": "brief but informative description of the book's content",
  "language": "primary language code (no/sv/da/en)"
}

Important:
- Return ONLY the JSON object, no markdown, no code blocks
- If you're not completely certain about information, still provide your best assessment
- Never return null values unless you have absolutely no information
- Include any academic or professional context you know about the book`
          },
          {
            role: 'user',
            content: `Find information about the book with ISBN: ${isbn}. This appears to be a Scandinavian publication, possibly Norwegian. Please provide as much detail as you can find.`
          }
        ],
        temperature: 0.3
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

      // Validate that we have at least some non-null values
      if (!bookData.title && !bookData.author && !bookData.description) {
        console.log('All main fields are null or empty, requesting a retry with more context...');
        
        // Make a second attempt with more specific context
        const retryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: 'You are a specialized Nordic literature database. Focus on finding any information about this book, even partial details. The ISBN indicates this is likely a Norwegian academic or professional publication.'
              },
              {
                role: 'user',
                content: `Need information about ISBN: ${isbn}. This is a Norwegian ISBN (starts with 978-82). Please provide any details you can find about this publication.`
              }
            ],
            temperature: 0.3
          }),
        });

        const retryData = await retryResponse.json();
        const retryContent = cleanJsonString(retryData.choices[0]?.message?.content || '');
        console.log('Retry response:', retryContent);
        
        if (retryContent) {
          const retryJson = JSON.parse(retryContent.match(/\{[\s\S]*\}/)?.[0] || retryContent);
          if (retryJson.title || retryJson.author || retryJson.description) {
            bookData = retryJson;
          }
        }
      }
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
