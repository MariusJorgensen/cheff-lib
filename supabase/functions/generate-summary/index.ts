
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookId } = await req.json();
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all comments for the book
    const { data: comments, error: commentsError } = await supabase
      .from('book_comments')
      .select('comment')
      .eq('book_id', bookId);

    if (commentsError) throw commentsError;

    // If no comments, return early
    if (!comments || comments.length === 0) {
      return new Response(
        JSON.stringify({ summary: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Combine all comments
    const commentsText = comments.map(c => c.comment).join('\n');

    // Generate summary using OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes book comments in a concise and engaging way. Keep summaries under 100 characters.'
          },
          {
            role: 'user',
            content: `Summarize these book comments in a brief, catchy tagline:\n${commentsText}`
          }
        ],
      }),
    });

    const openAIData = await openAIResponse.json();
    const summary = openAIData.choices[0].message.content;

    // Update the book's AI summary
    const { error: updateError } = await supabase
      .from('books')
      .update({ ai_summary: summary })
      .eq('id', bookId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-summary function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
