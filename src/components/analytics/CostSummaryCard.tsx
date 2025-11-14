import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

interface CostSummaryCardProps {
  planCost: number;
  totalMinutes: number;
  planLimit: number;
  overageRate: number;
  projectedEndOfMonth: number;
  totalLlmCost?: number;
}

export const CostSummaryCard = ({
  planCost,
  totalMinutes,
  planLimit,
  overageRate,
  projectedEndOfMonth,
  totalLlmCost = 0,
}: CostSummaryCardProps) => {
  const overageMinutes = Math.max(0, totalMinutes - planLimit);
  const overageCost = overageMinutes * overageRate;
  const totalCost = planCost + overageCost + totalLlmCost;

  // Project end of month cost
  const projectedOverageMinutes = Math.max(0, projectedEndOfMonth - planLimit);
  const projectedOverageCost = projectedOverageMinutes * overageRate;

  // Project LLM cost based on current ratio (assuming same growth)
  const projectedLlmCost = totalMinutes > 0
    ? (totalLlmCost / totalMinutes) * projectedEndOfMonth
    : totalLlmCost;

  const projectedTotalCost = planCost + projectedOverageCost + projectedLlmCost;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Cost Summary
        </CardTitle>
        <CardDescription>Current month expenses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">ElevenLabs Plan Cost</span>
            <span className="text-sm font-medium">${planCost.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Voice Overage ({overageMinutes.toLocaleString()} min)
            </span>
            <span className="text-sm font-medium">${overageCost.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              ChatGPT Feedback Cost
            </span>
            <span className="text-sm font-medium">A${totalLlmCost.toFixed(2)}</span>
          </div>
          <div className="h-px bg-border my-2" />
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total This Month</span>
            <span className="text-2xl font-bold">${totalCost.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-muted p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Projected End of Month</span>
            <span className="text-sm font-semibold">${projectedTotalCost.toFixed(2)}</span>
          </div>
          {projectedTotalCost > totalCost && (
            <p className="text-xs text-muted-foreground">
              Based on current usage trends
            </p>
          )}
        </div>

        {overageCost > 0 && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 px-3 py-2 text-sm">
            Overage charges: ${overageCost.toFixed(2)} (~${overageRate.toFixed(2)}/min)
          </div>
        )}
      </CardContent>
    </Card>
  );
};
