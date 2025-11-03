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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Analyzing pitch deck...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert pitch deck consultant and venture capital advisor. Analyze pitch decks comprehensively and provide actionable feedback.`
          },
          {
            role: 'user',
            content: `Analyze this pitch deck in detail:\n\n${deckContent}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_pitch_deck',
              description: 'Provide comprehensive pitch deck analysis',
              parameters: {
                type: 'object',
                properties: {
                  overall_score: {
                    type: 'number',
                    description: 'Overall deck quality score from 1-10'
                  },
                  investor_readiness: {
                    type: 'number',
                    description: 'How ready this deck is for investors from 1-10'
                  },
                  executive_summary: {
                    type: 'string',
                    description: '2-3 sentence summary of the deck quality and key takeaways'
                  },
                  strengths: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', description: 'Short title of the strength' },
                        description: { type: 'string', description: 'Detailed explanation' }
                      },
                      required: ['title', 'description']
                    },
                    description: 'What the deck does well'
                  },
                  weaknesses: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', description: 'Short title of the weakness' },
                        description: { type: 'string', description: 'Detailed explanation' },
                        severity: { type: 'string', enum: ['critical', 'high', 'medium'], description: 'How severe this issue is' }
                      },
                      required: ['title', 'description', 'severity']
                    },
                    description: 'Areas that need improvement'
                  },
                  slide_feedback: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        slide: { type: 'string', description: 'Slide name/number' },
                        score: { type: 'number', description: 'Slide quality from 1-10' },
                        feedback: { type: 'string', description: 'Detailed feedback' },
                        suggestions: { type: 'array', items: { type: 'string' }, description: 'Specific improvements' }
                      },
                      required: ['slide', 'score', 'feedback']
                    },
                    description: 'Slide by slide analysis'
                  },
                  category_scores: {
                    type: 'object',
                    properties: {
                      problem_solution: { type: 'number', description: 'Problem and solution clarity (1-10)' },
                      market_opportunity: { type: 'number', description: 'Market size and opportunity (1-10)' },
                      business_model: { type: 'number', description: 'Business model clarity (1-10)' },
                      traction: { type: 'number', description: 'Traction and metrics (1-10)' },
                      team: { type: 'number', description: 'Team presentation (1-10)' },
                      financials: { type: 'number', description: 'Financial projections (1-10)' },
                      storytelling: { type: 'number', description: 'Narrative flow and storytelling (1-10)' },
                      design: { type: 'number', description: 'Visual design and clarity (1-10)' }
                    },
                    required: ['problem_solution', 'market_opportunity', 'business_model', 'traction', 'team', 'financials', 'storytelling', 'design']
                  },
                  recommendations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Priority level' },
                        action: { type: 'string', description: 'Specific action to take' },
                        impact: { type: 'string', description: 'Expected impact of this change' }
                      },
                      required: ['priority', 'action', 'impact']
                    },
                    description: 'Prioritized action items'
                  },
                  next_steps: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Immediate next steps to improve the deck (3-5 items)'
                  }
                },
                required: ['overall_score', 'investor_readiness', 'executive_summary', 'strengths', 'weaknesses', 'slide_feedback', 'category_scores', 'recommendations', 'next_steps'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_pitch_deck' } }
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
    const toolCall = data.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No analysis generated');
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log('Analysis completed successfully');

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
