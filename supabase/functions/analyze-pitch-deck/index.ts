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
    const { deckContent, stage } = await req.json();
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
            content: `You are a senior venture capital partner analyzing pitch decks using the Arconic Capital investment framework.

FUNDRAISING STAGE: ${stage || 'Not specified'}

ANALYSIS FRAMEWORK:

1. INVESTMENT CRITERIA (Weighted):
   - Team (20%): Relevant experience, domain expertise, technical capability, track record, founder-market fit
   - Traction (25%): Revenue & growth, engagement, validation evidence, progress vs company age
   - Market (20%): TAM/SAM/SOM size, growth rate, timing/macro drivers
   - Product (15%): Differentiation, technical feasibility, defensibility/moat, customer pain intensity
   - Business Model (10%): Revenue model clarity, unit economics, scalability, distribution strategy
   - Competition (7%): Competitive landscape, differentiation vs competitors
   - Financials (3%): Burn rate, capital efficiency, realistic projections, use of funds

2. STAGE-SPECIFIC EXPECTATIONS:

${stage === 'Pre-Seed' ? `PRE-SEED ESSENTIALS:
- Title page with clear one-line description
- Problem: Customer pain point from their perspective, urgent and relatable
- Solution: What the company will do, how it solves the problem
- Market: Target customer, TAM/SAM/SOM with bottom-up calculations
- Traction: Most impressive metric OR product development + qualitative feedback if pre-revenue
- Business Model: How money will be made, GTM strategy
- Team: Education and experience, why suited to problem (move earlier if exceptional credentials)
- Ask: Amount raising, use of funds, milestones to be achieved

TRACTION EXPECTATIONS: Qualitative feedback, early pilots, waitlist, customer meetings, trials` : ''}

${stage === 'Seed' ? `SEED ESSENTIALS:
- Title page: Clear one-line description (anyone should understand what company does)
- Problem: Customer pain point, urgent and relatable
- Solution: What company does, value proposition (anyone should be able to explain it)
- Market: Target customer, TAM/SAM/SOM with bottom-up calculations
- Traction (1-3 slides): Quantitative metrics with clear charts, explicitly describe growth in plain English
  * Examples: customer meetings, trials, waitlist, sign-ups, downloads, engagement metrics
  * If strong traction, move most impressive metric to slide 2
- Business Model (1-2 slides): How money is made, revenue streams, forecast unit economics, GTM
- Team: Education and experience, why suited to problem (move earlier if exceptional)
- Ask: Amount raising, use of funds, milestones

OPTIONAL: Why Now, Unique Value Proposition

TRACTION EXPECTATIONS: Paying customers, MRR growth, engagement metrics, conversion rates` : ''}

${stage === 'Series A' ? `SERIES A ESSENTIALS:
- Title page: Clear one-line description
- Problem: Customer pain from their perspective
- Solution: What company does, value proposition
- Market: TAM/SAM/SOM with bottom-up calculations
- Traction (1-3 slides): Strong quantitative metrics (MRR, ARR, CAC:LTV, DAU, MAU, churn, retention, conversion, gross margin)
  * Move most impressive metric to slide 2 if compelling
  * Charts must be understandable at first glance
- Business Model (1-2 slides): Revenue streams, unit economics, GTM
- Competition: Direct and indirect competitors, competitive advantage
- Team: Why suited to problem (move earlier if exceptional)
- Financials: Revenue, expenses, burn, runway (forecasts must be realistic and defensible)
- Ask: Amount raising, use of funds, milestones

OPTIONAL: Why Now, Unique Value Proposition, Vision (5-10 year outlook), Appendixes

