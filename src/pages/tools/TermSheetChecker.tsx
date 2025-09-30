import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, Loader2, AlertTriangle, Shield, TrendingUp, Target, DollarSign, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

const TermSheetChecker = () => {
  const navigate = useNavigate();
  const [termSheetText, setTermSheetText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!termSheetText.trim()) {
      toast.error('Please enter your term sheet text');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-term-sheet', {
        body: { termSheetText },
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('term_sheet_analyses').insert({
          user_id: user.id,
          term_sheet_text: termSheetText,
          analysis_result: data.analysis,
        });
      }

      toast.success('Comprehensive analysis complete!');
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Failed to analyze term sheet');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'minor': return 'text-yellow-500';
      case 'moderate': return 'text-orange-500';
      case 'severe': return 'text-red-500';
      case 'deal-breaker': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const formatCurrency = (value: number) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen relative">
        <StarField />
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

        <div className="relative z-10 container mx-auto px-4 py-8">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div className="max-w-6xl mx-auto space-y-6">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-3xl">AI-Powered Term Sheet Analysis</CardTitle>
                <CardDescription>
                  Get expert-level analysis of your investment terms with AI-driven insights, 
                  negotiation strategies, and financial modeling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Paste your complete term sheet below
                  </label>
                  <Textarea
                    placeholder="SERIES A PREFERRED STOCK TERM SHEET

Company: [Company Name]
Amount: $5,000,000
Valuation: $20,000,000 pre-money

1. LIQUIDATION PREFERENCE
   1x non-participating preferred

2. DIVIDENDS
   Non-cumulative dividends at 8% per annum

3. ANTI-DILUTION PROVISIONS
   Broad-based weighted average anti-dilution

4. BOARD OF DIRECTORS
   5 members: 2 founders, 2 investors, 1 independent

...paste your complete term sheet here..."
                    value={termSheetText}
                    onChange={(e) => setTermSheetText(e.target.value)}
                    rows={16}
                    className="bg-background/50 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Tip: Include all key terms for the most comprehensive analysis
                  </p>
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={loading || !termSheetText.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Analyze Term Sheet
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {analysis && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="glass-card border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Overall Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary mb-2">
                        {analysis.overall_score}/10
                      </div>
                      <Progress value={analysis.overall_score * 10} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {analysis.deal_type && (
                          <Badge variant="outline" className="mt-1">
                            {analysis.deal_type.toUpperCase()}
                          </Badge>
                        )}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Investor Friendliness
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-orange-500 mb-2">
                        {analysis.investor_friendliness}/10
                      </div>
                      <Progress value={analysis.investor_friendliness * 10} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {analysis.investor_friendliness > 7 ? 'Very investor-friendly' :
                         analysis.investor_friendliness > 5 ? 'Balanced' : 'Founder-friendly'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Risk Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysis.red_flags?.length > 0 ? (
                          <>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-8 h-8 text-red-500" />
                              <div>
                                <div className="text-2xl font-bold text-red-500">
                                  {analysis.red_flags.length}
                                </div>
                                <div className="text-xs text-muted-foreground">Issues Found</div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Shield className="w-8 h-8 text-green-500" />
                            <div className="text-sm text-green-500">Clean Term Sheet</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-primary" />
                      Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{analysis.summary}</p>
                    {analysis.comparable_deals && (
                      <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <h4 className="font-semibold mb-2 text-sm">Market Comparison</h4>
                        <p className="text-sm text-muted-foreground">{analysis.comparable_deals}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Tabs defaultValue="terms" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="terms">Key Terms</TabsTrigger>
                    <TabsTrigger value="risks">Red Flags</TabsTrigger>
                    <TabsTrigger value="positives">Green Flags</TabsTrigger>
                    <TabsTrigger value="negotiation">Negotiation</TabsTrigger>
                    <TabsTrigger value="scenarios">Financial Impact</TabsTrigger>
                  </TabsList>

                  <TabsContent value="terms" className="mt-6">
                    <Card className="glass-card border-primary/20">
                      <CardHeader>
                        <CardTitle>Critical Terms Analysis</CardTitle>
                        <CardDescription>
                          Detailed breakdown of each key term and its implications
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {analysis.critical_terms?.map((term: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-lg bg-background/50 border border-border">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-lg">{term.term}</h4>
                                <p className="text-sm text-primary mt-1">{term.value}</p>
                              </div>
                              <Badge className={getRiskColor(term.risk_level)}>
                                {term.risk_level}
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Market Standard:</span>
                                <p className="text-sm mt-1">{term.market_standard}</p>
                              </div>

                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Impact Analysis:</span>
                                <p className="text-sm mt-1 text-muted-foreground">{term.analysis}</p>
                              </div>

                              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                                <span className="text-xs font-medium text-primary">Negotiation Advice:</span>
                                <p className="text-sm mt-1">{term.negotiation_advice}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="risks" className="mt-6">
                    <Card className="glass-card border-primary/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-500">
                          <AlertTriangle className="w-5 h-5" />
                          Red Flags & Concerns
                        </CardTitle>
                        <CardDescription>
                          Problematic clauses that require immediate attention
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {analysis.red_flags?.length > 0 ? (
                          analysis.red_flags.map((flag: any, idx: number) => (
                            <div key={idx} className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold">{flag.clause}</h4>
                                <Badge variant="destructive" className={getSeverityColor(flag.severity)}>
                                  {flag.severity}
                                </Badge>
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium text-red-400">Issue: </span>
                                  {flag.issue}
                                </div>
                                <div>
                                  <span className="font-medium text-orange-400">Potential Consequence: </span>
                                  {flag.consequence}
                                </div>
                                <div className="p-3 mt-2 rounded bg-background/50 border border-border">
                                  <span className="font-medium text-green-400">Solution: </span>
                                  {flag.solution}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <p className="text-green-500 font-semibold">No major red flags detected!</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              This term sheet appears to have standard market terms
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="positives" className="mt-6">
                    <Card className="glass-card border-primary/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-500">
                          <Shield className="w-5 h-5" />
                          Positive Aspects
                        </CardTitle>
                        <CardDescription>
                          Founder-friendly terms and competitive advantages
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysis.green_flags?.length > 0 ? (
                          analysis.green_flags.map((flag: string, idx: number) => (
                            <div key={idx} className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                              <p className="text-sm">{flag}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-4">
                            No specific green flags highlighted in this analysis
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="negotiation" className="mt-6">
                    <Card className="glass-card border-primary/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-primary" />
                          Negotiation Strategy
                        </CardTitle>
                        <CardDescription>
                          Priority-ordered action items for term sheet negotiation
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {analysis.negotiation_priorities?.length > 0 ? (
                          analysis.negotiation_priorities.map((priority: any, idx: number) => (
                            <div key={idx} className="p-4 rounded-lg bg-background/50 border border-border">
                              <div className="flex items-start gap-3">
                                <Badge variant="outline" className="mt-1">
                                  Priority {priority.priority}
                                </Badge>
                                <div className="flex-1">
                                  <h4 className="font-semibold mb-2">{priority.item}</h4>
                                  <div className="space-y-2 text-sm text-muted-foreground">
                                    <p><span className="font-medium text-foreground">Why:</span> {priority.rationale}</p>
                                    <div className="p-3 rounded bg-primary/10 border border-primary/20">
                                      <span className="font-medium text-primary">Approach:</span>{' '}
                                      {priority.suggested_approach}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-4">
                            No specific negotiation priorities identified
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="scenarios" className="mt-6">
                    <Card className="glass-card border-primary/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-primary" />
                          Financial Impact Modeling
                        </CardTitle>
                        <CardDescription>
                          How different exit scenarios affect your returns
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {analysis.financial_scenarios ? (
                          <div className="space-y-6">
                            {Object.entries(analysis.financial_scenarios).map(([scenario, data]: [string, any]) => (
                              <div key={scenario} className="p-4 rounded-lg bg-background/50 border border-border">
                                <h4 className="font-semibold mb-4 text-lg">
                                  {scenario.replace('exit_', '').replace('x', 'x Return Scenario')}
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Exit Value</div>
                                    <div className="text-lg font-bold text-primary">
                                      {formatCurrency(data.company_exit_value)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Investor Return</div>
                                    <div className="text-lg font-bold text-blue-500">
                                      {formatCurrency(data.investor_return)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Your Return</div>
                                    <div className="text-lg font-bold text-green-500">
                                      {formatCurrency(data.founder_return)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Your %</div>
                                    <div className="text-lg font-bold text-primary">
                                      {data.founder_percentage?.toFixed(2)}%
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-8">
                            Financial scenarios require valuation information in the term sheet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <Card className="glass-card border-primary/20 border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Final Recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-lg bg-primary/20 border border-primary">
                      <p className="text-foreground font-medium leading-relaxed">
                        {analysis.final_recommendation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default TermSheetChecker;
