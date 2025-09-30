import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, Loader2, AlertTriangle, Shield, TrendingUp, Target, DollarSign, Scale, FileText, Download, Lightbulb, Mail, CheckCircle, AlertCircle, Copy, ArrowUpRight, Sparkles } from 'lucide-react';
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
      <div className="min-h-screen relative bg-gradient-to-b from-[#1a2947] via-[#0f1729] to-background">
        <StarField />
        
        {/* Cyan Banner */}
        <div className="relative z-10 bg-cyan-400 text-gray-900 py-4 text-center font-medium">
          AI-Powered Term Sheet Analysis • Launched 2025
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12 max-w-7xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-8 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* Input Section */}
          <div className="mb-8">
            <div className="text-sm text-cyan-400 mb-2 uppercase tracking-wider">Analysis Tool</div>
            <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
              Analyze term sheets with AI-powered insights for smarter negotiation decisions.
            </h1>
            
            <Card className="bg-white/5 backdrop-blur border-white/10">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-medium text-gray-300">
                    Paste your term sheet below
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{termSheetText.length} characters</span>
                    <Button onClick={loadExample} variant="outline" size="sm" className="gap-2 border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10">
                      <Sparkles className="w-4 h-4" />
                      Load Example
                    </Button>
                  </div>
                </div>
                <Textarea
                  placeholder="SERIES A PREFERRED STOCK TERM SHEET

Company: [Company Name]
Amount: $5,000,000
Pre-Money Valuation: $20,000,000

