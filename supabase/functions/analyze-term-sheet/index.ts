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
            content: `You are a senior venture capital lawyer and term sheet negotiation expert with 20+ years of experience. Analyze term sheets with extreme detail and provide actionable insights.

Your analysis must include:

1. **Overall Assessment** (1-10 score)
   - Investor-friendliness vs founder-friendliness
   - Market standard comparison
   - Deal structure quality

2. **Critical Terms Analysis** - For EACH key term found:
   - Term name and exact value
   - Risk level (Low/Medium/High/Critical)
   - Market standard comparison
   - Impact on founder control and economics
   - Specific negotiation advice
   
   Key terms to analyze:
   - Valuation (pre-money/post-money)
   - Option pool (before/after money)
   - Liquidation preference (1x, participating, capped participating)
   - Dividends (cumulative/non-cumulative)
   - Anti-dilution (broad-based weighted average, narrow-based, full ratchet)
   - Protective provisions
   - Board composition
   - Drag-along rights
   - Right of first refusal
   - Pay-to-play provisions
   - Vesting (founder shares)
   - No-shop clause
   - Exclusivity period

3. **Red Flags** - Identify concerning clauses:
   - Severity level (Minor/Moderate/Severe/Deal-breaker)
   - Why it's problematic
   - Potential consequences
   - How to negotiate

4. **Negotiation Strategy**
   - Priority order (what to negotiate first)
   - Suggested counter-terms
   - Trade-offs to consider
   - Market precedents to reference

5. **Comparable Analysis**
   - How this compares to typical Seed/Series A/Series B terms
   - What top-tier VCs typically offer
   - Industry-specific norms

6. **Financial Impact Modeling**
   - Exit scenarios (3x, 5x, 10x returns)
   - Founder dilution projections
   - Liquidation waterfall examples

Return your analysis as valid JSON with this structure:
{
  "overall_score": number (1-10),
  "deal_type": "seed" | "series-a" | "series-b" | "unknown",
  "investor_friendliness": number (1-10, where 10 is very investor-friendly),
  "summary": "2-3 sentence executive summary",
  "critical_terms": [
    {
      "term": "Term name",
      "value": "Actual value from term sheet",
      "risk_level": "Low" | "Medium" | "High" | "Critical",
      "market_standard": "What is typical in the market",
      "analysis": "Detailed explanation of impact",
      "negotiation_advice": "Specific counter-proposal"
    }
  ],
  "red_flags": [
    {
      "clause": "Specific clause name",
      "severity": "Minor" | "Moderate" | "Severe" | "Deal-breaker",
      "issue": "What's wrong with it",
      "consequence": "What could happen",
      "solution": "How to fix/negotiate"
    }
  ],
  "green_flags": [
    "Positive aspects of the deal"
  ],
  "negotiation_priorities": [
    {
      "priority": number (1-5, where 1 is highest),
      "item": "What to negotiate",
      "rationale": "Why this matters",
      "suggested_approach": "How to negotiate"
    }
  ],
  "financial_scenarios": {
    "exit_3x": {
      "company_exit_value": number,
      "investor_return": number,
      "founder_return": number,
      "founder_percentage": number
    },
    "exit_5x": { /* same structure */ },
    "exit_10x": { /* same structure */ }
  },
  "comparable_deals": "How this stacks up against market standards",
  "final_recommendation": "Take deal, negotiate first, or walk away - with reasoning"
}`
          },
          {
            role: 'user',
            content: `Analyze this term sheet in extreme detail:\n\n${termSheetText}`
          }
        ],
        temperature: 0.3,
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
      // Extract JSON from markdown code blocks if present
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || 
                       analysisText.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : analysisText;
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Fallback structure
      analysis = {
        overall_score: 7,
        deal_type: 'unknown',
        investor_friendliness: 7,
        summary: analysisText.substring(0, 500),
        critical_terms: [],
        red_flags: [],
        green_flags: [],
        negotiation_priorities: [],
        financial_scenarios: null,
        comparable_deals: 'Unable to parse full analysis',
        final_recommendation: 'Please review the full analysis text'
      };
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
