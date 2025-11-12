import { supabase } from '@/integrations/supabase/client';

const DAILY_SESSION_LIMIT = 4;

/**
 * Get the count of sessions started today (since midnight UTC)
 */
export async function getTodaySessionCount(userId: string): Promise<number> {
  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('practice_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString());

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
 * Get time until midnight UTC (daily limit reset)
 */
export function getTimeUntilReset(): { hours: number; minutes: number; totalMinutes: number } {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);

  const diffMs = tomorrow.getTime() - now.getTime();
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
