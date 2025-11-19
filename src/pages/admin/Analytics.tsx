import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthGuard } from '@/components/AuthGuard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, TrendingUp, Mail, Building, Calendar } from 'lucide-react';
import { isAdmin } from '@/lib/admin';
import { UsageSummaryCard } from '@/components/analytics/UsageSummaryCard';
import { CostSummaryCard } from '@/components/analytics/CostSummaryCard';
import { UsageTrendsChart } from '@/components/analytics/UsageTrendsChart';
import { TopUsersTable } from '@/components/analytics/TopUsersTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Plan configuration (Creator plan with Conversational AI)
const PLAN_CONFIG = {
  name: 'Creator',
  planCost: 22,
  planLimit: 250, // minutes of agent time per month
  overageRate: 0.11, // $ per minute
  billingDay: 27, // Billing cycle resets on the 27th of each month
  usdToAud: 1.55, // Exchange rate for USD to AUD conversion
};

interface DailyUsage {
  date: string;
  minutes: number;
  sessions: number;
}

interface UserUsage {
  email: string;
  fullName: string | null;
  sessions: number;
  minutes: number;
  cost: number;
}

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Analytics data
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalLlmCost, setTotalLlmCost] = useState(0);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [userUsage, setUserUsage] = useState<UserUsage[]>([]);
  const [flaggedLeads, setFlaggedLeads] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) {
      // Not admin, redirect to dashboard
      navigate('/dashboard');
      return;
    }

    setIsUserAdmin(true);
    await Promise.all([loadAnalyticsData(), loadFlaggedLeads()]);
  };

  const loadFlaggedLeads = async () => {
    try {
      // Fetch flagged pitch deck analyses
      const { data, error } = await supabase
        .from('term_sheet_analyses')
        .select(`
          id,
          created_at,
          stage,
          investment_grade,
          user_id,
          profiles (
            email,
            full_name,
            company_name
          )
        `)
        .eq('tool_type', 'pitch_deck')
        .eq('flagged_for_review', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setFlaggedLeads(data || []);
    } catch (error) {
      console.error('Error loading flagged leads:', error);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      // Get billing cycle start and end (27th of each month)
      const now = new Date();
      const currentDay = now.getDate();

      // If today is before billing day, cycle started last month
      // If today is on/after billing day, cycle started this month
      let cycleStart: Date;
      let cycleEnd: Date;

      if (currentDay < PLAN_CONFIG.billingDay) {
        // Current cycle: last month's 27th to this month's 26th
        cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, PLAN_CONFIG.billingDay);
        cycleEnd = new Date(now.getFullYear(), now.getMonth(), PLAN_CONFIG.billingDay - 1, 23, 59, 59);
      } else {
        // Current cycle: this month's 27th to next month's 26th
        cycleStart = new Date(now.getFullYear(), now.getMonth(), PLAN_CONFIG.billingDay);
        cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, PLAN_CONFIG.billingDay - 1, 23, 59, 59);
      }

      console.log('[Analytics] Loading data for billing cycle:', {
        start: cycleStart.toISOString(),
        end: cycleEnd.toISOString(),
        billingDay: PLAN_CONFIG.billingDay,
      });

      // Fetch all practice sessions for current billing cycle (without profiles join)
      const { data: sessions, error } = await supabase
        .from('practice_sessions')
        .select('id, user_id, created_at, duration, llm_prompt_tokens, llm_completion_tokens, llm_total_tokens, llm_cost')
        .gte('created_at', cycleStart.toISOString())
        .lte('created_at', cycleEnd.toISOString())
        .order('created_at', { ascending: true });

      console.log('[Analytics] Query result:', {
        sessionsCount: sessions?.length || 0,
        error: error,
        firstSession: sessions?.[0],
        lastSession: sessions?.[sessions?.length - 1],
      });

      if (error) throw error;

      // Fetch user emails from profiles table separately (if it exists)
      const uniqueUserIds = [...new Set(sessions?.map((s: any) => s.user_id) || [])];
      const userEmailMap = new Map<string, { email: string; fullName: string | null }>();

      if (uniqueUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', uniqueUserIds);

        if (!profilesError && profiles) {
          profiles.forEach((profile: any) => {
            userEmailMap.set(profile.id, {
              email: profile.email || 'Unknown',
              fullName: profile.full_name || null,
            });
          });
        } else {
          console.warn('[Analytics] Could not fetch profiles:', profilesError);
          // Fallback: use user IDs as identifiers
          uniqueUserIds.forEach(userId => {
            userEmailMap.set(userId, {
              email: userId.substring(0, 8) + '...', // Show truncated user ID
              fullName: null,
            });
          });
        }
      }

      console.log('[Analytics] Fetched user emails:', {
        userCount: userEmailMap.size,
        users: Array.from(userEmailMap.entries()),
      });

      // Filter out sessions with duration 0 (incomplete sessions) and convert seconds to minutes
      const sessionsWithDuration = (sessions || [])
        .filter((session: any) => session.duration > 0)
        .map((session: any) => ({
          ...session,
          durationMinutes: Math.round(session.duration / 60 * 10) / 10, // Convert seconds to minutes, round to 1 decimal
        }));

      console.log('[Analytics] After filtering duration > 0:', {
        sessionsWithDuration: sessionsWithDuration.length,
        totalSessions: sessions?.length || 0,
        sampleSession: sessionsWithDuration[0],
      });

      // Calculate total minutes and sessions
      const totalMins = sessionsWithDuration.reduce((sum, s) => sum + s.durationMinutes, 0);
      const totalSess = sessionsWithDuration.length;

      // Calculate total LLM cost (convert USD to AUD)
      const totalLLMCostUSD = sessionsWithDuration.reduce((sum, s) => sum + (s.llm_cost || 0), 0);
      const totalLLMCost = totalLLMCostUSD * PLAN_CONFIG.usdToAud;

      console.log('[Analytics] Calculated totals:', {
        totalMinutes: Math.round(totalMins),
        totalSessions: totalSess,
        totalLlmCost: totalLLMCost,
      });

      setTotalMinutes(Math.round(totalMins));
      setTotalSessions(totalSess);
      setTotalLlmCost(totalLLMCost);

      // Calculate daily usage for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyMap = new Map<string, { minutes: number; sessions: number }>();

      // Initialize all dates with 0
      for (let i = 0; i < 30; i++) {
        const date = new Date(thirtyDaysAgo);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dailyMap.set(dateStr, { minutes: 0, sessions: 0 });
      }

      // Fill in actual data
      sessionsWithDuration.forEach((session: any) => {
        const dateStr = new Date(session.created_at).toISOString().split('T')[0];
        if (dailyMap.has(dateStr)) {
          const current = dailyMap.get(dateStr)!;
          dailyMap.set(dateStr, {
            minutes: current.minutes + session.durationMinutes,
            sessions: current.sessions + 1,
          });
        }
      });

      // Convert to array
      const dailyData: DailyUsage[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        minutes: data.minutes,
        sessions: data.sessions,
      }));

      setDailyUsage(dailyData);

      // Calculate per-user usage
      const userMap = new Map<string, UserUsage>();

      sessionsWithDuration.forEach((session: any) => {
        const userInfo = userEmailMap.get(session.user_id);
        const email = userInfo?.email || 'Unknown';
        const fullName = userInfo?.fullName || null;

        if (!userMap.has(email)) {
          userMap.set(email, {
            email,
            fullName,
            sessions: 0,
            minutes: 0,
            cost: 0,
          });
        }

        const user = userMap.get(email)!;
        user.sessions += 1;
        user.minutes += session.durationMinutes;
        user.cost = user.minutes * PLAN_CONFIG.overageRate;
      });

      setUserUsage(Array.from(userMap.values()));

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate days until billing cycle reset (27th of next month or this month)
  const now = new Date();
  const currentDay = now.getDate();

  let nextBillingDate: Date;
  if (currentDay < PLAN_CONFIG.billingDay) {
    // Reset is this month on the 27th
    nextBillingDate = new Date(now.getFullYear(), now.getMonth(), PLAN_CONFIG.billingDay);
  } else {
    // Reset is next month on the 27th
    nextBillingDate = new Date(now.getFullYear(), now.getMonth() + 1, PLAN_CONFIG.billingDay);
  }

  const daysUntilReset = Math.ceil((nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Project end of billing cycle usage based on current trend
  // Calculate cycle start to determine days passed in this cycle
  let cycleStartDate: Date;
  if (currentDay < PLAN_CONFIG.billingDay) {
    cycleStartDate = new Date(now.getFullYear(), now.getMonth() - 1, PLAN_CONFIG.billingDay);
  } else {
    cycleStartDate = new Date(now.getFullYear(), now.getMonth(), PLAN_CONFIG.billingDay);
  }

  const daysPassed = Math.ceil((now.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalDaysInCycle = 30; // Approximately 30 days in a billing cycle
  const avgMinutesPerDay = daysPassed > 0 ? totalMinutes / daysPassed : 0;
  const projectedEndOfMonth = Math.round(avgMinutesPerDay * totalDaysInCycle);

  if (!isUserAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-8 lg:px-12 py-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Practice Pitching Analytics</h1>
              <p className="text-muted-foreground mt-1">
                Monitor usage and costs for ElevenLabs voice practice sessions
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Flagged Leads Section */}
              {flaggedLeads.length > 0 && (
                <Card className="border-2 border-success/30 bg-success/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-success">
                      <TrendingUp className="w-5 h-5" />
                      High-Potential Startups ({flaggedLeads.length})
                    </CardTitle>
                    <CardDescription>
                      Pitch deck analyses flagged as "Strong Investment Candidate"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {flaggedLeads.map((lead: any) => (
                        <div key={lead.id} className="p-4 rounded-lg bg-background border border-success/30">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                Email
                              </div>
                              <div className="font-medium">{lead.profiles?.email || 'N/A'}</div>
                            </div>

                            {lead.profiles?.company_name && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Building className="w-3 h-3" />
                                  Company
                                </div>
                                <div className="font-medium">{lead.profiles.company_name}</div>
                              </div>
                            )}

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <TrendingUp className="w-3 h-3" />
                                Stage
                              </div>
                              <Badge variant="default">{lead.stage || 'Not specified'}</Badge>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                Date
                              </div>
                              <div className="text-sm">{new Date(lead.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UsageSummaryCard
                  totalMinutes={totalMinutes}
                  totalSessions={totalSessions}
                  planLimit={PLAN_CONFIG.planLimit}
                  daysUntilReset={daysUntilReset}
                  projectedEndOfMonth={projectedEndOfMonth}
                />
                <CostSummaryCard
                  planCost={PLAN_CONFIG.planCost}
                  totalMinutes={totalMinutes}
                  planLimit={PLAN_CONFIG.planLimit}
                  overageRate={PLAN_CONFIG.overageRate}
                  projectedEndOfMonth={projectedEndOfMonth}
                  totalLlmCost={totalLlmCost}
                />
              </div>

              {/* Usage Trends Chart */}
              <UsageTrendsChart dailyUsage={dailyUsage} />

              {/* Top Users Table */}
              <TopUsersTable users={userUsage} overageRate={PLAN_CONFIG.overageRate} />

              {/* Plan Info Footer */}
              <div className="bg-muted p-4 text-sm text-muted-foreground">
                <p className="font-semibold mb-1">Current Plan: {PLAN_CONFIG.name}</p>
                <p>
                  Monthly limit: {PLAN_CONFIG.planLimit.toLocaleString()} minutes |
                  Overage rate: ${PLAN_CONFIG.overageRate}/min |
                  Base cost: ${PLAN_CONFIG.planCost}/month
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default Analytics;
