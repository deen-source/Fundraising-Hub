import { supabase } from '@/integrations/supabase/client';

const DAILY_ANALYSIS_LIMIT = 2;

// Feature flag to disable analysis limits for testing
export const ENABLE_ANALYSIS_LIMITS = true;

/**
 * Get the count of pitch deck analyses started today (since midnight UTC)
 */
export async function getTodayAnalysisCount(userId: string): Promise<number> {
  // If limits are disabled, always return 0
  if (!ENABLE_ANALYSIS_LIMITS) {
    return 0;
  }

  try {
    // Get midnight UTC
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('term_sheet_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('tool_type', 'pitch_deck')
      .gte('created_at', todayStart.toISOString());

    if (error) {
      console.error('[PitchDeckService] Error counting today analyses:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('[PitchDeckService] Failed to get today analysis count:', error);
    return 0;
  }
}

/**
 * Check if user can start a new analysis (under daily limit)
 */
export async function canAnalyzeDeck(userId: string): Promise<{ allowed: boolean; count: number; remaining: number }> {
  // If limits are disabled, always allow
  if (!ENABLE_ANALYSIS_LIMITS) {
    return {
      allowed: true,
      count: 0,
      remaining: 999,
    };
  }

  const count = await getTodayAnalysisCount(userId);
  const remaining = Math.max(0, DAILY_ANALYSIS_LIMIT - count);
  const allowed = count < DAILY_ANALYSIS_LIMIT;

  return {
    allowed,
    count,
    remaining,
  };
}

/**
 * Get time until midnight UTC (daily limit reset)
 */
export function getTimeUntilReset(): { hours: number; minutes: number; totalMinutes: number } {
  const now = new Date();

  // Get midnight tomorrow UTC
  const tomorrowUTC = new Date(now);
  tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);
  tomorrowUTC.setUTCHours(0, 0, 0, 0);

  const diffMs = tomorrowUTC.getTime() - now.getTime();
  const totalMinutes = Math.floor(diffMs / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    hours,
    minutes,
    totalMinutes,
  };
}

/**
 * Format time until reset as human-readable string
 */
export function formatTimeUntilReset(): string {
  const { hours, minutes } = getTimeUntilReset();

  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

export { DAILY_ANALYSIS_LIMIT };
