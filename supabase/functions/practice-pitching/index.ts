import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Feedback guidelines by scenario
const getFeedbackGuidelines = (scenarioId: string): string => {
  const guidelines = {
    networking: `1) What landed (max 2 bullets) — tie each to a concrete anchor (noun/number/owner/time). Format: Anchor → why it works.
2) Gaps to tighten (max 2 bullets) — each with a specific fix or next test. Format: Gap → concrete tweak or next test.
3) Decision signal (one line, qualitative — choose one):
   • Needs more work — one-liner unclear (who/what/outcome) and/or proof missing/undated.
   • Well prepared — clear one-liner; specific target customer; proof with metric + owner + recent window; crisp "why now."
   • Follow-up ready — all of the above plus compelling proof and timely "why now"; delivery crisp and conversational.`,

    'first-coffee': `1) What landed (max 2 bullets) — tie each to a concrete anchor (noun/number/owner/time). Format: Anchor → why it works.
2) Gaps to tighten (max 2 bullets) — each with a specific fix or next test. Format: Gap → concrete tweak or next test.
3) Decision signal (one line, qualitative):
   • Needs more work — narrative unclear and/or traction metric missing/undated.
   • Well prepared — clear plain-English narrative; credible founder–market fit; one concrete traction metric with a recent window; market slice plausible.
   • Follow-up ready — all of the above plus compelling early proof and crisp market framing; delivery natural and confident.`,

    'demo-day': `1) What landed (max 2 bullets) — tie each to a concrete anchor (noun/number/owner/time). Format: Anchor → why it works.
2) Gaps to tighten (max 2 bullets) — each with a specific fix or next test. Format: Gap → concrete tweak or next test.
3) Decision signal (one line, qualitative):
   • Needs more work — narrative unclear (who/what/outcome) and/or traction/market/team coverage thin; time use off.
   • Well prepared — clear plain-English narrative; credible market framing; founder–market fit evident; one concrete traction metric with a recent window; good time discipline.
   • Follow-up ready — all of the above plus compelling proof and crisp "why now"; confident Q&A.`,

    'deep-dive': `1) What landed (max 2 bullets) — tie each to a concrete anchor (noun/number/owner/time). Format: Anchor → why it works.
2) Gaps to tighten (max 2 bullets) — each with a specific fix or next test. Format: Gap → concrete tweak or next test.
3) Decision signal (one line, qualitative):
   • Needs more work — evidence thin or fragmented; buyer/budget or unit-economics unclear; repeatability unproven.
   • Well prepared — coherent evidence; buyer/budget anchors; early repeatability; key risks named with mitigations.
   • Partner-track — decision-grade evidence, crisp "why now," repeatable motion with owner, unit-econ sanity; risks bounded.`
  };

  return guidelines[scenarioId as keyof typeof guidelines] || guidelines.networking;
};

