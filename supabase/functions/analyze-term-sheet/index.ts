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
    const { termSheetText } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Starting comprehensive term sheet analysis...');

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
            content: `You are a senior venture capital lawyer with 20+ years experience analyzing term sheets. Provide detailed, actionable analysis.`
          },
          {
            role: 'user',
            content: `Analyze this term sheet comprehensively:\n\n${termSheetText}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_term_sheet",
            description: "Provide comprehensive term sheet analysis with scoring, risk assessment, and negotiation strategy",
            parameters: {
              type: "object",
              properties: {
                overall_score: {
                  type: "number",
                  description: "Overall quality score from 1-10"
                },
                deal_type: {
                  type: "string",
                  enum: ["seed", "series-a", "series-b", "series-c", "unknown"],
                  description: "Type of funding round"
                },
                investor_friendliness: {
                  type: "number",
                  description: "Score from 1-10, where 10 is very investor-friendly"
                },
                summary: {
                  type: "string",
                  description: "2-3 sentence executive summary"
                },
                critical_terms: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      term: { type: "string" },
                      value: { type: "string" },
                      risk_level: {
                        type: "string",
                        enum: ["Low", "Medium", "High", "Critical"]
                      },
                      market_standard: { type: "string" },
                      analysis: { type: "string" },
                      negotiation_advice: { type: "string" }
                    },
                    required: ["term", "value", "risk_level", "market_standard", "analysis", "negotiation_advice"]
                  }
                },
                red_flags: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      clause: { type: "string" },
                      severity: {
                        type: "string",
                        enum: ["Minor", "Moderate", "Severe", "Deal-breaker"]
                      },
                      issue: { type: "string" },
                      consequence: { type: "string" },
                      solution: { type: "string" }
                    },
                    required: ["clause", "severity", "issue", "consequence", "solution"]
                  }
                },
                green_flags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Positive aspects of the term sheet"
                },
                negotiation_priorities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      priority: { type: "number" },
                      item: { type: "string" },
                      rationale: { type: "string" },
                      suggested_approach: { type: "string" }
                    },
                    required: ["priority", "item", "rationale", "suggested_approach"]
                  }
                },
                financial_scenarios: {
                  type: "object",
                  properties: {
                    exit_3x: {
                      type: "object",
                      properties: {
                        company_exit_value: { type: "number" },
                        investor_return: { type: "number" },
                        founder_return: { type: "number" },
                        founder_percentage: { type: "number" }
                      },
                      required: ["company_exit_value", "investor_return", "founder_return", "founder_percentage"]
                    },
                    exit_5x: {
                      type: "object",
                      properties: {
                        company_exit_value: { type: "number" },
                        investor_return: { type: "number" },
                        founder_return: { type: "number" },
                        founder_percentage: { type: "number" }
                      },
                      required: ["company_exit_value", "investor_return", "founder_return", "founder_percentage"]
                    },
                    exit_10x: {
                      type: "object",
                      properties: {
                        company_exit_value: { type: "number" },
                        investor_return: { type: "number" },
                        founder_return: { type: "number" },
                        founder_percentage: { type: "number" }
                      },
                      required: ["company_exit_value", "investor_return", "founder_return", "founder_percentage"]
                    }
                  },
                  required: ["exit_3x", "exit_5x", "exit_10x"]
                },
                comparable_deals: {
                  type: "string",
                  description: "How this compares to market standards"
                },
                final_recommendation: {
                  type: "string",
                  description: "Clear recommendation with reasoning"
                }
              },
              required: ["overall_score", "deal_type", "investor_friendliness", "summary", "critical_terms", "red_flags", "green_flags", "negotiation_priorities", "financial_scenarios", "comparable_deals", "final_recommendation"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "analyze_term_sheet" } }
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
    
    console.log('Analysis completed successfully');

    let analysis;
    // Extract tool call result for structured output
    if (data.choices[0].message.tool_calls && data.choices[0].message.tool_calls[0]) {
      const toolCall = data.choices[0].message.tool_calls[0];
      analysis = JSON.parse(toolCall.function.arguments);
      console.log('Structured analysis extracted from tool call');
    } else {
      // Fallback to parsing content
      const analysisText = data.choices[0].message.content;
      try {
        const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || 
                         analysisText.match(/```\n([\s\S]*?)\n```/);
        const jsonText = jsonMatch ? jsonMatch[1] : analysisText;
        analysis = JSON.parse(jsonText);
        console.log('Analysis parsed from text content');
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw response:', analysisText.substring(0, 500));
        // Fallback structure
        analysis = {
          overall_score: 5,
          deal_type: 'unknown',
          investor_friendliness: 5,
          summary: 'Unable to parse complete analysis. The AI returned an unexpected format. Please try again or contact support if the issue persists.',
          critical_terms: [],
          red_flags: [{
            clause: 'Analysis Error',
            severity: 'Moderate',
            issue: 'The AI was unable to provide a structured analysis',
            consequence: 'You may not have complete visibility into all terms',
            solution: 'Try resubmitting the term sheet or breaking it into smaller sections'
          }],
          green_flags: [],
          negotiation_priorities: [],
          financial_scenarios: {
            exit_3x: { company_exit_value: 0, investor_return: 0, founder_return: 0, founder_percentage: 0 },
            exit_5x: { company_exit_value: 0, investor_return: 0, founder_return: 0, founder_percentage: 0 },
            exit_10x: { company_exit_value: 0, investor_return: 0, founder_return: 0, founder_percentage: 0 }
          },
          comparable_deals: 'Unable to compare due to parsing error',
          final_recommendation: 'Please try analyzing the term sheet again or contact support'
        };
      }
    }

    return new Response(
      JSON.stringify({ analysis }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-term-sheet:', error);
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
