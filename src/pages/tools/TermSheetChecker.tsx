import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, Loader2, AlertTriangle, Shield, TrendingUp, Target, DollarSign, Scale, FileText, Download, Lightbulb, Mail, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const EXAMPLE_TERM_SHEET = `SERIES A PREFERRED STOCK TERM SHEET

Company: TechStartup Inc.
Investment Amount: $5,000,000
Pre-Money Valuation: $20,000,000
Post-Money Valuation: $25,000,000

TERMS OF SERIES A PREFERRED STOCK

1. LIQUIDATION PREFERENCE
1x non-participating liquidation preference. In a liquidation event, Series A holders receive the greater of (i) their original investment amount or (ii) the amount they would receive on an as-converted basis.

2. DIVIDENDS
8% annual cumulative dividends, payable upon liquidation or redemption.

3. CONVERSION
Each share of Series A is convertible into Common Stock at the option of the holder at any time. Initial conversion ratio is 1:1, subject to adjustment for stock splits, combinations, and anti-dilution provisions.

4. ANTI-DILUTION PROVISIONS
Broad-based weighted average anti-dilution protection in case of down rounds.

5. VOTING RIGHTS
Series A votes together with Common on an as-converted basis. Series A has class voting rights on matters affecting Series A preferences.

6. PROTECTIVE PROVISIONS
Consent of 66% of Series A required for: (i) liquidation or sale of company, (ii) amendments to certificate of incorporation affecting Series A rights, (iii) authorization of new series of preferred stock senior to or pari passu with Series A, (iv) payment of dividends, (v) redemption or repurchase of stock (except per buy-back agreement), (vi) increase or decrease in authorized shares of Common or Preferred.

7. BOARD OF DIRECTORS
Board to consist of 7 members:
- 3 designated by Common stockholders
- 2 designated by Series A investors
- 2 independent directors mutually agreed upon

8. INFORMATION RIGHTS
Investors will receive standard information and inspection rights, including monthly unaudited and annual audited financials.

9. REGISTRATION RIGHTS
Demand Rights: After earlier of (i) 5 years or (ii) 6 months following IPO, holders of 30%+ of Series A may request registration.
Piggyback Rights: Series A holders have right to include shares in any registration.

10. RIGHT OF FIRST REFUSAL
Investors have pro-rata right to participate in future equity offerings to maintain ownership percentage.

11. DRAG-ALONG
Common stockholders agree to vote in favor of a sale of the company if approved by Board and holders of 66% of Preferred.

12. NO-SHOP / EXCLUSIVITY
60-day exclusivity period during term sheet negotiations and due diligence.

13. EMPLOYEE OPTION POOL
15% option pool (post-financing) for employee equity incentives.

14. FOUNDER VESTING
Founder shares subject to 4-year vesting with 1-year cliff, with 50% credit for time served.

15. EXPENSES
Company to pay reasonable legal fees and expenses of investors up to $50,000.`;

