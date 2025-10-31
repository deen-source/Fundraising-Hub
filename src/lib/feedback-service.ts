import { supabase } from '@/integrations/supabase/client';
import { SessionFeedback } from '@/types/arconic-simulator';
import { ConversationMessage } from '@/components/arconic/ElevenLabsVoiceWidget';

export interface GenerateFeedbackParams {
  transcript: ConversationMessage[];
  scenarioId: string;
  duration: number;
}

/**
 * Generate AI feedback for a pitch practice session
 * Calls the Supabase Edge Function to analyze the conversation transcript
 */
export async function generateSessionFeedback({
  transcript,
  scenarioId,
  duration,
}: GenerateFeedbackParams): Promise<SessionFeedback> {
  console.log('[FeedbackService] Generating feedback for session:', {
    scenarioId,
    duration,
    transcriptLength: transcript.length,
    firstMessage: transcript[0],
    lastMessage: transcript[transcript.length - 1],
  });

  try {
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('practice-pitching', {
      body: {
        action: 'analyze-session',
        transcript,
        scenarioId,
        duration,
      },
    });

    if (error) {
      console.error('[FeedbackService] Supabase function error:', error);
      throw error;
    }

    if (!data?.feedback) {
      console.error('[FeedbackService] No feedback in response:', data);
      throw new Error('No feedback received from service');
    }

    const feedback: SessionFeedback = data.feedback;

    // Validate the feedback structure
    if (!feedback.landed || !feedback.gaps || !feedback.decision || !feedback.overall || !feedback.items) {
      console.warn('[FeedbackService] Incomplete feedback structure:', feedback);
      return getFallbackFeedback(scenarioId, duration);
    }

    console.log('[FeedbackService] Generated feedback:', feedback);

    // Save session to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('practice_sessions').insert({
          user_id: user.id,
          scenario_id: scenarioId,
          transcript,
          feedback,
          duration,
        });
        console.log('[FeedbackService] Session saved to database');
      }
    } catch (dbError) {
      console.error('[FeedbackService] Failed to save session:', dbError);
      // Don't fail the whole flow if database save fails
    }

    return feedback;

  } catch (error) {
    console.error('[FeedbackService] Error generating feedback:', error);

    // Return fallback feedback on error
    return getFallbackFeedback(scenarioId, duration);
  }
}

/**
 * Fallback feedback when AI generation fails
 * NOTE: This should rarely be shown - if users see this frequently, there's a system issue
 */
function getFallbackFeedback(scenarioId: string, duration: number): SessionFeedback {
  // Provide honest feedback that indicates a system error rather than fake generic feedback
  const isShortSession = duration < 45;

  if (isShortSession) {
    return {
      landed: [
        'You started the practice session',
      ],
      gaps: [
        'Session was very short (< 45 seconds) - try a longer conversation for meaningful feedback',
        'Engage with the VC\'s questions and provide detailed responses about your startup',
      ],
      decision: 'pending',
      overall: `This session was quite brief (${duration} seconds). For valuable feedback, aim for at least 2-3 minutes and engage substantively with the investor's questions about your problem, solution, market, and traction.`,
      items: [
        {
          category: 'Session Length',
          score: 1,
          comment: `Session lasted only ${duration} seconds. Aim for 2-3+ minutes to practice a real pitch conversation.`,
        },
        {
          category: 'Engagement',
          score: 2,
          comment: 'Limited conversation content to analyze. Try answering the VC\'s questions with more depth and detail.',
        },
      ],
      duration,
    };
  }

  return {
    landed: [
      'You engaged in the practice session',
    ],
    gaps: [
      'We encountered an error generating detailed feedback - please try again',
      'If this persists, there may be a technical issue with the feedback system',
    ],
    decision: 'pending',
    overall: 'We had trouble analyzing your session due to a technical issue. Please try practicing again, and if you continue to see this message, contact support.',
    items: [
      {
        category: 'System Error',
        score: 3,
        comment: 'Unable to generate detailed AI feedback. This is a technical issue, not a reflection of your pitch.',
      },
    ],
    duration,
  };
}

/**
 * Add a minimum delay to ensure good UX during the analyzing state
 * This prevents the feedback from flashing too quickly
 */
export async function generateSessionFeedbackWithDelay(
  params: GenerateFeedbackParams,
  minDelayMs: number = 2000
): Promise<SessionFeedback> {
  const startTime = Date.now();

  // Generate feedback
  const feedback = await generateSessionFeedback(params);

  // Calculate remaining delay
  const elapsed = Date.now() - startTime;
  const remainingDelay = Math.max(0, minDelayMs - elapsed);

  // Wait for remaining delay if needed
  if (remainingDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, remainingDelay));
  }

  return feedback;
}
