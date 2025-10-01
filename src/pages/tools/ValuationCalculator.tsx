import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, DollarSign, TrendingUp, Calculator, Building2, Target, Info, BookOpen, Lightbulb, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';

const ValuationCalculator = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState('revenue-multiple');
  const [activeTab, setActiveTab] = useState('calculator');
  
  // Revenue Multiple Method
  const [revenue, setRevenue] = useState('');
  const [growthRate, setGrowthRate] = useState('');
  const [industry, setIndustry] = useState('SaaS');
  const [profitMargin, setProfitMargin] = useState('');
  
  // DCF Method
  const [projectedRevenue, setProjectedRevenue] = useState(['', '', '', '', '']);
  const [discountRate, setDiscountRate] = useState('15');
  const [terminalGrowthRate, setTerminalGrowthRate] = useState('3');
  const [ebitdaMargin, setEbitdaMargin] = useState('20');
  
  // Comparable Method
  const [comparableValuations, setComparableValuations] = useState('');
  const [comparableRevenue, setComparableRevenue] = useState('');
  const [yourRevenue, setYourRevenue] = useState('');
  
  // VC Method
  const [exitValuation, setExitValuation] = useState('');
  const [yearsToExit, setYearsToExit] = useState('5');
  const [targetReturn, setTargetReturn] = useState('10');
  const [investmentAmount, setInvestmentAmount] = useState('');

  const industryMultiples: Record<string, { low: number; mid: number; high: number }> = {
    'SaaS': { low: 6, mid: 10, high: 15 },
    'Marketplace': { low: 3, mid: 5, high: 8 },
    'E-commerce': { low: 1.5, mid: 2.5, high: 4 },
    'FinTech': { low: 4, mid: 7, high: 12 },
    'HealthTech': { low: 5, mid: 8, high: 13 },
  };

  const calculateRevenueMultiple = () => {
    const rev = parseFloat(revenue);
    const growth = parseFloat(growthRate);
    const margin = parseFloat(profitMargin);
    if (!rev) return null;

    const baseMultiple = industryMultiples[industry];
    let adjustedMultiple = baseMultiple.mid;

    // Adjust for growth rate
    if (growth > 100) adjustedMultiple = baseMultiple.high;
    else if (growth > 50) adjustedMultiple = (baseMultiple.mid + baseMultiple.high) / 2;
    else if (growth < 20) adjustedMultiple = (baseMultiple.low + baseMultiple.mid) / 2;

    // Further adjust for profitability if provided
    if (!isNaN(margin)) {
      if (margin > 20) adjustedMultiple *= 1.2;
      else if (margin < 0) adjustedMultiple *= 0.8;
    }

    const lowVal = rev * baseMultiple.low;
    const midVal = rev * adjustedMultiple;
    const highVal = rev * baseMultiple.high;

    return {
      low: lowVal.toFixed(0),
      mid: midVal.toFixed(0),
      high: highVal.toFixed(0),
      multiple: adjustedMultiple.toFixed(1),
      insights: [
        `${industry} companies typically trade at ${baseMultiple.low}-${baseMultiple.high}x revenue`,
        growth > 50 ? 'High growth rate increases valuation multiple' : 'Growth rate is within normal range',
        margin && margin > 20 ? 'Strong profitability adds premium to valuation' : margin && margin < 0 ? 'Negative margins reduce valuation multiple' : '',
      ].filter(Boolean),
    };
  };

  const calculateDCF = () => {
    const revenues = projectedRevenue.map(r => parseFloat(r)).filter(r => !isNaN(r));
    if (revenues.length === 0) return null;

    const discount = parseFloat(discountRate) / 100;
    const terminalGrowth = parseFloat(terminalGrowthRate) / 100;
    const margin = parseFloat(ebitdaMargin) / 100;

    // Calculate EBITDA from revenues
    const ebitdas = revenues.map(rev => rev * margin);

    // Calculate PV of projected EBITDA
    const pvEbitdas = ebitdas.map((ebitda, i) => ebitda / Math.pow(1 + discount, i + 1));
    const sumPV = pvEbitdas.reduce((sum, pv) => sum + pv, 0);

    // Terminal value using Gordon Growth Model
    const terminalEbitda = ebitdas[ebitdas.length - 1] * (1 + terminalGrowth);
    const terminalValue = terminalEbitda / (discount - terminalGrowth);
    const pvTerminal = terminalValue / Math.pow(1 + discount, revenues.length);

    const enterpriseValue = sumPV + pvTerminal;

    return {
      enterpriseValue: enterpriseValue.toFixed(0),
      pvCashFlows: sumPV.toFixed(0),
      pvTerminal: pvTerminal.toFixed(0),
      terminalValuePercent: ((pvTerminal / enterpriseValue) * 100).toFixed(0),
      insights: [
        `Terminal value represents ${((pvTerminal / enterpriseValue) * 100).toFixed(0)}% of total valuation`,
        discount > 0.2 ? 'High discount rate reflects higher risk' : 'Discount rate is moderate',
        terminalGrowth > 0.05 ? 'Terminal growth rate seems optimistic' : 'Conservative terminal growth assumption',
      ],
    };
  };

  const calculateComparable = () => {
    const compVal = parseFloat(comparableValuations);
    const compRev = parseFloat(comparableRevenue);
    const yourRev = parseFloat(yourRevenue);
    if (!compVal || !compRev || !yourRev) return null;

    const impliedMultiple = compVal / compRev;
    const yourValuation = yourRev * impliedMultiple;
    
    const confidenceLow = yourValuation * 0.8;
    const confidenceHigh = yourValuation * 1.2;

    return {
      impliedMultiple: impliedMultiple.toFixed(1),
      valuation: yourValuation.toFixed(0),
      low: confidenceLow.toFixed(0),
      high: confidenceHigh.toFixed(0),
      insights: [
        `Comparable company trades at ${impliedMultiple.toFixed(1)}x revenue`,
        'Consider qualitative differences between companies',
        'Using a single comparable has limitations - ideally use 3-5 comps',
      ],
    };
  };

  const calculateVC = () => {
    const exit = parseFloat(exitValuation);
    const years = parseFloat(yearsToExit);
    const returnMultiple = parseFloat(targetReturn);
    const investment = parseFloat(investmentAmount);
    
    if (!exit || !years || !returnMultiple || !investment) return null;

    // Calculate required ownership at exit
    const requiredExitValue = investment * returnMultiple;
    const requiredOwnership = (requiredExitValue / exit) * 100;

    // Pre-money valuation
    const postMoneyValuation = investment / (requiredOwnership / 100);
    const preMoneyValuation = postMoneyValuation - investment;

    // IRR calculation
    const irr = (Math.pow(returnMultiple, 1 / years) - 1) * 100;

    return {
      preMoneyValuation: preMoneyValuation.toFixed(0),
      postMoneyValuation: postMoneyValuation.toFixed(0),
      requiredOwnership: requiredOwnership.toFixed(1),
      irr: irr.toFixed(1),
      insights: [
        `Investor needs ${requiredOwnership.toFixed(1)}% ownership to achieve ${returnMultiple}x return`,
        `Implied IRR of ${irr.toFixed(1)}% over ${years} years`,
        requiredOwnership > 25 ? 'High ownership requirement may be difficult for founders to accept' : 'Ownership requirement is reasonable',
      ],
    };
  };

  const revenueResult = method === 'revenue-multiple' ? calculateRevenueMultiple() : null;
  const dcfResult = method === 'dcf' ? calculateDCF() : null;
  const comparableResult = method === 'comparable' ? calculateComparable() : null;
  const vcResult = method === 'vc' ? calculateVC() : null;

  const getMethodIcon = (methodName: string) => {
    switch (methodName) {
      case 'revenue-multiple': return TrendingUp;
      case 'dcf': return Calculator;
      case 'comparable': return Building2;
      case 'vc': return Target;
      default: return DollarSign;
    }
  };

  const MethodIcon = getMethodIcon(method);

  return (
    <AuthGuard>
      <div className="min-h-screen relative bg-background">
        <div className="relative z-10 container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')} 
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          {/* Hero Section */}
          <div className="mb-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Financial Analysis</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight">Valuation Calculator</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Estimate your startup's valuation using industry-standard methods
            </p>
          </div>

          {/* Executive Summary Banner */}
          {(revenueResult || dcfResult || comparableResult || vcResult) && (
            <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-cyan-500/20 rounded-lg">
                    <MethodIcon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">Valuation Summary</h3>
                    {revenueResult && (
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-cyan-400">
                          ${parseFloat(revenueResult.mid).toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-300">
                          Base case valuation using {revenueResult.multiple}x revenue multiple
                        </p>
                        <div className="text-xs text-gray-400">
                          Range: ${parseFloat(revenueResult.low).toLocaleString()} - ${parseFloat(revenueResult.high).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {dcfResult && (
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-cyan-400">
                          ${parseFloat(dcfResult.enterpriseValue).toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-300">
                          Enterprise value based on discounted cash flow analysis
                        </p>
                      </div>
                    )}
                    {comparableResult && (
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-cyan-400">
                          ${parseFloat(comparableResult.valuation).toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-300">
                          Valuation using {comparableResult.impliedMultiple}x comparable multiple
                        </p>
                        <div className="text-xs text-gray-400">
                          Range: ${parseFloat(comparableResult.low).toLocaleString()} - ${parseFloat(comparableResult.high).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {vcResult && (
                      <div className="space-y-2">
                        <div className="text-3xl font-bold text-cyan-400">
                          ${parseFloat(vcResult.preMoneyValuation).toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-300">
                          Pre-money valuation (Post-money: ${parseFloat(vcResult.postMoneyValuation).toLocaleString()})
                        </p>
                        <div className="text-xs text-gray-400">
                          Required ownership: {vcResult.requiredOwnership}% | IRR: {vcResult.irr}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="calculator">Calculator</TabsTrigger>
                <TabsTrigger value="education">Valuation Methods</TabsTrigger>
                <TabsTrigger value="tips">Best Practices</TabsTrigger>
              </TabsList>

              {/* Calculator Tab */}
              <TabsContent value="calculator" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-white">Select Valuation Method</CardTitle>
                    <CardDescription className="text-gray-400">
                      Choose the most appropriate method for your stage and data availability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={method} onValueChange={setMethod}>
                      <TabsList className="grid w-full grid-cols-4 bg-white/5">
                        <TabsTrigger value="revenue-multiple">Revenue Multiple</TabsTrigger>
                        <TabsTrigger value="dcf">DCF</TabsTrigger>
                        <TabsTrigger value="comparable">Comparables</TabsTrigger>
                        <TabsTrigger value="vc">VC Method</TabsTrigger>
                      </TabsList>

                      <TabsContent value="revenue-multiple" className="space-y-4 mt-6">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                          <div className="flex gap-2 items-start">
                            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-300">
                              Most common for early-stage startups. Based on industry benchmarks and revenue growth.
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-white">Industry</Label>
                          <Select value={industry} onValueChange={setIndustry}>
                            <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SaaS">SaaS (6-15x)</SelectItem>
                              <SelectItem value="Marketplace">Marketplace (3-8x)</SelectItem>
                              <SelectItem value="E-commerce">E-commerce (1.5-4x)</SelectItem>
                              <SelectItem value="FinTech">FinTech (4-12x)</SelectItem>
                              <SelectItem value="HealthTech">HealthTech (5-13x)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-white">Annual Revenue ($)</Label>
                            <Input
                              type="number"
                              placeholder="1,000,000"
                              value={revenue}
                              onChange={(e) => setRevenue(e.target.value)}
                              className="mt-2 bg-white/5 border-white/10 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white">YoY Growth Rate (%)</Label>
                            <Input
                              type="number"
                              placeholder="100"
                              value={growthRate}
                              onChange={(e) => setGrowthRate(e.target.value)}
                              className="mt-2 bg-white/5 border-white/10 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Profit Margin (%) <span className="text-gray-400 text-xs">Optional</span></Label>
                            <Input
                              type="number"
                              placeholder="20"
                              value={profitMargin}
                              onChange={(e) => setProfitMargin(e.target.value)}
                              className="mt-2 bg-white/5 border-white/10 text-white"
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="dcf" className="space-y-4 mt-6">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                          <div className="flex gap-2 items-start">
                            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-300">
                              Best for mature startups with predictable cash flows. Based on present value of future cash flows.
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-white">Projected Annual Revenue (Next 5 Years)</Label>
                          <div className="grid grid-cols-1 gap-2 mt-2">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <Input
                                key={i}
                                type="number"
                                placeholder={`Year ${i + 1} Revenue ($)`}
                                value={projectedRevenue[i]}
                                onChange={(e) => {
                                  const newRevenues = [...projectedRevenue];
                                  newRevenues[i] = e.target.value;
                                  setProjectedRevenue(newRevenues);
                                }}
                                className="bg-white/5 border-white/10 text-white"
                              />
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-white">EBITDA Margin (%)</Label>
                            <Input
                              type="number"
                              placeholder="20"
                              value={ebitdaMargin}
                              onChange={(e) => setEbitdaMargin(e.target.value)}
                              className="mt-2 bg-white/5 border-white/10 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Discount Rate (%)</Label>
                            <Input
                              type="number"
                              placeholder="15"
                              value={discountRate}
                              onChange={(e) => setDiscountRate(e.target.value)}
                              className="mt-2 bg-white/5 border-white/10 text-white"
                            />
                            <p className="text-xs text-gray-400 mt-1">10-20% for startups</p>
                          </div>
                          <div>
                            <Label className="text-white">Terminal Growth Rate (%)</Label>
                            <Input
                              type="number"
                              placeholder="3"
                              value={terminalGrowthRate}
                              onChange={(e) => setTerminalGrowthRate(e.target.value)}
                              className="mt-2 bg-white/5 border-white/10 text-white"
                            />
                            <p className="text-xs text-gray-400 mt-1">Usually 2-5%</p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="comparable" className="space-y-4 mt-6">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                          <div className="flex gap-2 items-start">
                            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-300">
                              Values your company based on similar companies. Most accurate with multiple comparable companies.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-white">Comparable Company Valuation ($)</Label>
                            <Input
                              type="number"
                              placeholder="50,000,000"
                              value={comparableValuations}
                              onChange={(e) => setComparableValuations(e.target.value)}
                              className="mt-2 bg-white/5 border-white/10 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Their Annual Revenue ($)</Label>
                            <Input
                              type="number"
                              placeholder="10,000,000"
                              value={comparableRevenue}
                              onChange={(e) => setComparableRevenue(e.target.value)}
                              className="mt-2 bg-white/5 border-white/10 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Your Annual Revenue ($)</Label>
                            <Input
                              type="number"
                              placeholder="5,000,000"
                              value={yourRevenue}
                              onChange={(e) => setYourRevenue(e.target.value)}
                              className="mt-2 bg-white/5 border-white/10 text-white"
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="vc" className="space-y-4 mt-6">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                          <div className="flex gap-2 items-start">
                            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-300">
                              Investor perspective: works backward from expected exit value and target returns.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Expected Exit Valuation ($)</Label>
                            <Input
                              type="number"
                              placeholder="100,000,000"
                              value={exitValuation}
                              onChange={(e) => setExitValuation(e.target.value)}
                              className="mt-2 bg-white/5 border-white/10 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Years to Exit</Label>
                            <Input
                              type="number"
                              placeholder="5"
                              value={yearsToExit}
                              onChange={(e) => setYearsToExit(e.target.value)}
                              className="mt-2 bg-white/5 border-white/10 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Target Return Multiple</Label>
                            <Input
                              type="number"
                              placeholder="10"
                              value={targetReturn}
                              onChange={(e) => setTargetReturn(e.target.value)}
                              className="mt-2 bg-white/5 border-white/10 text-white"
                            />
                            <p className="text-xs text-gray-400 mt-1">5-10x typical for VCs</p>
                          </div>
                          <div>
                            <Label className="text-white">Investment Amount ($)</Label>
                            <Input
                              type="number"
                              placeholder="2,000,000"
                              value={investmentAmount}
                              onChange={(e) => setInvestmentAmount(e.target.value)}
                              className="mt-2 bg-white/5 border-white/10 text-white"
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {revenueResult && (
                  <Card className="bg-[#0D1425]/80 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        Valuation Range
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-sm text-gray-400 mb-1">Conservative</div>
                          <div className="text-2xl font-bold text-white">
                            ${parseFloat(revenueResult.low).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                          <div className="text-sm text-gray-400 mb-1">Base Case</div>
                          <div className="text-2xl font-bold text-cyan-400">
                            ${parseFloat(revenueResult.mid).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-sm text-gray-400 mb-1">Optimistic</div>
                          <div className="text-2xl font-bold text-white">
                            ${parseFloat(revenueResult.high).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-sm text-gray-300 mb-3">
                          <strong className="text-white">Methodology:</strong> Based on a {revenueResult.multiple}x revenue multiple 
                          for {industry} companies with {growthRate}% growth rate
                        </p>
                        
                        <div className="space-y-2">
                          <p className="text-xs text-gray-400 font-semibold">Key Insights:</p>
                          {revenueResult.insights.map((insight, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                              <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                              <p className="text-xs text-gray-300">{insight}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {dcfResult && (
                  <Card className="bg-[#0D1425]/80 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-cyan-400" />
                        DCF Valuation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-sm text-gray-400 mb-1">PV of Cash Flows</div>
                          <div className="text-2xl font-bold text-white">
                            ${parseFloat(dcfResult.pvCashFlows).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-sm text-gray-400 mb-1">PV Terminal Value</div>
                          <div className="text-2xl font-bold text-white">
                            ${parseFloat(dcfResult.pvTerminal).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {dcfResult.terminalValuePercent}% of total
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                          <div className="text-sm text-gray-400 mb-1">Enterprise Value</div>
                          <div className="text-2xl font-bold text-cyan-400">
                            ${parseFloat(dcfResult.enterpriseValue).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-sm text-gray-300 mb-3">
                          <strong className="text-white">Methodology:</strong> Present value of projected EBITDA 
                          using {discountRate}% discount rate and {terminalGrowthRate}% terminal growth
                        </p>
                        
                        <div className="space-y-2">
                          <p className="text-xs text-gray-400 font-semibold">Key Insights:</p>
                          {dcfResult.insights.map((insight, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                              <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                              <p className="text-xs text-gray-300">{insight}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {comparableResult && (
                  <Card className="bg-[#0D1425]/80 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-cyan-400" />
                        Comparable Valuation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-sm text-gray-400 mb-1">Implied Multiple</div>
                          <div className="text-2xl font-bold text-white">
                            {comparableResult.impliedMultiple}x
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                          <div className="text-sm text-gray-400 mb-1">Your Valuation</div>
                          <div className="text-2xl font-bold text-cyan-400">
                            ${parseFloat(comparableResult.valuation).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-sm text-gray-400 mb-1">Range</div>
                          <div className="text-sm font-semibold text-white">
                            ${parseFloat(comparableResult.low).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-400">to</div>
                          <div className="text-sm font-semibold text-white">
                            ${parseFloat(comparableResult.high).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-sm text-gray-300 mb-3">
                          <strong className="text-white">Methodology:</strong> Applying {comparableResult.impliedMultiple}x 
                          multiple from comparable company to your revenue
                        </p>
                        
                        <div className="space-y-2">
                          <p className="text-xs text-gray-400 font-semibold">Key Insights:</p>
                          {comparableResult.insights.map((insight, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                              <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                              <p className="text-xs text-gray-300">{insight}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {vcResult && (
                  <Card className="bg-[#0D1425]/80 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-cyan-400" />
                        VC Method Valuation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                          <div className="text-sm text-gray-400 mb-1">Pre-Money Valuation</div>
                          <div className="text-2xl font-bold text-cyan-400">
                            ${parseFloat(vcResult.preMoneyValuation).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-sm text-gray-400 mb-1">Post-Money Valuation</div>
                          <div className="text-2xl font-bold text-white">
                            ${parseFloat(vcResult.postMoneyValuation).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-sm text-gray-400 mb-1">Required Ownership</div>
                          <div className="text-2xl font-bold text-white">
                            {vcResult.requiredOwnership}%
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-sm text-gray-400 mb-1">Implied IRR</div>
                          <div className="text-2xl font-bold text-white">
                            {vcResult.irr}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-sm text-gray-300 mb-3">
                          <strong className="text-white">Methodology:</strong> Working backward from ${parseFloat(exitValuation).toLocaleString()} 
                          exit in {yearsToExit} years with {targetReturn}x target return
                        </p>
                        
                        <div className="space-y-2">
                          <p className="text-xs text-gray-400 font-semibold">Key Insights:</p>
                          {vcResult.insights.map((insight, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                              <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                              <p className="text-xs text-gray-300">{insight}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Education Tab */}
              <TabsContent value="education" className="space-y-4">
                <Card className="bg-[#0D1425]/80 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-cyan-400" />
                      Understanding Valuation Methods
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Learn when and how to use each valuation approach
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="revenue-multiple" className="border-white/10">
                        <AccordionTrigger className="text-white hover:text-cyan-400">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Revenue Multiple Method
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-300 space-y-3">
                          <div>
                            <h4 className="font-semibold text-white mb-2">What it is:</h4>
                            <p className="text-sm">
                              Values your company as a multiple of annual recurring revenue (ARR) or revenue run rate, 
                              based on industry benchmarks and growth rates.
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white mb-2">When to use:</h4>
                            <ul className="text-sm space-y-1 list-disc list-inside">
                              <li>Early-stage startups (Seed to Series A)</li>
                              <li>High-growth companies without profitability</li>
                              <li>Quick ballpark valuations</li>
                              <li>When comparable data is available</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white mb-2">Pros & Cons:</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-green-400 font-semibold mb-1">Pros:</p>
                                <ul className="space-y-1">
                                  <li>• Simple and quick</li>
                                  <li>• Market-based</li>
                                  <li>• Widely understood</li>
                                </ul>
                              </div>
                              <div>
                                <p className="text-red-400 font-semibold mb-1">Cons:</p>
                                <ul className="space-y-1">
                                  <li>• Ignores profitability</li>
                                  <li>• Multiples vary widely</li>
                                  <li>• Market dependent</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="dcf" className="border-white/10">
                        <AccordionTrigger className="text-white hover:text-cyan-400">
                          <div className="flex items-center gap-2">
                            <Calculator className="w-4 h-4" />
                            Discounted Cash Flow (DCF)
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-300 space-y-3">
                          <div>
                            <h4 className="font-semibold text-white mb-2">What it is:</h4>
                            <p className="text-sm">
                              Calculates present value of future cash flows by projecting revenue and applying 
                              a discount rate to account for risk and time value of money.
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white mb-2">When to use:</h4>
                            <ul className="text-sm space-y-1 list-disc list-inside">
                              <li>Mature startups with predictable cash flows</li>
                              <li>Series B+ companies</li>
                              <li>Path to profitability is clear</li>
                              <li>For detailed financial modeling</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white mb-2">Key Assumptions:</h4>
                            <div className="text-sm space-y-2 bg-white/5 p-3 rounded-lg">
                              <p><strong>Discount Rate:</strong> 10-20% for startups (higher = riskier)</p>
                              <p><strong>Terminal Growth:</strong> 2-5% (long-term sustainable growth)</p>
                              <p><strong>EBITDA Margin:</strong> Expected profitability level</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="comparable" className="border-white/10">
                        <AccordionTrigger className="text-white hover:text-cyan-400">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Comparable Company Analysis
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-300 space-y-3">
                          <div>
                            <h4 className="font-semibold text-white mb-2">What it is:</h4>
                            <p className="text-sm">
                              Values your company based on how similar companies are valued, using metrics 
                              like revenue multiples from recent funding rounds or public markets.
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white mb-2">When to use:</h4>
                            <ul className="text-sm space-y-1 list-disc list-inside">
                              <li>When true comparables exist</li>
                              <li>Market-based valuation needed</li>
                              <li>Cross-checking other methods</li>
                              <li>Negotiating with investors</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white mb-2">Best Practices:</h4>
                            <ul className="text-sm space-y-1 bg-white/5 p-3 rounded-lg">
                              <li>• Use 3-5 comparable companies</li>
                              <li>• Match by stage, geography, business model</li>
                              <li>• Adjust for qualitative differences</li>
                              <li>• Consider market timing</li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="vc" className="border-white/10">
                        <AccordionTrigger className="text-white hover:text-cyan-400">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Venture Capital Method
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-300 space-y-3">
                          <div>
                            <h4 className="font-semibold text-white mb-2">What it is:</h4>
                            <p className="text-sm">
                              Works backward from expected exit value, calculating what ownership investors need 
                              today to achieve their target returns at exit.
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white mb-2">When to use:</h4>
                            <ul className="text-sm space-y-1 list-disc list-inside">
                              <li>Fundraising scenarios</li>
                              <li>Understanding investor perspective</li>
                              <li>Early-stage companies</li>
                              <li>Cap table planning</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white mb-2">Typical Investor Returns:</h4>
                            <div className="text-sm space-y-2 bg-white/5 p-3 rounded-lg">
                              <p><strong>Seed:</strong> 10-20x target return (5-7 years)</p>
                              <p><strong>Series A:</strong> 5-10x target return (5-7 years)</p>
                              <p><strong>Series B+:</strong> 3-5x target return (3-5 years)</p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tips Tab */}
              <TabsContent value="tips" className="space-y-4">
                <Card className="bg-[#0D1425]/80 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-cyan-400" />
                      Valuation Best Practices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">General Principles</h3>
                      <div className="space-y-3">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-cyan-400 font-bold">1</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-white mb-1">Use Multiple Methods</h4>
                              <p className="text-sm text-gray-300">
                                Never rely on a single valuation method. Calculate using 2-3 different approaches 
                                and look for convergence. This gives you a more robust valuation range.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-cyan-400 font-bold">2</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-white mb-1">Be Conservative</h4>
                              <p className="text-sm text-gray-300">
                                It's better to be pleasantly surprised than disappointed. Use conservative assumptions 
                                for growth rates, margins, and exit multiples.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-cyan-400 font-bold">3</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-white mb-1">Context Matters</h4>
                              <p className="text-sm text-gray-300">
                                Valuation varies by market conditions, competitive landscape, team quality, 
                                and dozens of other factors. Don't treat it as purely mathematical.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">For Founders</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-sm text-gray-300 flex gap-2">
                            <span className="text-green-400">✓</span>
                            Focus on building value, not just valuation
                          </p>
                        </div>
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-sm text-gray-300 flex gap-2">
                            <span className="text-green-400">✓</span>
                            Know your metrics and be ready to defend them
                          </p>
                        </div>
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-sm text-gray-300 flex gap-2">
                            <span className="text-green-400">✓</span>
                            Understand investor perspectives and returns
                          </p>
                        </div>
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-sm text-gray-300 flex gap-2">
                            <span className="text-green-400">✓</span>
                            Be flexible but know your walk-away point
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Common Mistakes</h3>
                      <div className="space-y-2">
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-sm text-gray-300 flex gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <span><strong className="text-white">Over-optimistic projections:</strong> Be realistic about growth and timelines</span>
                          </p>
                        </div>
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-sm text-gray-300 flex gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <span><strong className="text-white">Ignoring dilution:</strong> Account for future funding rounds</span>
                          </p>
                        </div>
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-sm text-gray-300 flex gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <span><strong className="text-white">Wrong comparables:</strong> Match stage, model, and market carefully</span>
                          </p>
                        </div>
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-sm text-gray-300 flex gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <span><strong className="text-white">Forgetting the human element:</strong> Team and execution matter as much as numbers</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg">
                      <h3 className="text-white font-semibold mb-2">Remember:</h3>
                      <p className="text-sm text-gray-300">
                        Valuation is ultimately about finding a fair price that works for both founders and investors. 
                        It's part art, part science. Focus on building a great company, and the valuation will follow.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default ValuationCalculator;