1. LIQUIDATION PREFERENCE
2. DIVIDENDS
..."
                  value={termSheetText}
                  onChange={(e) => setTermSheetText(e.target.value)}
                  rows={10}
                  className="bg-black/20 border-white/10 text-white placeholder:text-gray-600 font-mono text-sm resize-none"
                />
                
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={handleAnalyze}
                    disabled={loading || !termSheetText.trim()}
                    className="flex-1 bg-cyan-400 hover:bg-cyan-500 text-gray-900 font-semibold"
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
                  
                  {analysis && (
                    <Button variant="outline" size="lg" className="gap-2 border-white/20 text-gray-300 hover:bg-white/5">
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-8 bg-white rounded-lg p-8">
              {/* Executive Summary Card */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <div className="text-sm text-gray-500 mb-2 uppercase tracking-wider">Executive Summary</div>
                <h2 className="text-4xl font-bold mb-6 text-gray-900">
                  {analysis.summary}
                </h2>
                
                <div className="flex items-center gap-3 mb-8">
                  <Badge className="bg-cyan-400 text-gray-900 hover:bg-cyan-500 rounded-full px-4 py-1">
                    {analysis.deal_type}
                  </Badge>
                  <Badge className="bg-cyan-400 text-gray-900 hover:bg-cyan-500 rounded-full px-4 py-1">
                    Score: {analysis.overall_score}/10
                  </Badge>
                  <ArrowUpRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-900 mb-1">
                      {analysis.overall_score}<span className="text-2xl text-gray-400">/10</span>
                    </div>
                    <div className="text-sm text-gray-500">Overall Quality</div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-red-500 mb-1">
                      {analysis.red_flags?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Critical Issues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-orange-500 mb-1">
                      {analysis.investor_friendliness}<span className="text-2xl text-gray-400">/10</span>
                    </div>
                    <div className="text-sm text-gray-500">Investor Bias</div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-900 mb-1">
                      {analysis.critical_terms?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Terms Analyzed</div>
                  </div>
                </div>
              </div>

              {/* Critical Issues */}
              {analysis.red_flags && analysis.red_flags.length > 0 && (
                <div className="border-2 border-dashed border-red-200 rounded-lg p-8 bg-red-50/50">
                  <div className="flex items-center gap-3 mb-6">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <div>
                      <div className="text-sm text-gray-500 uppercase tracking-wider">Critical Issues</div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        {analysis.red_flags.length} item{analysis.red_flags.length !== 1 ? 's' : ''} requiring immediate attention
                      </h2>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {analysis.red_flags.map((flag: any, index: number) => (
                      <div key={index} className="bg-white rounded-lg p-6 border border-red-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white text-sm font-bold">
                              {index + 1}
                            </span>
                            <h3 className="font-bold text-xl text-gray-900">{flag.clause}</h3>
                          </div>
                          <Badge variant="destructive" className="rounded-full">
                            {flag.severity}
                          </Badge>
                        </div>
                        
                        <div className="ml-11 space-y-4">
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="text-xs font-semibold text-red-600 mb-2 uppercase tracking-wider">The Issue</div>
                            <p className="text-sm text-gray-700">{flag.issue}</p>
                          </div>
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="text-xs font-semibold text-orange-600 mb-2 uppercase tracking-wider">Consequence</div>
                            <p className="text-sm text-gray-700">{flag.consequence}</p>
                          </div>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="text-xs font-semibold text-green-600 mb-2 uppercase tracking-wider">Solution</div>
                            <p className="text-sm text-gray-700">{flag.solution}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas to Improve */}
              {analysis.critical_terms && analysis.critical_terms.filter((t: any) => t.risk_level === 'Medium' || t.risk_level === 'High').length > 0 && (
                <div className="border-2 border-dashed border-yellow-200 rounded-lg p-8 bg-yellow-50/50">
                  <div className="flex items-center gap-3 mb-6">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                    <div>
                      <div className="text-sm text-gray-500 uppercase tracking-wider">Areas to Improve</div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        Terms that need negotiation
                      </h2>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {analysis.critical_terms
                      .filter((term: any) => term.risk_level === 'Medium' || term.risk_level === 'High')
                      .map((term: any, index: number) => (
                        <div key={index} className="bg-white rounded-lg p-6 border border-yellow-200">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-xl text-gray-900">{term.term}</h3>
                            <Badge variant={term.risk_level === 'High' ? 'destructive' : 'default'} className="rounded-full">
                              {term.risk_level} risk
                            </Badge>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Current Value</div>
                              <p className="text-sm text-gray-700 mb-4">{term.value}</p>
                              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Market Standard</div>
                              <p className="text-sm text-gray-700">{term.market_standard}</p>
                            </div>
                            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                              <div className="text-xs font-semibold text-cyan-700 mb-2 uppercase tracking-wider">Recommendation</div>
                              <p className="text-sm text-gray-700">{term.negotiation_advice}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Strong Points */}
              {analysis.green_flags && analysis.green_flags.length > 0 && (
                <div className="border-2 border-dashed border-green-200 rounded-lg p-8 bg-green-50/50">
                  <div className="flex items-center gap-3 mb-6">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <div className="text-sm text-gray-500 uppercase tracking-wider">Strong Points</div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        Favorable terms in your agreement
                      </h2>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {analysis.green_flags.map((flag: string, index: number) => (
                      <div key={index} className="bg-white rounded-lg p-5 border border-green-200 flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700">{flag}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Analysis */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wider">Detailed Analysis</div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      Complete term breakdown
                    </h2>
                  </div>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {analysis.critical_terms?.map((term: any, index: number) => (
                    <AccordionItem key={index} value={`term-${index}`} className="border-gray-200">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <Badge className={`${getRiskColor(term.risk_level)} rounded-full`}>
                              {term.risk_level}
                            </Badge>
                            <span className="font-semibold text-gray-900">{term.term}</span>
                          </div>
                          <span className="text-sm text-gray-600 font-mono">{term.value}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 pb-6">
                        <div className="grid md:grid-cols-2 gap-4 ml-4">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Market Standard</div>
                            <p className="text-sm text-gray-700">{term.market_standard}</p>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Impact Analysis</div>
                            <p className="text-sm text-gray-700">{term.analysis}</p>
                          </div>
                        </div>
                        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 ml-4 mt-4">
                          <div className="text-xs font-semibold text-cyan-700 mb-2 uppercase tracking-wider flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Negotiation Advice
                          </div>
                          <p className="text-sm text-gray-700">{term.negotiation_advice}</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Negotiation Strategy */}
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-8 bg-blue-50/50">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wider">Negotiation Strategy</div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      Action plan & talking points
                    </h2>
                  </div>
                </div>
                
                {analysis.negotiation_priorities && analysis.negotiation_priorities.length > 0 ? (
                  <div className="space-y-4">
                    {analysis.negotiation_priorities.map((priority: any, index: number) => (
                      <div key={index} className="bg-white rounded-lg p-6 border border-blue-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-blue-500 text-white hover:bg-blue-600 rounded-full text-base px-4 py-1">
                              #{priority.priority}
                            </Badge>
                            <h3 className="font-bold text-xl text-gray-900">{priority.item}</h3>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                            onClick={() => {
                              const email = generateNegotiationEmail(priority);
                              navigator.clipboard.writeText(email);
                              toast.success('Email template copied!');
                            }}
                          >
                            <Copy className="w-4 h-4" />
                            Copy Email
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Why This Matters</div>
                            <p className="text-sm text-gray-700">{priority.rationale}</p>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wider">Suggested Approach</div>
                            <p className="text-sm text-gray-700">{priority.suggested_approach}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No specific negotiation priorities identified.</p>
                )}
              </div>

              {/* Financial Impact */}
              {analysis.financial_scenarios && exitScenarios.length > 0 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <DollarSign className="w-6 h-6 text-gray-600" />
                    <div>
                      <div className="text-sm text-gray-500 uppercase tracking-wider">Financial Impact</div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        Exit scenario modeling
                      </h2>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={exitScenarios}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          formatter={(value: any) => formatCurrency(value)}
                        />
                        <Bar dataKey="Your Return" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="Investor Return" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {Object.entries(analysis.financial_scenarios).map(([scenario, data]: [string, any]) => (
                      <div key={scenario} className="bg-white rounded-lg p-6 border border-gray-200">
                        <div className="text-center mb-4">
                          <h4 className="font-bold text-lg text-gray-900 mb-1 capitalize">
                            {scenario.replace('exit_', '').replace('x', 'x Exit')}
                          </h4>
                          <div className="text-3xl font-bold text-gray-900">{formatCurrency(data.company_exit_value)}</div>
                          <div className="text-xs text-gray-500">Company Value</div>
                        </div>
                        
                        <div className="space-y-3 pt-4 border-t border-gray-200">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Your Return</span>
                            <span className="text-sm font-bold text-green-600">{formatCurrency(data.founder_return)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Your Ownership</span>
                            <span className="text-sm font-bold text-gray-900">{data.founder_percentage?.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-100">
                            <span className="text-sm text-gray-600">Investor Return</span>
                            <span className="text-sm font-bold text-blue-600">{formatCurrency(data.investor_return)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Recommendation */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gradient-to-br from-cyan-50 to-blue-50">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wider">Final Recommendation</div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      Our verdict
                    </h2>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <p className="text-lg leading-relaxed text-gray-700">
                    {analysis.final_recommendation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default TermSheetChecker;
