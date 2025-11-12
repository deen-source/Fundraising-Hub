import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle feedback analysis
async function handleFeedbackAnalysis({ transcript, scenarioId, duration }: {
  transcript: Array<{ role: string; content: string; timestamp: number }>;
  scenarioId: string;
  duration: number;
}) {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  // Format transcript for analysis
  const conversationText = transcript
    .map(msg => `${msg.role === 'user' ? 'Founder' : 'VC'}: ${msg.content}`)
    .join('\n\n');

  // Format duration as minutes:seconds
  const formattedDuration = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;

  // Log transcript for debugging
  console.log(`[Feedback Analysis] Scenario: ${scenarioId}, Duration: ${formattedDuration}, Transcript length: ${conversationText.length} chars, Message count: ${transcript.length}`);

  // Handle empty or insufficient transcripts early
  if (transcript.length === 0) {
    console.warn('[Feedback Analysis] WARNING: Empty transcript received');
    return new Response(
      JSON.stringify({
        feedback: {
          overall: "Unable to analyse session: no conversation transcript was captured. Please ensure microphone permissions are granted and try again.",
          landed: ["Session started"],
          gaps: ["No conversation content captured – check microphone permissions and try again"],
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

  // Reject sessions that are too short for meaningful feedback
  if (duration < 15) {
    console.warn('[Feedback Analysis] Session too short:', duration, 'seconds');
    return new Response(
      JSON.stringify({
        feedback: {
          overall: "Session too short for meaningful feedback. Please have a longer conversation and try again.",
          landed: [],
          gaps: ["Have a longer conversation (at least 15 seconds) to receive detailed feedback"],
          items: [
            {
              category: "Session Duration",
              score: 1,
              comment: "This session was too brief to provide meaningful feedback. Try having a more extended conversation with the investor.",
              highlight: ""
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

  // Scenario-specific expectations
  const scenarioContext = scenarioId === 'first-coffee'
    ? 'Coffee expectations (2 min): Typically covers 2-3 core topics. Common: What it does, Founder-Market Fit, early Traction, Why Now. Strong if one concrete traction metric with time window.'
    : 'Deep Dive expectations (5 min): Typically covers 5-7 topics with more depth. Look for evidence quality, repeatability, contradictions resolved, risk mitigation.';

  const systemPrompt = `You are providing post-conversation feedback as the VC partner who just spoke with this founder. Your feedback should feel like a natural, constructive continuation of the conversation—you're reflecting on what you heard and offering supportive guidance to help them improve.

CONVERSATION CONTEXT
Scenario: ${scenarioId === 'first-coffee' ? 'First Coffee (2 min)' : 'Deep Dive (5 min)'}
Duration: ${formattedDuration}
Your role: Calm, curious, analytical VC partner using the Arc Coverage framework

TONE REQUIREMENTS
• Clear, concise and honest
• Written in the clear and concise words, tone and style of Sam Altman
• Frame gaps as opportunities with concrete next steps
• Remember: they're practising, not pitching for real investment
• Use British English spelling throughout (analyse, organise, realise)

EVALUATION FRAMEWORK

Assess only the topics that came up during this conversation using three lenses:

1. COVERAGE (breadth): Which Arc topics did the founder discuss?
2. SUFFICIENCY (depth): For each topic, did they provide all three elements?
   • Clear claim (what's being asserted)
   • Concrete anchor (noun/number/owner/time window)
   • Support (evidence/mechanism OR next test with timing)
3. QUALITY (specificity): How concrete and specific were their anchors?

Arc Coverage Topics (reference only—don't penalise if not discussed):
• What it does (plain terms)
• Problem
• Value Proposition
• Founder–Market Fit
• Market size & shape
• Why Now
• Traction (metric + time window)
• ICP (buyer/signatory/budget)
• Competition & Wedge
• Distribution & Repeatability
• Pricing & Packaging
• Unit economics
• Risks & Mitigations
• Ask (round dynamics)

${scenarioContext}

CRITICAL: Only assess topics the founder actually discussed.
• If the VC didn't ask about Competition, don't penalise for missing it
• Only create feedback items for topics that came up in conversation
• "Gaps" should be about incomplete coverage of discussed topics, NOT missing topics entirely
• If a topic wasn't mentioned at all, don't include it in your feedback

ANCHOR QUALITY GRADATIONS (assess articulation, not business merit)

For each topic discussed, assess how well they articulated it:

What it does:
• Strong: Anyone could repeat what it does; clear before→after outcome; plain terms
• Weak: Jargon-heavy; feature list instead of outcome

Problem:
• Strong: Pain relatable and urgent; customer perspective; current workaround; stakes clear
• Weak: Abstract; founder-centric; no stakes

Value Proposition:
• Strong: Quantified outcome; tied to specific customer pain
• Weak: Vague benefits; no metrics

Founder–Market Fit:
• Strong: Lived the problem / repeat founder / unique access
• Medium: Industry exposure / partial insight
• Weak: No relevant connection explained

Market Sizing:
• Strong: Bottom-up (segment × price × penetration); specific beachhead
• Weak: Top-down ("X% of huge market"); no segment

Why Now:
• Strong: Specific dated catalyst (regulation date; platform launch; behaviour shift)
• Medium: General trend mentioned
• Weak: No catalyst articulated

Traction:
• Strongest: Paying customers + retention/expansion + time window
• Strong: Pilots → paid with timeline + named customers
• Medium: Active pilots + pipeline with conversion path
• Light: LOIs/interest + next steps with timing
• Minimal: Waitlist/signups with no conversion plan

ICP:
• Strong: Specific role/title; company size/segment; budget source; where they congregate
• Weak: "Enterprises" or "SMBs" without specificity; no budget source

Competition & Wedge:
• Strong: Named competitor + specific moat type + mechanism explained
• Weak: "No real competitors" or vague "better product"

Distribution & Repeatability:
• Strong: Same motion repeated 2-3+ times; clear ICP; predictable timeline; named owner
• Medium: One channel working; early pattern
• Weak: All deals through founder network; no repeatable process

Pricing & Packaging:
• Strong: Clear who pays + what for + how pricing scales; tied to value
• Weak: Vague or "we'll figure it out"

Unit Economics:
• Strong: Specific payback period or test plan; CAC/LTV direction; gross margin visibility
• Weak: "Should be profitable" without metrics or plan

Risks & Mitigations:
• Strong: Specific risk + mitigation plan with owner/timeline
• Weak: "No major risks" or risks without mitigations

Ask:
• Strong: Specific amount + clear use of funds + milestones with dates/owners + runway
• Weak: Range without rationale; vague use of funds; no milestones

CONVERSATION QUALITY INDICATORS (recognise strong articulation)

Call out when the founder demonstrated these:
• Specific anchors (named customers, dated catalysts, concrete metrics with time windows)
• Mission-critical language (urgency, budget allocated, "business stops without this")
• Buyer reality (named signer, procurement process described)
• Moat specificity (type identified, mechanism explained, hard to copy in 12-24 months)
• Contradictions resolved (numbers reconcile, mechanisms clear)
• Direct quotes and examples (vs abstract claims)
• Concrete next tests with timing (date/owner/metric)

OUTPUT STRUCTURE

Return JSON with this exact structure:

{
  "overall": "2-3 sentences reflecting on the conversation. Reference specific moments, anchors, or quotes. Be encouraging and constructive. Highlight what they did well first.",
  "landed": [
    "[Specific anchor or strength from conversation] → why it works well",
    "[Another specific anchor] → what made it strong"
  ],
  "gaps": [
    "[Opportunity to strengthen on a discussed topic] → concrete suggested action or next test",
    "[Another gap in a discussed topic] → specific way to address it"
  ],
  "items": [
    {
      "category": "[Arc Coverage topic name that was actually discussed]",
      "score": 1-5,
      "comment": "Specific observation tied to what founder said or how they articulated it. Be constructive and reference their anchors.",
      "highlight": "Optional: direct quote from founder that illustrates the point"
    }
  ]
}

SCORING RUBRIC (1-5 scale based on articulation quality, not business quality)

5 = Excellent articulation: All three sufficiency elements present; specific anchors (nouns/numbers/owners/time); conversation quality indicators evident
4 = Strong articulation: Claim + anchor present; could add depth or time window; substantive
3 = Adequate articulation: Topic touched but could be more specific; missing some anchors or support
2 = Weak articulation: Struggled to articulate clearly; vague claim or missing mechanism
1 = Poor articulation: Didn't address when asked; contradictory or irrelevant

CRITICAL INSTRUCTIONS

• Read the entire transcript carefully
• Your feedback must ONLY reference what was actually said in this specific conversation
• DO NOT use generic examples or placeholder text
• Pull DIRECT QUOTES from the transcript to illustrate points
• Only assess topics the founder discussed—don't penalise for topics not covered
• If session was very short (<30 seconds), be honest about insufficient content but remain encouraging
• Be constructive and supportive—help them improve, don't discourage them
• Start with strengths (what landed well) before addressing gaps
• Frame gaps as opportunities with concrete next steps

Return ONLY valid JSON, no other text.`;

  const userPrompt = `Analyse this ${scenarioId} practice session (${formattedDuration}).

CONVERSATION TRANSCRIPT:
${conversationText}

Based on this conversation, provide constructive, encouraging feedback:

1. Which Arc Coverage topics did the founder actually discuss?
2. For each topic discussed: did they provide claim + anchor (noun/number/owner/time) + support?
3. How specific and concrete were their anchors?
4. What conversation quality indicators appeared?
5. What specific anchors, quotes, or moments stood out?

Provide feedback that feels like the VC's warm, constructive reflection immediately after the call. Start with what landed well. Reference specific moments, anchors, and quotes from the conversation above. Frame gaps as opportunities with concrete next steps.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI API error:", response.status, errorText);
    throw new Error("Failed to generate feedback from OpenAI");
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
      overall: "We encountered an error analysing your session. Please try practising again. If this persists, contact support.",
      landed: ["System generated a response but couldn't analyse transcript details"],
      gaps: ["Try the session again – we encountered a processing error"],
      items: [
        {
          category: "Technical Issue",
          score: 3,
          comment: "Unable to properly analyse the conversation transcript due to a system error. Please try again."
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
    const { action, transcript, scenarioId, duration } = requestBody;

    // Only handle feedback analysis - ElevenLabs handles all conversations
    if (action === 'analyze-session') {
      return await handleFeedbackAnalysis({ transcript, scenarioId, duration });
    }

    // Return error if wrong action is requested
    return new Response(
      JSON.stringify({ error: "Invalid action. This endpoint only supports 'analyze-session'. Conversations are handled by ElevenLabs." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in practice-pitching function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
