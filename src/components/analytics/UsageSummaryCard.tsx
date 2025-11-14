import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, TrendingUp } from 'lucide-react';

interface UsageSummaryCardProps {
  totalMinutes: number;
  totalSessions: number;
  planLimit: number;
  daysUntilReset: number;
  projectedEndOfMonth: number;
}

export const UsageSummaryCard = ({
  totalMinutes,
  totalSessions,
  planLimit,
  daysUntilReset,
  projectedEndOfMonth,
}: UsageSummaryCardProps) => {
  const percentageUsed = (totalMinutes / planLimit) * 100;
  const minutesRemaining = planLimit - totalMinutes;
  const avgSessionLength = totalSessions > 0 ? totalMinutes / totalSessions : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Current Month Usage
        </CardTitle>
        <CardDescription>
          Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {totalMinutes.toLocaleString()} / {planLimit.toLocaleString()} min
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(percentageUsed)}%
            </span>
          </div>
          <Progress value={percentageUsed} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Minutes Remaining</p>
            <p className="text-2xl font-bold">
              {minutesRemaining > 0 ? minutesRemaining.toLocaleString() : 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Sessions</p>
            <p className="text-2xl font-bold">{totalSessions}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Session</p>
            <p className="text-2xl font-bold">{avgSessionLength.toFixed(1)} min</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Projected EOMonth
              <TrendingUp className="w-3 h-3" />
            </p>
            <p className="text-2xl font-bold">{projectedEndOfMonth.toLocaleString()} min</p>
          </div>
        </div>

        {percentageUsed >= 75 && percentageUsed < 100 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 text-sm">
            You've used {Math.round(percentageUsed)}% of your monthly limit
          </div>
        )}

        {percentageUsed >= 100 && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-sm font-medium">
            Overage charges now apply (~$0.11/min)
          </div>
        )}
      </CardContent>
    </Card>
  );
};