TRACTION EXPECTATIONS: Proven revenue model, strong unit economics, repeatable GTM motion, $XXK+ MRR/ARR` : ''}

3. DESIGN PRINCIPLES:
- 10-20 slides total
- <50 words per slide
- One idea per slide
- Slide titles should be key takeaways (not generic like "The Problem")
- Plain English, understandable at a glance
- Narrative arc: context → problem → insight → solution → proof → ask

4. FIRST IMPRESSION (Critical):
Investors decide in the first 3 minutes if it's a pass or deeper look. Analyze slides 1-3 for immediate impact.

5. PROVIDE:
- Classify each slide by type (Problem, Solution, Market, Traction, Team, etc.)
- Flag missing essential slides for the stage
- Identify red flags and critical weaknesses
- Generate 3-5 investor questions based on gaps
- Suggest slide reordering if strong content is buried
- Text-based design checks (word count, structure, typos)

6. CRITICAL ACCURACY REQUIREMENTS:
- ONLY flag something as "missing" or "lacking" if it is genuinely absent from the deck
- Before stating that timelines, metrics, or details are missing, VERIFY they are not present
- If a slide shows "2024", "2025", "Q1", "Q2", or similar, those ARE specific timelines
- If numbers, percentages, or growth rates are shown, those ARE metrics
- Ground ALL weaknesses in what is actually missing, not what could be better
- Be specific about what is present vs what is truly absent

Be direct, honest, and actionable. Founders need brutal truth, not encouragement. But ensure all criticism is factually accurate based on the deck content.`
          },
          {
            role: 'user',
            content: `Analyze this ${stage || 'startup'} pitch deck in detail:\n\n${deckContent}`
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
                  pitch_deck_quality: {
                    type: 'string',
                    enum: ['Ready', 'Close', 'Not Yet'],
                    description: 'Pitch deck readiness verdict'
                  },
                  investment_grade: {
                    type: 'string',
                    enum: ['Strong Investment Candidate', 'Promising Opportunity', 'Early Stage Potential', 'Not Investment Ready'],
                    description: 'Investment potential based on Arconic criteria'
                  },
                  investment_grade_reasoning: {
                    type: 'string',
                    description: 'Detailed explanation of investment grade assessment, covering team-market fit, traction, product strength, and key factors'
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
                        slide_number: { type: 'number', description: 'Slide number (e.g., 1, 2, 3)' },
                        slide_type: { type: 'string', description: 'Classified slide type (e.g., "Title", "Problem", "Solution", "Market", "Traction", "Team", "Business Model", "Competition", "Financials", "Ask", "Unidentified")' },
                        slide_title: { type: 'string', description: 'The main title or heading of the slide' },
                        score: { type: 'number', description: 'Slide quality from 1-10' },
                        feedback: { type: 'string', description: 'Detailed feedback' },
                        suggestions: { type: 'array', items: { type: 'string' }, description: 'Specific improvements' },
                        is_essential: { type: 'boolean', description: 'Is this slide essential for the stage?' },
                        stage_appropriate: { type: 'boolean', description: 'Is content appropriate for the stage?' },
                        word_count: { type: 'number', description: 'Approximate word count on this slide' }
                      },
                      required: ['slide_number', 'slide_type', 'score', 'feedback']
                    },
                    description: 'Slide by slide analysis with classification'
                  },
                  missing_slides: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Essential slides missing for this stage (e.g., "Competition (required for Series A)")'
                  },
                  investor_questions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '3-5 questions investors will likely ask based on gaps and weaknesses in the deck'
                  },
                  slide_ordering_suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        slide_number: { type: 'number', description: 'Current slide position' },
                        suggested_position: { type: 'number', description: 'Recommended position' },
                        slide_type: { type: 'string', description: 'Type of slide (e.g., Team, Traction)' },
                        reasoning: { type: 'string', description: 'Why this slide should be moved' }
                      },
                      required: ['slide_number', 'suggested_position', 'slide_type', 'reasoning']
                    },
                    description: 'Suggestions to reorder slides for better impact (only if applicable)'
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
                required: ['overall_score', 'investor_readiness', 'pitch_deck_quality', 'investment_grade', 'investment_grade_reasoning', 'first_impression', 'executive_summary', 'strengths', 'weaknesses', 'slide_feedback', 'missing_slides', 'investor_questions', 'category_scores', 'recommendations', 'next_steps'],
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
