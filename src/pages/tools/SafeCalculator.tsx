import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, Calculator, TrendingUp, AlertCircle, CheckCircle, Info, DollarSign, Percent, ArrowRight, Shield, Target } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SAFEComparison {
  type: string;
  conversionPrice: number;
  shares: number;
  ownership: number;
  effectiveVal: number;
  discount: number;
}

const SafeCalculator = () => {
  const navigate = useNavigate();
  const [safeType, setSafeType] = useState('valuation-cap');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [valuationCap, setValuationCap] = useState('');
  const [discount, setDiscount] = useState('20');
  const [pricePerShare, setPricePerShare] = useState('');
  const [preMoneyValuation, setPreMoneyValuation] = useState('');

  const calculateConversion = (type: string = safeType, customCap?: number, customDiscount?: number) => {
    const investment = parseFloat(investmentAmount);
    const cap = customCap !== undefined ? customCap : parseFloat(valuationCap);
    const discountRate = (customDiscount !== undefined ? customDiscount : parseFloat(discount)) / 100;
    const price = parseFloat(pricePerShare);
    const preMoney = parseFloat(preMoneyValuation);

    if (!investment || !price || !preMoney) return null;

    let conversionPrice = price;
    let triggerUsed = 'none';
    
    if (type === 'valuation-cap' && cap) {
      const capPrice = (cap / preMoney) * price;
      const discountPrice = price * (1 - discountRate);
      conversionPrice = Math.min(discountPrice, capPrice);
      triggerUsed = conversionPrice === capPrice ? 'cap' : 'discount';
    } else if (type === 'discount-only') {
      conversionPrice = price * (1 - discountRate);
      triggerUsed = 'discount';
    } else if (type === 'no-terms') {
      conversionPrice = price;
      triggerUsed = 'none';
    }

    const sharesReceived = investment / conversionPrice;
    const totalShares = preMoney / price;
    const newMoneyShares = investment / price;
    const postMoneyShares = totalShares + newMoneyShares;
    const ownershipPercentage = (sharesReceived / (postMoneyShares + sharesReceived - newMoneyShares)) * 100;
    const effectiveDiscount = ((price - conversionPrice) / price) * 100;

    return {
      conversionPrice: conversionPrice,
      sharesReceived: Math.round(sharesReceived),
      ownershipPercentage: ownershipPercentage,
      effectiveValuation: investment / (ownershipPercentage / 100),
      effectiveDiscount: effectiveDiscount,
      triggerUsed: triggerUsed,
      totalShares: Math.round(postMoneyShares + sharesReceived - newMoneyShares),
    };
  };

  const getAllComparisons = (): SAFEComparison[] => {
    const investment = parseFloat(investmentAmount);
    const cap = parseFloat(valuationCap);
    const price = parseFloat(pricePerShare);
    const preMoney = parseFloat(preMoneyValuation);

    if (!investment || !price || !preMoney) return [];

    const comparisons: SAFEComparison[] = [];

    // Valuation Cap + Discount
    if (cap) {
      const result = calculateConversion('valuation-cap');
      if (result) {
        comparisons.push({
          type: 'Cap + Discount',
          conversionPrice: result.conversionPrice,
          shares: result.sharesReceived,
          ownership: result.ownershipPercentage,
          effectiveVal: result.effectiveValuation,
          discount: result.effectiveDiscount,
        });
      }
    }

    // Discount Only
    const discountResult = calculateConversion('discount-only');
    if (discountResult) {
      comparisons.push({
        type: 'Discount Only',
        conversionPrice: discountResult.conversionPrice,
        shares: discountResult.sharesReceived,
        ownership: discountResult.ownershipPercentage,
        effectiveVal: discountResult.effectiveValuation,
        discount: discountResult.effectiveDiscount,
      });
    }

    // No Cap, No Discount
    const noTermsResult = calculateConversion('no-terms', 0, 0);
    if (noTermsResult) {
      comparisons.push({
        type: 'No Terms',
        conversionPrice: noTermsResult.conversionPrice,
        shares: noTermsResult.sharesReceived,
        ownership: noTermsResult.ownershipPercentage,
        effectiveVal: noTermsResult.effectiveValuation,
        discount: 0,
      });
    }

    return comparisons;
  };

  const result = calculateConversion();
  const comparisons = getAllComparisons();
  const bestDeal = comparisons.reduce((best, curr) => 
    curr.ownership > best.ownership ? curr : best
  , comparisons[0] || { type: '', ownership: 0 });

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

          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Banner */}
            <div className="mb-8 text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Calculator className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Financial Analysis</span>
              </div>
              <h1 className="text-5xl font-bold tracking-tight">SAFE Note Calculator</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Model your Simple Agreement for Future Equity conversions and understand investor protections
              </p>
              {result && (
                <div className="inline-flex flex-col items-center gap-2 mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="text-sm text-muted-foreground">Your Ownership</div>
                  <div className="text-3xl font-bold text-primary">{result.ownershipPercentage.toFixed(2)}%</div>
                  <div className="text-xs text-muted-foreground">of company post-conversion</div>
                </div>
              )}
            </div>

            {/* Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  SAFE Parameters
                </CardTitle>
                <CardDescription className="text-white/60">
                  Enter your SAFE terms and financing round details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-white/80">SAFE Type</Label>
                  <Select value={safeType} onValueChange={setSafeType}>
                    <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="valuation-cap">Valuation Cap + Discount</SelectItem>
                      <SelectItem value="discount-only">Discount Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-white/50 mt-1">
                    {safeType === 'valuation-cap' 
                      ? 'Most investor-friendly: converts at lower of cap or discounted price'
                      : 'Converts at a discount to the next round price'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/80">Investment Amount ($)</Label>
                    <Input
                      type="number"
                      placeholder="100,000"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>

                  {safeType === 'valuation-cap' && (
                    <div>
                      <Label className="text-white/80">Valuation Cap ($)</Label>
                      <Input
                        type="number"
                        placeholder="5,000,000"
                        value={valuationCap}
                        onChange={(e) => setValuationCap(e.target.value)}
                        className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-white/80">Discount Rate (%)</Label>
                    <Input
                      type="number"
                      placeholder="20"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>

                  <div>
                    <Label className="text-white/80">Series A Price per Share ($)</Label>
                    <Input
                      type="number"
                      placeholder="2.00"
                      step="0.01"
                      value={pricePerShare}
                      onChange={(e) => setPricePerShare(e.target.value)}
                      className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-white/80">Series A Pre-Money Valuation ($)</Label>
                    <Input
                      type="number"
                      placeholder="10,000,000"
                      value={preMoneyValuation}
                      onChange={(e) => setPreMoneyValuation(e.target.value)}
                      className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {result && (
              <>
                {/* Results Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      Conversion Results
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
                        Trigger: {result.triggerUsed === 'cap' ? 'Valuation Cap' : 'Discount Rate'}
                      </Badge>
                      <Badge variant="outline" className="border-white/20 text-white/70 bg-white/5">
                        {result.effectiveDiscount.toFixed(1)}% Effective Discount
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-cyan-400" />
                          <div className="text-sm text-cyan-100/60">Conversion Price</div>
                        </div>
                        <div className="text-2xl font-bold text-white">${result.conversionPrice.toFixed(2)}</div>
                        <div className="text-xs text-cyan-100/50 mt-1">per share</div>
                        <Progress 
                          value={((parseFloat(pricePerShare) - result.conversionPrice) / parseFloat(pricePerShare)) * 100} 
                          className="mt-2 h-1 bg-white/10"
                        />
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-purple-400" />
                          <div className="text-sm text-purple-100/60">Shares Received</div>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {result.sharesReceived.toLocaleString()}
                        </div>
                        <div className="text-xs text-purple-100/50 mt-1">common shares</div>
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Percent className="w-4 h-4 text-green-400" />
                          <div className="text-sm text-green-100/60">Your Ownership</div>
                        </div>
                        <div className="text-2xl font-bold text-white">{result.ownershipPercentage.toFixed(2)}%</div>
                        <div className="text-xs text-green-100/50 mt-1">fully diluted</div>
                        <Progress 
                          value={Math.min(result.ownershipPercentage, 100)} 
                          className="mt-2 h-1 bg-white/10"
                        />
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-orange-400" />
                          <div className="text-sm text-orange-100/60">Effective Valuation</div>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          ${(result.effectiveValuation / 1000000).toFixed(1)}M
                        </div>
                        <div className="text-xs text-orange-100/50 mt-1">post-money</div>
                      </div>
                    </div>

                    {/* Key Insights */}
                    <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                      <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4 text-cyan-400" />
                        Key Insights
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-white/90 text-sm">
                              Your SAFE converts at <span className="font-semibold text-cyan-400">${result.conversionPrice.toFixed(2)}</span> per share, 
                              compared to Series A at <span className="font-semibold">${pricePerShare}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-white/90 text-sm">
                              You receive a <span className="font-semibold text-green-400">{result.effectiveDiscount.toFixed(1)}%</span> discount 
                              compared to Series A investors
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-white/90 text-sm">
                              Effective valuation of <span className="font-semibold text-orange-400">${(result.effectiveValuation / 1000000).toFixed(1)}M</span> is{' '}
                              {result.effectiveValuation < parseFloat(preMoneyValuation) ? 
                                <span className="text-green-400">lower (better)</span> : 
                                <span className="text-orange-400">higher</span>
                              } than Series A pre-money
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-white/90 text-sm">
                              The {result.triggerUsed === 'cap' ? 'valuation cap' : 'discount rate'} determined 
                              your conversion price
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Analysis Tabs */}
                <Tabs defaultValue="comparison" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
                    <TabsTrigger value="comparison" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                      Scenario Comparison
                    </TabsTrigger>
                    <TabsTrigger value="education" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                      SAFE Education
                    </TabsTrigger>
                    <TabsTrigger value="tips" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                      Negotiation Tips
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="comparison" className="space-y-4">
                    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                      <CardHeader>
                        <CardTitle className="text-xl text-white">Compare SAFE Scenarios</CardTitle>
                        <CardDescription className="text-white/60">
                          See how different SAFE terms affect your ownership
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {comparisons.length > 0 && (
                          <div className="space-y-3">
                            {comparisons.map((comp, idx) => (
                              <div 
                                key={idx}
                                className={`p-4 rounded-xl border transition-all ${
                                  comp.type === bestDeal.type
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-white/5 border-white/10'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <h4 className="font-semibold text-white">{comp.type}</h4>
                                    {comp.type === bestDeal.type && (
                                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                        Best Deal
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-cyan-400">{comp.ownership.toFixed(2)}%</div>
                                    <div className="text-xs text-white/50">ownership</div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <div className="text-white/50 text-xs">Conversion Price</div>
                                    <div className="text-white font-medium">${comp.conversionPrice.toFixed(2)}</div>
                                  </div>
                                  <div>
                                    <div className="text-white/50 text-xs">Shares</div>
                                    <div className="text-white font-medium">{comp.shares.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <div className="text-white/50 text-xs">Discount</div>
                                    <div className="text-white font-medium">{comp.discount.toFixed(1)}%</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                          <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-white/80">
                              <p className="font-semibold text-white mb-1">Understanding the Comparison</p>
                              <p>The "Cap + Discount" scenario provides the best protection for investors, automatically converting at whichever gives you more ownership. 
                              "Discount Only" is simpler but may give less ownership if the company valuation increases significantly.</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="education" className="space-y-4">
                    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                      <CardHeader>
                        <CardTitle className="text-xl text-white">Understanding SAFE Notes</CardTitle>
                        <CardDescription className="text-white/60">
                          Learn about Simple Agreements for Future Equity
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="single" collapsible className="space-y-2">
                          <AccordionItem value="what-is-safe" className="border-white/10 bg-white/5 rounded-xl px-4">
                            <AccordionTrigger className="text-white hover:text-cyan-400 hover:no-underline">
                              What is a SAFE?
                            </AccordionTrigger>
                            <AccordionContent className="text-white/70 space-y-2">
                              <p>
                                A SAFE (Simple Agreement for Future Equity) is an investment instrument created by Y Combinator 
                                that allows investors to convert their investment into equity at a future date, typically during 
                                a priced equity round.
                              </p>
                              <p>
                                Unlike convertible notes, SAFEs don't accrue interest and have no maturity date, making them 
                                simpler and more founder-friendly while still providing investor protections.
                              </p>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="valuation-cap" className="border-white/10 bg-white/5 rounded-xl px-4">
                            <AccordionTrigger className="text-white hover:text-cyan-400 hover:no-underline">
                              How does a Valuation Cap work?
                            </AccordionTrigger>
                            <AccordionContent className="text-white/70 space-y-2">
                              <p>
                                A valuation cap sets a maximum valuation at which your SAFE will convert. If the company's 
                                valuation at the next round exceeds the cap, you convert as if the company were valued at the cap.
                              </p>
                              <p className="font-semibold text-cyan-400">Example:</p>
                              <p>
                                If you invest $100K with a $5M cap, and the company raises at a $10M valuation, you convert at 
                                the $5M valuation, receiving 2% of the company instead of 1%.
                              </p>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="discount" className="border-white/10 bg-white/5 rounded-xl px-4">
                            <AccordionTrigger className="text-white hover:text-cyan-400 hover:no-underline">
                              Understanding the Discount Rate
                            </AccordionTrigger>
                            <AccordionContent className="text-white/70 space-y-2">
                              <p>
                                The discount rate (typically 15-25%) gives you a reduced price per share compared to new investors 
                                in the priced round, rewarding your early risk-taking.
                              </p>
                              <p>
                                With a 20% discount and a Series A price of $2.00/share, you convert at $1.60/share, 
                                receiving 25% more shares for your investment.
                              </p>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="pro-rata" className="border-white/10 bg-white/5 rounded-xl px-4">
                            <AccordionTrigger className="text-white hover:text-cyan-400 hover:no-underline">
                              Pro-Rata Rights
                            </AccordionTrigger>
                            <AccordionContent className="text-white/70 space-y-2">
                              <p>
                                Pro-rata rights allow you to invest additional capital in future rounds to maintain your 
                                ownership percentage, protecting against dilution.
                              </p>
                              <p className="text-yellow-400">
                                <strong>Important:</strong> Not all SAFEs include pro-rata rights. Negotiate for these if 
                                you want to participate in future rounds.
                              </p>
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem value="mfn" className="border-white/10 bg-white/5 rounded-xl px-4">
                            <AccordionTrigger className="text-white hover:text-cyan-400 hover:no-underline">
                              Most Favored Nation (MFN) Clause
                            </AccordionTrigger>
                            <AccordionContent className="text-white/70 space-y-2">
                              <p>
                                An MFN clause ensures that if the company issues SAFEs with better terms to later investors, 
                                your SAFE automatically adopts those better terms.
                              </p>
                              <p>
                                This protects early investors from being disadvantaged by subsequent SAFE investors receiving 
                                more favorable terms.
                              </p>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="tips" className="space-y-4">
                    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                      <CardHeader>
                        <CardTitle className="text-xl text-white flex items-center gap-2">
                          <Shield className="w-5 h-5 text-cyan-400" />
                          Negotiation Best Practices
                        </CardTitle>
                        <CardDescription className="text-white/60">
                          Key points to consider when negotiating SAFE terms
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="font-semibold text-white mb-1">For Investors</h4>
                                <ul className="text-sm text-white/70 space-y-2">
                                  <li><ArrowRight className="w-3 h-3 inline mr-2" />Request both a valuation cap AND discount for maximum protection</li>
                                  <li><ArrowRight className="w-3 h-3 inline mr-2" />Negotiate for pro-rata rights to participate in future rounds</li>
                                  <li><ArrowRight className="w-3 h-3 inline mr-2" />Typical discount rates range from 15-25% (20% is standard)</li>
                                  <li><ArrowRight className="w-3 h-3 inline mr-2" />Consider adding an MFN clause for protection</li>
                                  <li><ArrowRight className="w-3 h-3 inline mr-2" />Lower valuation caps give you better upside potential</li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <div className="flex items-start gap-3">
                              <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="font-semibold text-white mb-1">For Founders</h4>
                                <ul className="text-sm text-white/70 space-y-2">
                                  <li><ArrowRight className="w-3 h-3 inline mr-2" />Higher valuation caps protect your ownership but may deter investors</li>
                                  <li><ArrowRight className="w-3 h-3 inline mr-2" />Consider offering post-money SAFEs for clarity on dilution</li>
                                  <li><ArrowRight className="w-3 h-3 inline mr-2" />Discount-only SAFEs are more founder-friendly but harder to raise</li>
                                  <li><ArrowRight className="w-3 h-3 inline mr-2" />Be strategic about pro-rata rights - they can crowd out new investors</li>
                                  <li><ArrowRight className="w-3 h-3 inline mr-2" />Track total SAFE dilution to avoid surprises at Series A</li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="font-semibold text-white mb-1">Common Pitfalls to Avoid</h4>
                                <ul className="text-sm text-white/70 space-y-2">
                                  <li><ArrowRight className="w-3 h-3 inline mr-2" />Not understanding which trigger (cap vs. discount) determines conversion</li>
                                  <li><ArrowRight className="w-3 h-3 inline mr-2" />Raising too much on SAFEs, leading to excessive dilution</li>
                                  <li><ArrowRight className="w-3 h-3 inline mr-2" />Failing to model various exit scenarios before agreeing to terms</li>
                                  <li><ArrowRight className="w-3 h-3 inline mr-2" />Not tracking total SAFE investment across multiple rounds</li>
                                  <li><ArrowRight className="w-3 h-3 inline mr-2" />Ignoring the impact of pro-rata rights on future fundraising</li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <div className="flex items-start gap-3">
                              <Info className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="font-semibold text-white mb-1">Market Standards (2025)</h4>
                                <div className="text-sm text-white/70 space-y-2">
                                  <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div>
                                      <p className="text-white/50 text-xs">Valuation Cap</p>
                                      <p className="text-white font-medium">$4M - $10M (seed)</p>
                                    </div>
                                    <div>
                                      <p className="text-white/50 text-xs">Discount Rate</p>
                                      <p className="text-white font-medium">15% - 25%</p>
                                    </div>
                                    <div>
                                      <p className="text-white/50 text-xs">Pro-Rata Rights</p>
                                      <p className="text-white font-medium">Common for $100K+</p>
                                    </div>
                                    <div>
                                      <p className="text-white/50 text-xs">MFN Clause</p>
                                      <p className="text-white font-medium">Increasingly standard</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}

            {!result && (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="py-12">
                  <div className="text-center text-white/60">
                    <Calculator className="w-12 h-12 mx-auto mb-4 text-cyan-400/50" />
                    <p>Enter your SAFE parameters above to see conversion results and analysis</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default SafeCalculator;
