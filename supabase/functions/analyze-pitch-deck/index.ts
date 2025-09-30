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
    const { deckContent } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing pitch deck...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert pitch deck consultant. Analyze pitch decks and provide detailed feedback on:
            - Story and narrative flow
            - Problem and solution clarity
            - Market opportunity presentation
            - Business model clarity
            - Traction and metrics
            - Team presentation
            - Financial projections
            - Visual design and clarity
            - Overall investment appeal
            
            Provide analysis in JSON format with:
            - overall_score (1-10)
            - strengths (array of positive points)
            - weaknesses (array of areas to improve)
            - slide_feedback (array of {slide, score, feedback})
            - recommendations (array of specific improvements)
            - investor_readiness (1-10)`
          },
          {
            role: 'user',
            content: `Analyze this pitch deck:\n\n${deckContent}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    console.log('Analysis completed successfully');

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      analysis = {
        overall_score: 7,
        strengths: [],
        weaknesses: [],
        slide_feedback: [],
        recommendations: [],
        investor_readiness: 7,
        summary: analysisText
      };
    }

    return new Response(
      JSON.stringify({ analysis }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-pitch-deck:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
