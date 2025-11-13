import { supabase } from '@/integrations/supabase/client';

const DAILY_SESSION_LIMIT = 4;

// Feature flag to disable session limits for testing
// Set to false to bypass all session limit checks
export const ENABLE_SESSION_LIMITS = true;

/**
 * Get the count of sessions started today (since midnight Sydney time)
 */
export async function getTodaySessionCount(userId: string): Promise<number> {
  // If limits are disabled, always return 0
  if (!ENABLE_SESSION_LIMITS) {
    return 0;
  }

  try {
    // Get midnight Sydney time (Australia/Sydney timezone)
    const now = new Date();
    const sydneyTimeString = now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
    const sydneyTime = new Date(sydneyTimeString);

    // Set to midnight Sydney time
    const todayStart = new Date(sydneyTime);
    todayStart.setHours(0, 0, 0, 0);

    // Convert back to UTC for database comparison
    const offset = now.getTime() - new Date(sydneyTimeString).getTime();
    const todayStartUTC = new Date(todayStart.getTime() + offset);

    const { count, error } = await supabase
      .from('practice_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayStartUTC.toISOString());

    if (error) {
      console.error('[SessionService] Error counting today sessions:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('[SessionService] Failed to get today session count:', error);
    return 0;
  }
}

/**
 * Check if user can start a new session (under daily limit)
 */
export async function canStartSession(userId: string): Promise<{ allowed: boolean; count: number; remaining: number }> {
  // If limits are disabled, always allow
  if (!ENABLE_SESSION_LIMITS) {
    return {
      allowed: true,
      count: 0,
      remaining: 999,
    };
  }

  const count = await getTodaySessionCount(userId);
  const remaining = Math.max(0, DAILY_SESSION_LIMIT - count);
  const allowed = count < DAILY_SESSION_LIMIT;

  return {
    allowed,
    count,
    remaining,
  };
}

/**
 * Record a session start in the database
 * Returns the session ID if successful
 */
export async function recordSessionStart(userId: string, scenarioId: string): Promise<string | null> {
  // If limits are disabled, skip recording for testing
  if (!ENABLE_SESSION_LIMITS) {
    console.log('[SessionService] Session limits disabled - skipping database recording');
    return 'test-session-id';
  }

  try {
    const { data, error } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: userId,
        scenario_id: scenarioId,
        transcript: [],
        feedback: {},
        duration: 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[SessionService] Error recording session start:', error);
      throw error;
    }

    console.log('[SessionService] Session recorded:', data.id);
    return data.id;
  } catch (error) {
    console.error('[SessionService] Failed to record session start:', error);
    return null;
  }
}

/**
 * Get time until midnight Sydney time (daily limit reset)
 */
export function getTimeUntilReset(): { hours: number; minutes: number; totalMinutes: number } {
  const now = new Date();

  // Get current time in Sydney
  const sydneyTimeString = now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
  const sydneyTime = new Date(sydneyTimeString);

  // Get midnight tomorrow in Sydney
  const tomorrowSydney = new Date(sydneyTime);
  tomorrowSydney.setDate(tomorrowSydney.getDate() + 1);
  tomorrowSydney.setHours(0, 0, 0, 0);

  // Convert to UTC timestamps and calculate difference
  const offset = now.getTime() - new Date(sydneyTimeString).getTime();
  const tomorrowUTC = new Date(tomorrowSydney.getTime() + offset);

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

export { DAILY_SESSION_LIMIT };
