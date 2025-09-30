import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, Loader2, AlertTriangle, Shield, TrendingUp, Target, DollarSign, Scale, FileText, Download, Lightbulb, Mail } from 'lucide-react';
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
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="glass-card border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Scale className="w-4 h-4" />
                        Overall Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary mb-2">
                        {analysis.overall_score}/10
                      </div>
                      <Progress value={analysis.overall_score * 10} className="h-2 mb-2" />
                      <Badge variant="outline" className="text-xs">
                        {analysis.deal_type?.toUpperCase() || 'TERM SHEET'}
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Investor Bias
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-orange-500 mb-2">
                        {analysis.investor_friendliness}/10
                      </div>
                      <Progress value={analysis.investor_friendliness * 10} className="h-2 mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {analysis.investor_friendliness > 7 ? 'Very investor-friendly' :
                         analysis.investor_friendliness > 5 ? 'Balanced' : 'Founder-friendly'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Issues Found
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-red-500 mb-2">
                        {analysis.red_flags?.length || 0}
                      </div>
                      <Progress value={Math.min((analysis.red_flags?.length || 0) * 20, 100)} className="h-2 mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {analysis.red_flags?.length === 0 ? 'Clean term sheet' : 'Requires attention'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Action Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary mb-2">
                        {analysis.negotiation_priorities?.length || 0}
                      </div>
                      <Progress value={Math.min((analysis.negotiation_priorities?.length || 0) * 20, 100)} className="h-2 mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Negotiation priorities
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="glass-card border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Risk Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={riskChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {riskChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Term Sheet Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <RadarChart data={termScoring}>
                          <PolarGrid stroke="#334155" />
                          <PolarAngleAxis dataKey="category" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#334155" tick={{ fill: '#94a3b8' }} />
                          <Radar name="Score" dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.5} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed text-lg">{analysis.summary}</p>
                    {analysis.comparable_deals && (
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Market Comparison
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{analysis.comparable_deals}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Tabs defaultValue="terms" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="terms">Key Terms</TabsTrigger>
                    <TabsTrigger value="risks">
                      Red Flags
                      {analysis.red_flags?.length > 0 && (
                        <Badge variant="destructive" className="ml-2">{analysis.red_flags.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="positives">Green Flags</TabsTrigger>
                    <TabsTrigger value="negotiation">Strategy</TabsTrigger>
                    <TabsTrigger value="scenarios">Financial Impact</TabsTrigger>
                  </TabsList>

                  <TabsContent value="terms" className="mt-6 space-y-4">
                    <Card className="glass-card border-primary/20">
                      <CardHeader>
                        <CardTitle>Critical Terms Deep Dive</CardTitle>
                        <CardDescription>
                          Click each term for detailed analysis and negotiation advice
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                          {analysis.critical_terms?.map((term: any, idx: number) => (
                            <AccordionItem key={idx} value={`term-${idx}`} className="border-border">
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <div className="flex items-center gap-3">
                                    <Badge className={getRiskColor(term.risk_level)}>
                                      {term.risk_level}
                                    </Badge>
                                    <span className="font-semibold text-left">{term.term}</span>
                                  </div>
                                  <span className="text-sm text-primary">{term.value}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4 pt-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-lg bg-background/50 border border-border">
                                      <h5 className="text-xs font-medium text-muted-foreground mb-2">📊 Market Standard</h5>
                                      <p className="text-sm">{term.market_standard}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-background/50 border border-border">
                                      <h5 className="text-xs font-medium text-muted-foreground mb-2">📈 Impact Analysis</h5>
                                      <p className="text-sm text-muted-foreground">{term.analysis}</p>
                                    </div>
                                  </div>
                                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                                    <h5 className="text-xs font-medium text-primary mb-2 flex items-center gap-2">
                                      <Target className="w-4 h-4" />
                                      Negotiation Advice
                                    </h5>
                                    <p className="text-sm">{term.negotiation_advice}</p>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="risks" className="mt-6 space-y-4">
                    {analysis.red_flags?.length > 0 ? (
                      analysis.red_flags.map((flag: any, idx: number) => (
                        <Card key={idx} className="glass-card border-red-500/30">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                {flag.clause}
                              </CardTitle>
                              <Badge className={`${getSeverityColor(flag.severity)} border`}>
                                {flag.severity}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                              <h5 className="text-sm font-semibold text-red-400 mb-1">⚠️ Issue</h5>
                              <p className="text-sm">{flag.issue}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                              <h5 className="text-sm font-semibold text-orange-400 mb-1">💥 Potential Consequence</h5>
                              <p className="text-sm">{flag.consequence}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                              <h5 className="text-sm font-semibold text-green-400 mb-1">✅ Recommended Solution</h5>
                              <p className="text-sm">{flag.solution}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card className="glass-card border-green-500/30">
                        <CardContent className="text-center py-12">
                          <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
                          <h3 className="text-2xl font-bold text-green-500 mb-2">No Major Red Flags!</h3>
                          <p className="text-muted-foreground">
                            This term sheet appears to have standard market terms with no critical issues.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="positives" className="mt-6">
                    <Card className="glass-card border-green-500/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-500">
                          <Shield className="w-5 h-5" />
                          Founder-Friendly Terms
                        </CardTitle>
                        <CardDescription>
                          Positive aspects that work in your favor
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysis.green_flags?.length > 0 ? (
                          analysis.green_flags.map((flag: string, idx: number) => (
                            <div key={idx} className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-green-500 text-sm font-bold">✓</span>
                              </div>
                              <p className="text-sm flex-1">{flag}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-8">
                            No specific green flags identified in this analysis
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="negotiation" className="mt-6 space-y-4">
                    {analysis.negotiation_priorities?.map((priority: any, idx: number) => (
                      <Card key={idx} className="glass-card border-primary/20">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="flex items-center gap-3">
                              <Badge variant="default" className="text-lg px-3 py-1">
                                #{priority.priority}
                              </Badge>
                              <span>{priority.item}</span>
                            </CardTitle>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Mail className="w-4 h-4" />
                                  Email Template
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Negotiation Email Template</DialogTitle>
                                  <DialogDescription>
                                    Pre-written email to start the conversation
                                  </DialogDescription>
                                </DialogHeader>
                                <Textarea
                                  value={generateNegotiationEmail(priority)}
                                  rows={12}
                                  className="font-mono text-sm"
                                  readOnly
                                />
                                <Button onClick={() => {
                                  navigator.clipboard.writeText(generateNegotiationEmail(priority));
                                  toast.success('Email template copied to clipboard!');
                                }}>
                                  Copy to Clipboard
                                </Button>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="p-4 rounded-lg bg-background/50 border border-border">
                            <h5 className="text-sm font-medium mb-2 text-muted-foreground">Why This Matters</h5>
                            <p className="text-sm">{priority.rationale}</p>
                          </div>
                          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                            <h5 className="text-sm font-medium mb-2 text-primary">Suggested Approach</h5>
                            <p className="text-sm">{priority.suggested_approach}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="scenarios" className="mt-6 space-y-6">
                    {analysis.financial_scenarios && exitScenarios.length > 0 && (
                      <>
                        <Card className="glass-card border-primary/20">
                          <CardHeader>
                            <CardTitle>Exit Scenario Comparison</CardTitle>
                            <CardDescription>
                              How your returns compare to investors across different outcomes
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
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
                          </CardContent>
                        </Card>

                        {Object.entries(analysis.financial_scenarios).map(([scenario, data]: [string, any]) => (
                          <Card key={scenario} className="glass-card border-primary/20">
                            <CardHeader>
                              <CardTitle className="text-lg">
                                {scenario.replace('exit_', '').replace('x', 'x Return')} Exit Scenario
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-lg bg-background/50 border border-border">
                                  <div className="text-xs text-muted-foreground mb-1">Company Exit Value</div>
                                  <div className="text-xl font-bold text-primary">
                                    {formatCurrency(data.company_exit_value)}
                                  </div>
                                </div>
                                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                  <div className="text-xs text-muted-foreground mb-1">Investor Return</div>
                                  <div className="text-xl font-bold text-blue-500">
                                    {formatCurrency(data.investor_return)}
                                  </div>
                                </div>
                                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                                  <div className="text-xs text-muted-foreground mb-1">Your Return</div>
                                  <div className="text-xl font-bold text-green-500">
                                    {formatCurrency(data.founder_return)}
                                  </div>
                                </div>
                                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                                  <div className="text-xs text-muted-foreground mb-1">Your Ownership</div>
                                  <div className="text-xl font-bold text-primary">
                                    {data.founder_percentage?.toFixed(2)}%
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    )}
                  </TabsContent>
                </Tabs>

                <Card className="glass-card border-primary/20 border-2 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-primary" />
                      Final Recommendation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-6 rounded-lg bg-primary/20 border border-primary">
                      <p className="text-lg font-medium leading-relaxed">
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
