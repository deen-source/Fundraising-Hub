import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DailyUsage {
  date: string;
  minutes: number;
  sessions: number;
}

interface UsageTrendsChartProps {
  dailyUsage: DailyUsage[];
}

export const UsageTrendsChart = ({ dailyUsage }: UsageTrendsChartProps) => {
  // Calculate trend
  const recentWeek = dailyUsage.slice(-7);
  const previousWeek = dailyUsage.slice(-14, -7);

  const recentWeekMinutes = recentWeek.reduce((sum, day) => sum + day.minutes, 0);
  const previousWeekMinutes = previousWeek.reduce((sum, day) => sum + day.minutes, 0);

  const trend = previousWeekMinutes > 0
    ? ((recentWeekMinutes - previousWeekMinutes) / previousWeekMinutes) * 100
    : 0;

  const TrendIcon = trend > 5 ? TrendingUp : trend < -5 ? TrendingDown : Minus;
  const trendColor = trend > 5 ? 'text-green-600' : trend < -5 ? 'text-red-600' : 'text-gray-600';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Usage Trends</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </div>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">
              {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">vs last week</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyUsage}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis className="text-xs" label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border shadow-lg p-3">
                      <p className="font-semibold">{new Date(data.date).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.minutes} minutes ({data.sessions} sessions)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
