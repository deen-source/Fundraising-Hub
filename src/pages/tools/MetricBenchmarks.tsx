import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

const benchmarkData: Record<string, Record<string, { p25: number; p50: number; p75: number; p90: number }>> = {
  'SaaS': {
    'MRR Growth Rate (%)': { p25: 10, p50: 15, p75: 25, p90: 40 },
    'Churn Rate (%)': { p25: 8, p50: 5, p75: 3, p90: 2 },
    'CAC Payback (months)': { p25: 18, p50: 12, p75: 8, p90: 5 },
    'LTV/CAC Ratio': { p25: 2, p50: 3, p75: 4, p90: 5 },
    'Gross Margin (%)': { p25: 60, p50: 70, p75: 80, p90: 85 },
  },
  'Marketplace': {
    'GMV Growth Rate (%)': { p25: 15, p50: 25, p75: 40, p90: 60 },
    'Take Rate (%)': { p25: 10, p50: 15, p75: 20, p90: 25 },
    'Repeat Purchase Rate (%)': { p25: 20, p50: 30, p75: 45, p90: 60 },
    'Active Buyers Growth (%)': { p25: 15, p50: 25, p75: 35, p90: 50 },
  },
  'E-commerce': {
    'Revenue Growth Rate (%)': { p25: 20, p50: 30, p75: 50, p90: 75 },
    'Gross Margin (%)': { p25: 25, p50: 35, p75: 45, p90: 55 },
    'AOV ($)': { p25: 50, p50: 75, p75: 120, p90: 200 },
    'CAC Payback (months)': { p25: 12, p50: 8, p75: 5, p90: 3 },
  },
  'FinTech': {
    'User Growth Rate (%)': { p25: 15, p50: 25, p75: 40, p90: 60 },
    'Transaction Volume Growth (%)': { p25: 20, p50: 35, p75: 55, p90: 80 },
    'Revenue per User ($)': { p25: 10, p50: 25, p75: 50, p90: 100 },
    'Retention Rate (%)': { p25: 60, p50: 70, p75: 80, p90: 90 },
  },
};

const MetricBenchmarks = () => {
  const navigate = useNavigate();
  const [industry, setIndustry] = useState('SaaS');
  const [metrics, setMetrics] = useState<Record<string, string>>({});

  const getPerformanceLevel = (value: number, benchmark: { p25: number; p50: number; p75: number; p90: number }) => {
    if (value >= benchmark.p90) return { level: 'Exceptional', color: 'text-green-500', icon: TrendingUp };
    if (value >= benchmark.p75) return { level: 'Strong', color: 'text-blue-500', icon: TrendingUp };
    if (value >= benchmark.p50) return { level: 'Average', color: 'text-yellow-500', icon: Minus };
    if (value >= benchmark.p25) return { level: 'Below Average', color: 'text-orange-500', icon: TrendingDown };
    return { level: 'Needs Improvement', color: 'text-red-500', icon: TrendingDown };
  };

  const getPercentile = (value: number, benchmark: { p25: number; p50: number; p75: number; p90: number }) => {
    if (value >= benchmark.p90) return 90 + ((value - benchmark.p90) / benchmark.p90) * 10;
    if (value >= benchmark.p75) return 75 + ((value - benchmark.p75) / (benchmark.p90 - benchmark.p75)) * 15;
    if (value >= benchmark.p50) return 50 + ((value - benchmark.p50) / (benchmark.p75 - benchmark.p50)) * 25;
    if (value >= benchmark.p25) return 25 + ((value - benchmark.p25) / (benchmark.p50 - benchmark.p25)) * 25;
    return (value / benchmark.p25) * 25;
  };

  const currentBenchmarks = benchmarkData[industry];

  return (
    <AuthGuard>
      <div className="min-h-screen relative">
        <StarField />
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

        <div className="relative z-10 container mx-auto px-4 py-8">
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-3xl">Metric Benchmarks</CardTitle>
                <CardDescription>
                  Compare your startup metrics against industry standards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Select Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger className="mt-2 bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SaaS">SaaS</SelectItem>
                      <SelectItem value="Marketplace">Marketplace</SelectItem>
                      <SelectItem value="E-commerce">E-commerce</SelectItem>
                      <SelectItem value="FinTech">FinTech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {Object.entries(currentBenchmarks).map(([metricName, benchmark]) => (
                    <div key={metricName}>
                      <Label>{metricName}</Label>
                      <Input
                        type="number"
                        placeholder={`Enter your ${metricName.toLowerCase()}`}
                        value={metrics[metricName] || ''}
                        onChange={(e) => setMetrics({ ...metrics, [metricName]: e.target.value })}
                        className="mt-2 bg-background/50"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {Object.keys(metrics).length > 0 && (
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle>Your Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(metrics).map(([metricName, value]) => {
                    if (!value) return null;
                    const numValue = parseFloat(value);
                    const benchmark = currentBenchmarks[metricName];
                    const performance = getPerformanceLevel(numValue, benchmark);
                    const percentile = getPercentile(numValue, benchmark);
                    const Icon = performance.icon;

                    return (
                      <div key={metricName} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{metricName}</span>
                          <div className="flex items-center gap-2">
                            <Icon className={`w-5 h-5 ${performance.color}`} />
                            <span className={`font-semibold ${performance.color}`}>
                              {performance.level}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <span>P25: {benchmark.p25}</span>
                            <span>P50: {benchmark.p50}</span>
                            <span>P75: {benchmark.p75}</span>
                            <span>P90: {benchmark.p90}</span>
                          </div>
                          <Progress value={Math.min(percentile, 100)} className="h-3" />
                          <p className="text-sm text-muted-foreground mt-2">
                            Your value ({numValue}) is at the {Math.round(percentile)}th percentile
                          </p>
                        </div>

                        <div className="p-4 rounded-lg bg-background/50 border border-border">
                          <p className="text-sm">
                            {percentile >= 75 ? 
                              `Excellent! You're performing better than ${Math.round(percentile)}% of ${industry} companies.` :
                              percentile >= 50 ?
                              `You're at the median. Consider strategies to reach the 75th percentile (${benchmark.p75}).` :
                              `There's room for improvement. Top quartile companies achieve ${benchmark.p75} or higher.`
                            }
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default MetricBenchmarks;