// Handle feedback analysis
async function handleFeedbackAnalysis({ transcript, scenarioId, duration }: {
  transcript: Array<{ role: string; content: string; timestamp: number }>;
  scenarioId: string;
  duration: number;
}) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  // Format transcript for analysis
  const conversationText = transcript
    .map(msg => `${msg.role === 'user' ? 'Founder' : 'VC'}: ${msg.content}`)
    .join('\n\n');

  // Log transcript for debugging
  console.log(`[Feedback Analysis] Scenario: ${scenarioId}, Duration: ${duration}s, Transcript length: ${conversationText.length} chars, Message count: ${transcript.length}`);

  // Handle empty or insufficient transcripts early
  if (transcript.length === 0) {
    console.warn('[Feedback Analysis] WARNING: Empty transcript received');
    return new Response(
      JSON.stringify({
        feedback: {
          landed: ["Session started"],
          gaps: ["No conversation content captured - check microphone permissions and try again"],
          decision: "pending",
          overall: "Unable to analyze session: no conversation transcript was captured. Please ensure microphone permissions are granted and try again.",
          items: [
            {
              category: "Technical Issue",
              score: 1,
              comment: "No conversation transcript was recorded. This may be a technical issue with microphone permissions or ElevenLabs connection."
            }
          ],
          duration
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (conversationText.length < 50) {
    console.warn('[Feedback Analysis] WARNING: Very short transcript:', conversationText);
  }

  const guidelines = getFeedbackGuidelines(scenarioId);

  const systemPrompt = `You are an experienced VC partner reviewing a pitch practice session. Evaluate the conversation using the same lens you'd use during a live investor meeting. Use British English spelling throughout your feedback.

${guidelines}

Apply these evaluation principles:

1. **Tie feedback to concrete anchors** — Always reference the specific nouns, numbers, owners, and timeframes the founder actually mentioned (or failed to mention). If a founder cites metrics without context (customer count with no timeframe, revenue with no growth rate), flag that specifically. Use British English spelling (e.g., 'analyse', 'organise', 'realise').

2. **Evaluate what's present AND what's missing** — If the founder didn't address buyer/budget, unit economics, or key risks when prompted by the VC, call that out specifically.

3. **Use the founder's own language** — Quote or paraphrase what they actually said in this conversation. Never use generic observations like "engaged in conversation" or "completed the session."

4. **Score based on substance, not effort**:
   - 5 = Decision-grade: specific data, clear mechanisms, compelling proof
   - 4 = Strong: substantive but could add depth or time anchors
   - 3 = Adequate: covered the topic but vague or missing key details
   - 2 = Weak: struggled to answer or unclear
   - 1 = Poor: didn't address or irrelevant

5. **Map decision signals accurately**:
   - "Needs more work" → "pending"
   - "Well prepared" → "next-meeting"
   - "Follow-up ready" OR "Partner-track" → "term-sheet"
   - If session was too short or disengaged → "pass"

Return a JSON object with this structure:
{
  "landed": ["Anchor → why it works", "..."],
  "gaps": ["Gap → concrete fix or next test", "..."],
  "decision": "pending|next-meeting|term-sheet|pass",
  "overall": "2-3 sentence summary referencing specific conversation moments",
  "items": [
    {
      "category": "Category Name",
      "score": 1-5,
      "comment": "Specific observation tied to what founder said or didn't say",
      "highlight": "Optional direct quote from founder"
    }
  ]
}

Return ONLY valid JSON, no other text.`;

  const userPrompt = `Analyze this ${scenarioId} pitch practice session (${duration} seconds).

CONVERSATION TRANSCRIPT:
${conversationText}

CRITICAL: Read the entire transcript above carefully. Your feedback must ONLY reference what was actually said in this specific conversation. DO NOT use generic examples or placeholder text.

Evaluate as a VC partner would:
1. What concrete anchors (nouns/numbers/owners/time) did THIS founder provide in THIS conversation?
2. What questions did the VC ask, and how substantively did THIS founder respond?
3. What key topics were covered or missed in THIS conversation?
4. Pull DIRECT QUOTES or specific claims from THIS transcript to illustrate your points

If the transcript is empty or too short to evaluate, be honest about insufficient content.

Provide structured feedback as JSON. Every observation must tie directly to actual conversation content from the transcript above.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    throw new Error("Failed to generate feedback");
  }

  const data = await response.json();
  let feedbackText = data.choices?.[0]?.message?.content;

  console.log('[Feedback Analysis] AI response length:', feedbackText?.length, 'chars');

  // Clean up response - remove markdown code blocks if present
  if (feedbackText.includes('```json')) {
    feedbackText = feedbackText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (feedbackText.includes('```')) {
    feedbackText = feedbackText.replace(/```\n?/g, '');
  }

  // Parse the JSON feedback
  let feedback;
  try {
    feedback = JSON.parse(feedbackText.trim());
    console.log('[Feedback Analysis] Successfully parsed feedback. Landed items:', feedback.landed?.length, ', Gaps:', feedback.gaps?.length);
  } catch (parseError) {
    console.error("[Feedback Analysis] Failed to parse feedback JSON. Error:", parseError);
    console.error("[Feedback Analysis] Raw AI response:", feedbackText);
    // Return fallback - indicate system error rather than fake feedback
    feedback = {
      landed: ["System generated a response but couldn't analyze transcript details"],
      gaps: ["Try the session again - we encountered a processing error"],
      decision: "pending",
      overall: "We encountered an error analyzing your session. Please try practicing again. If this persists, contact support.",
      items: [
        {
          category: "Technical Issue",
          score: 3,
          comment: "Unable to properly analyze the conversation transcript due to a system error. Please try again."
        }
      ]
    };
  }

  // Add duration to feedback
  feedback.duration = duration;

  return new Response(
    JSON.stringify({ feedback }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { message, context, action, transcript, scenarioId, duration } = requestBody;

    // Handle feedback analysis endpoint
    if (action === 'analyze-session') {
      return await handleFeedbackAnalysis({ transcript, scenarioId, duration });
    }

    // Original conversation endpoint
    if (!message) {
      throw new Error("Message is required");
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an experienced venture capitalist conducting a pitch practice session. 
Your role is to:
- Ask tough but fair questions about the startup's business model, market, traction, and team
- Provide constructive feedback on pitch delivery and content
- Challenge assumptions and probe for depth
- Help founders refine their pitch

Context: ${context || 'Initial pitch session'}

Be conversational, direct, and helpful. Keep responses concise (2-3 sentences) to maintain a natural conversation flow.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in practice-pitching function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