const TermSheetChecker = () => {
  const navigate = useNavigate();
  const [termSheetText, setTermSheetText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);

  const loadExample = () => {
    setTermSheetText(EXAMPLE_TERM_SHEET);
    toast.success('Example term sheet loaded - click Analyze to see AI analysis');
  };

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

  const COLORS = ['#22d3ee', '#06b6d4', '#0891b2', '#0e7490'];

  // Prepare chart data
  const riskDistribution = analysis?.critical_terms?.reduce((acc: any, term: any) => {
    const risk = term.risk_level || 'Unknown';
    acc[risk] = (acc[risk] || 0) + 1;
    return acc;
  }, {});

  const riskChartData = riskDistribution ? Object.entries(riskDistribution).map(([name, value]) => ({
    name,
    value,
  })) : [];

  const exitScenarios = analysis?.financial_scenarios ? 
    Object.entries(analysis.financial_scenarios).map(([scenario, data]: [string, any]) => ({
      name: scenario.replace('exit_', '').replace('x', 'x'),
      'Your Return': data.founder_return || 0,
      'Investor Return': data.investor_return || 0,
    })) : [];

  // Radar chart for term sheet scoring
  const termScoring = analysis?.critical_terms ? [
    { category: 'Economics', score: analysis.overall_score * 10 },
    { category: 'Control', score: (10 - analysis.investor_friendliness) * 10 },
    { category: 'Liquidation', score: 85 },
    { category: 'Governance', score: 75 },
    { category: 'Dilution Protection', score: 80 },
  ] : [];

  const generateNegotiationEmail = (priority: any) => {
    return `Subject: Discussion on ${priority.item}

Dear [Investor Name],

Thank you for the term sheet. I'm excited about the potential partnership and have been reviewing the terms in detail.

I'd like to discuss the ${priority.item}. ${priority.rationale}

${priority.suggested_approach}

I believe this adjustment would create a more balanced partnership while still providing strong protections for your investment. I'm happy to discuss this further at your convenience.

Best regards,
[Your Name]`;
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

          <div className="max-w-7xl mx-auto space-y-6">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">AI-Powered Term Sheet Analysis</CardTitle>
                    <CardDescription>
                      Expert-level analysis powered by AI trained on 1000s of term sheets. Get instant insights,
                      negotiation strategies, and financial modeling.
                    </CardDescription>
                  </div>
                  <Button onClick={loadExample} variant="outline" size="sm" className="gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Load Example
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">
                      Paste your complete term sheet below
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {termSheetText.length} characters
                    </span>
                  </div>
                  <Textarea
                    placeholder="SERIES A PREFERRED STOCK TERM SHEET

Company: [Company Name]
Amount: $5,000,000
Pre-Money Valuation: $20,000,000

1. LIQUIDATION PREFERENCE
2. DIVIDENDS
3. ANTI-DILUTION PROVISIONS
...

Click 'Load Example' to see a sample term sheet"
                    value={termSheetText}
                    onChange={(e) => setTermSheetText(e.target.value)}
                    rows={12}
                    className="bg-background/50 font-mono text-sm resize-none"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        💡 <strong>Pro tip:</strong> Include all sections for comprehensive analysis: valuation, liquidation preference,
                        anti-dilution, board composition, voting rights, and protective provisions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAnalyze}
                    disabled={loading || !termSheetText.trim()}
                    className="flex-1"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        AI Analyzing Term Sheet...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                  
                  {analysis && (
                    <Button variant="outline" size="lg" className="gap-2">
                      <Download className="w-4 h-4" />
                      Export PDF
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {analysis && (
              <div className="space-y-6">
                {/* Executive Summary */}
                <Card className="glass-card p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    Executive Summary
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-6">{analysis.summary}</p>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-background/50 rounded-lg backdrop-blur">
                      <div className="text-4xl font-bold text-primary mb-1">
                        {analysis.overall_score}/10
                      </div>
                      <div className="text-sm text-muted-foreground">Overall Score</div>
                    </div>
                    <div className="text-center p-4 bg-background/50 rounded-lg backdrop-blur">
                      <div className="text-4xl font-bold text-destructive mb-1">
                        {analysis.red_flags?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Critical Issues</div>
                    </div>
                    <div className="text-center p-4 bg-background/50 rounded-lg backdrop-blur">
                      <div className="text-4xl font-bold text-orange-500 mb-1">
                        {analysis.investor_friendliness}/10
                      </div>
                      <div className="text-sm text-muted-foreground">Investor Bias</div>
                    </div>
                    <div className="text-center p-4 bg-background/50 rounded-lg backdrop-blur">
                      <div className="text-4xl font-bold text-blue-500 mb-1">
                        {analysis.critical_terms?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Terms Analyzed</div>
                    </div>
                  </div>
                </Card>

                {/* Critical Issues Section */}
                {analysis.red_flags && analysis.red_flags.length > 0 && (
                  <Card className="glass-card p-6 border-destructive/50 bg-destructive/5">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-6 h-6" />
                      Critical Issues Requiring Immediate Attention
                    </h2>
                    <div className="space-y-4">
                      {analysis.red_flags.map((flag: any, index: number) => (
                        <Card key={index} className="p-5 bg-background border-destructive/20">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-sm">
                                  {index + 1}
                                </span>
                                {flag.clause}
                              </h3>
                              <Badge variant="destructive">
                                {flag.severity}
                              </Badge>
                            </div>
                            <div className="pl-8 space-y-3">
                              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                <h4 className="text-sm font-semibold mb-1 flex items-center gap-2 text-destructive">
                                  <AlertTriangle className="w-4 h-4" />
                                  The Issue
                                </h4>
                                <p className="text-sm text-muted-foreground">{flag.issue}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <h4 className="text-sm font-semibold mb-1 flex items-center gap-2 text-orange-500">
                                  <AlertCircle className="w-4 h-4" />
                                  Potential Consequence
                                </h4>
                                <p className="text-sm text-muted-foreground">{flag.consequence}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                <h4 className="text-sm font-semibold mb-1 flex items-center gap-2 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  Recommended Solution
                                </h4>
                                <p className="text-sm text-muted-foreground">{flag.solution}</p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Areas to Improve */}
                {analysis.critical_terms && analysis.critical_terms.filter((t: any) => t.risk_level === 'Medium' || t.risk_level === 'High').length > 0 && (
                  <Card className="glass-card p-6 border-yellow-500/50 bg-yellow-500/5">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="w-6 h-6" />
                      Areas for Improvement
                    </h2>
                    <div className="space-y-3">
                      {analysis.critical_terms
                        .filter((term: any) => term.risk_level === 'Medium' || term.risk_level === 'High')
                        .map((term: any, index: number) => (
                          <Card key={index} className="p-5 bg-background">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="font-semibold text-lg">{term.term}</h3>
                                  <Badge variant={term.risk_level === 'High' ? 'destructive' : 'default'}>
                                    {term.risk_level} risk
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-sm font-medium">Current Value:</span>
                                    <p className="text-sm text-muted-foreground">{term.value}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium">Market Standard:</span>
                                    <p className="text-sm text-muted-foreground">{term.market_standard}</p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Impact & Recommendation</h4>
                                <p className="text-sm text-muted-foreground mb-3">{term.analysis}</p>
                                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                                  <p className="text-sm">{term.negotiation_advice}</p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </Card>
                )}

                {/* Strong Points */}
                {analysis.green_flags && analysis.green_flags.length > 0 && (
                  <Card className="glass-card p-6 border-green-500/50 bg-green-500/5">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-6 h-6" />
                      Strong Points & Favorable Terms
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {analysis.green_flags.map((flag: string, index: number) => (
                        <Card key={index} className="p-4 bg-background flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{flag}</p>
                        </Card>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Detailed Term Analysis */}
                <Card className="glass-card p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Detailed Term Analysis
                  </h2>
                  <Accordion type="single" collapsible className="w-full">
                    {analysis.critical_terms?.map((term: any, index: number) => (
                      <AccordionItem key={index} value={`term-${index}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <Badge className={getRiskColor(term.risk_level)}>
                                {term.risk_level}
                              </Badge>
                              <span className="font-semibold">{term.term}</span>
                            </div>
                            <span className="text-sm text-primary">{term.value}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-background/50 border">
                              <h4 className="font-semibold mb-2">Market Standard</h4>
                              <p className="text-sm text-muted-foreground">{term.market_standard}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-background/50 border">
                              <h4 className="font-semibold mb-2">Impact Analysis</h4>
                              <p className="text-sm text-muted-foreground">{term.analysis}</p>
                            </div>
                          </div>
                          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-primary">
                              <Target className="w-4 h-4" />
                              Negotiation Advice
                            </h4>
                            <p className="text-sm">{term.negotiation_advice}</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>

                {/* Negotiation Strategy */}
                <Card className="glass-card p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Target className="w-6 h-6" />
                    Negotiation Strategy & Action Plan
                  </h2>
                  {analysis.negotiation_priorities && analysis.negotiation_priorities.length > 0 ? (
                    <div className="space-y-4">
                      {analysis.negotiation_priorities.map((priority: any, index: number) => (
                        <Card key={index} className="p-5 bg-background">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-lg flex items-center gap-3">
                              <Badge variant="default" className="text-lg px-3 py-1">
                                #{priority.priority}
                              </Badge>
                              {priority.item}
                            </h3>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => {
                                const email = generateNegotiationEmail(priority);
                                navigator.clipboard.writeText(email);
                                toast.success('Email template copied to clipboard!');
                              }}
                            >
                              <Copy className="w-4 h-4" />
                              Copy Email
                            </Button>
                          </div>
                          <div className="space-y-3 pl-12">
                            <div className="p-3 rounded-lg bg-background/50 border">
                              <h4 className="text-sm font-medium mb-1 text-muted-foreground">Why This Matters</h4>
                              <p className="text-sm">{priority.rationale}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                              <h4 className="text-sm font-medium mb-1 text-primary">Suggested Approach</h4>
                              <p className="text-sm">{priority.suggested_approach}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No specific negotiation priorities identified.</p>
                  )}
                </Card>

                {/* Financial Impact */}
                <Card className="glass-card p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <DollarSign className="w-6 h-6" />
                    Financial Impact Analysis
                  </h2>
                  {analysis.financial_scenarios && exitScenarios.length > 0 ? (
                    <div className="space-y-6">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={exitScenarios}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="name" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                            formatter={(value: any) => formatCurrency(value)}
                          />
                          <Legend />
                          <Bar dataKey="Your Return" fill="#22d3ee" />
                          <Bar dataKey="Investor Return" fill="#06b6d4" />
                        </BarChart>
                      </ResponsiveContainer>

                      <div className="grid md:grid-cols-3 gap-4">
                        {Object.entries(analysis.financial_scenarios).map(([scenario, data]: [string, any]) => (
                          <Card key={scenario} className="p-4 bg-muted/50">
                            <h4 className="font-semibold mb-3 capitalize text-center">
                              {scenario.replace('exit_', '').replace('x', 'x Exit')}
                            </h4>
                            <div className="space-y-3">
                              <div className="text-center pb-2 border-b">
                                <div className="text-xs text-muted-foreground mb-1">Company Value</div>
                                <div className="text-xl font-bold text-primary">{formatCurrency(data.company_exit_value)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground mb-1">Your Return</div>
                                <div className="text-2xl font-bold text-green-500">{formatCurrency(data.founder_return)}</div>
                                <div className="text-xs text-muted-foreground mt-1">{data.founder_percentage?.toFixed(2)}% ownership</div>
                              </div>
                              <div className="text-center pt-2 border-t">
                                <div className="text-xs text-muted-foreground mb-1">Investor Return</div>
                                <div className="text-xl font-bold text-blue-500">{formatCurrency(data.investor_return)}</div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No financial scenarios available.</p>
                  )}
                </Card>

                {/* Final Recommendation */}
                <Card className="glass-card border-primary/20 border-2 bg-primary/5 p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    Final Recommendation
                  </h2>
                  <div className="p-6 rounded-lg bg-primary/20 border border-primary">
                    <p className="text-lg font-medium leading-relaxed">
                      {analysis.final_recommendation}
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default TermSheetChecker;
