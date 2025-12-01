import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  deckScoringRubric,
  questionGenRubric,
  feedbackRubric,
  startupPreseedRubric,
  startupSeedRubric,
  startupSeriesARubric
} from "./rubrics.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get rubrics based on stage
function getRubrics(stage: string) {
  const startupRubric = stage === 'Pre-Seed' ? startupPreseedRubric
    : stage === 'Seed' ? startupSeedRubric
    : startupSeriesARubric;

  return { deckScoringRubric, startupRubric, questionGenRubric, feedbackRubric };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, stage } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error('No images provided');
    }

    console.log(`Analyzing ${images.length} slides from ${stage} pitch deck...`);
    console.log(`Using model: claude-sonnet-4-5-20250929`);
    console.log(`Image sizes:`, images.map(img => img.length));

    // Get rubrics
    const { deckScoringRubric, startupRubric, questionGenRubric, feedbackRubric } = getRubrics(stage);
    console.log('Rubrics loaded successfully');

    // Build content array with images first, then analysis prompt (Anthropic format)
    const content = [
      ...images.map((imageData: string) => ({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: imageData
        }
      })),
      {
        type: "text",
        text: `You are a senior venture capital partner analyzing a ${stage} pitch deck.

DECK SCORING:
${deckScoringRubric}

STARTUP SCORING:
${startupRubric}

INVESTOR QUESTIONS:
${questionGenRubric}

WRITTEN FEEDBACK:
${feedbackRubric}

Analyze this ${stage || 'startup'} pitch deck comprehensively. You have been provided with images of all slides. Evaluate both the visual presentation (charts, design, layout) and the content (text, messaging, data).`
      }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 16000,
        messages: [
          {
            role: 'user',
            content: content
          }
        ],
        tools: [
          {
            name: 'analyze_pitch_deck',
            description: 'Provide comprehensive pitch deck analysis',
            input_schema: {
              type: 'object',
              properties: {
                deck_score_overall: {
                  type: 'number',
                  description: 'Overall deck score 0-10, weighted average: content_clarity×0.35 + structure×0.28 + storytelling×0.20 + design×0.10 + spelling×0.05 + length×0.02'
                },
                deck_categories: {
                  type: 'object',
                  properties: {
                    content_clarity: {
                      type: 'object',
                      properties: {
                        score: { type: 'number', description: 'Score 0-10' },
                        reasoning: { type: 'string', description: 'How clearly is information communicated?' }
                      },
                      required: ['score', 'reasoning']
                    },
                    structure_completeness: {
                      type: 'object',
                      properties: {
                        score: { type: 'number', description: 'Score 0-10' },
                        reasoning: { type: 'string', description: 'Are essential slides present? Is ordering logical?' }
                      },
                      required: ['score', 'reasoning']
                    },
                    storytelling: {
                      type: 'object',
                      properties: {
                        score: { type: 'number', description: 'Score 0-10' },
                        reasoning: { type: 'string', description: 'Does deck tell compelling, coherent story?' }
                      },
                      required: ['score', 'reasoning']
                    },
                    design_visual_clarity: {
                      type: 'object',
                      properties: {
                        score: { type: 'number', description: 'Score 0-10' },
                        reasoning: { type: 'string', description: 'Is deck professional, legible, visually clear?' }
                      },
                      required: ['score', 'reasoning']
                    },
                    spelling_grammar: {
                      type: 'object',
                      properties: {
                        score: { type: 'number', description: 'Score 0-10' },
                        reasoning: { type: 'string', description: 'Is language professional and error-free?' }
                      },
                      required: ['score', 'reasoning']
                    },
                    deck_length: {
                      type: 'object',
                      properties: {
                        score: { type: 'number', description: 'Score 0-10' },
                        slide_count: { type: 'number', description: 'Actual number of slides' },
                        reasoning: { type: 'string', description: 'Is slide count appropriate? (10-20 ideal)' }
                      },
                      required: ['score', 'slide_count', 'reasoning']
                    }
                  },
                  required: ['content_clarity', 'structure_completeness', 'storytelling', 'design_visual_clarity', 'spelling_grammar', 'deck_length']
                },
                startup_score_overall: {
                  type: 'number',
                  description: 'Overall startup score 0-10, weighted sum of all criteria scores per rubric'
                },
                startup_categories: {
                  type: 'object',
                  properties: {
                    team: {
                      type: 'object',
                      properties: {
                        score: { type: 'number', description: 'Score 0-10, calculated from weighted criteria' },
                        reasoning: { type: 'string', description: 'Overall team assessment' }
                      },
                      required: ['score', 'reasoning']
                    },
                    market_insight: {
                      type: 'object',
                      properties: {
                        score: { type: 'number', description: 'Score 0-10, calculated from weighted criteria' },
                        reasoning: { type: 'string', description: 'Overall market & insight assessment' }
                      },
                      required: ['score', 'reasoning']
                    },
                    product_tech: {
                      type: 'object',
                      properties: {
                        score: { type: 'number', description: 'Score 0-10, calculated from weighted criteria' },
                        reasoning: { type: 'string', description: 'Overall product & tech assessment' }
                      },
                      required: ['score', 'reasoning']
                    },
                    traction_gtm: {
                      type: 'object',
                      properties: {
                        score: { type: 'number', description: 'Score 0-10, calculated from weighted criteria' },
                        reasoning: { type: 'string', description: 'Overall traction & GTM assessment' }
                      },
                      required: ['score', 'reasoning']
                    },
                    business_fundability: {
                      type: 'object',
                      properties: {
                        score: { type: 'number', description: 'Score 0-10, calculated from weighted criteria' },
                        reasoning: { type: 'string', description: 'Overall business & fundability assessment' }
                      },
                      required: ['score', 'reasoning']
                    }
                  },
                  required: ['team', 'market_insight', 'product_tech', 'traction_gtm', 'business_fundability']
                },
                first_impression: {
                  type: 'object',
                  properties: {
                    verdict: {
                      type: 'string',
                      enum: ['CONTINUE', 'PASS'],
                      description: 'Would investor continue reading after slides 1-3?'
                    },
                    score: {
                      type: 'number',
                      description: 'First impression score 1-10'
                    },
                    reasoning: {
                      type: 'string',
                      description: 'Why investor would continue or pass based on opening slides'
                    }
                  },
                  required: ['verdict', 'score', 'reasoning']
                },
                deck_feedback: {
                  type: 'object',
                  properties: {
                    executive_summary: {
                      type: 'string',
                      description: 'Maximum 3 sentences summary of deck quality (presentation, structure, communication)'
                    },
                    priority_actions: {
                      type: 'array',
                      items: { type: 'string' },
                      description: '2-3 specific, actionable changes to improve deck presentation, ordered by impact. Maximum 2 sentences each.'
                    }
                  },
                  required: ['executive_summary', 'priority_actions']
                },
                startup_feedback: {
                  type: 'object',
                  properties: {
                    executive_summary: {
                      type: 'string',
                      description: 'Maximum 3 sentences summary of overall startup quality and investment readiness'
                    },
                    priority_actions: {
                      type: 'array',
                      items: { type: 'string' },
                      description: '2-3 specific, actionable steps to improve business and investment readiness, ordered by impact. Maximum 2 sentences each.'
                    }
                  },
                  required: ['executive_summary', 'priority_actions']
                },
                missing_slides: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Essential slides missing for this stage (e.g., "Competition (required for Series A)")'
                },
                investor_questions: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Exactly 5 questions investors will likely ask based on gaps, weaknesses, and unassessable criteria',
                  minItems: 5,
                  maxItems: 5
                }
              },
              required: ['deck_score_overall', 'deck_categories', 'startup_score_overall', 'startup_categories', 'first_impression', 'deck_feedback', 'startup_feedback', 'investor_questions', 'missing_slides']
            }
          }
        ],
        tool_choice: { type: 'tool', name: 'analyze_pitch_deck' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        model: 'claude-sonnet-4-5-20250929'
      });

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return detailed error to help debug
      return new Response(
        JSON.stringify({
          error: `Anthropic API error (${response.status})`,
          details: errorText,
          model: 'claude-sonnet-4-5-20250929'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Received response from Anthropic');
    console.log('Response structure:', {
      hasContent: !!data.content,
      contentLength: data.content?.length,
      hasToolUse: !!data.content?.find((block: any) => block.type === 'tool_use')
    });

    // Parse Anthropic response
    const toolUse = data.content?.find((block: any) => block.type === 'tool_use');

    if (!toolUse || toolUse.name !== 'analyze_pitch_deck') {
      console.error('Unexpected response structure:', JSON.stringify(data, null, 2));
      return new Response(
        JSON.stringify({
          error: 'No analysis generated',
          responseStructure: data
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysis = toolUse.input;
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
