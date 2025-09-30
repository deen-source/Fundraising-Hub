import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ValuationCalculator = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState('revenue-multiple');
  
  // Revenue Multiple Method
  const [revenue, setRevenue] = useState('');
  const [growthRate, setGrowthRate] = useState('');
  const [industry, setIndustry] = useState('SaaS');
  
  // DCF Method
  const [projectedRevenue, setProjectedRevenue] = useState(['', '', '', '', '']);
  const [discountRate, setDiscountRate] = useState('15');
  const [terminalGrowthRate, setTerminalGrowthRate] = useState('3');
  
  // Comparable Method
  const [comparableValuations, setComparableValuations] = useState('');
  const [yourRevenue, setYourRevenue] = useState('');

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
    if (!rev) return null;

    const baseMultiple = industryMultiples[industry];
    let adjustedMultiple = baseMultiple.mid;

    // Adjust for growth rate
    if (growth > 100) adjustedMultiple = baseMultiple.high;
    else if (growth > 50) adjustedMultiple = (baseMultiple.mid + baseMultiple.high) / 2;
    else if (growth < 20) adjustedMultiple = (baseMultiple.low + baseMultiple.mid) / 2;

    return {
      low: (rev * baseMultiple.low).toFixed(0),
      mid: (rev * adjustedMultiple).toFixed(0),
      high: (rev * baseMultiple.high).toFixed(0),
      multiple: adjustedMultiple.toFixed(1),
    };
  };

  const calculateDCF = () => {
    const revenues = projectedRevenue.map(r => parseFloat(r)).filter(r => !isNaN(r));
    if (revenues.length === 0) return null;

    const discount = parseFloat(discountRate) / 100;
    const terminalGrowth = parseFloat(terminalGrowthRate) / 100;

    // Calculate PV of projected revenues
    const pvRevenues = revenues.map((rev, i) => rev / Math.pow(1 + discount, i + 1));
    const sumPV = pvRevenues.reduce((sum, pv) => sum + pv, 0);

    // Terminal value
    const terminalRevenue = revenues[revenues.length - 1] * (1 + terminalGrowth);
    const terminalValue = terminalRevenue / (discount - terminalGrowth);
    const pvTerminal = terminalValue / Math.pow(1 + discount, revenues.length);

    const enterpriseValue = sumPV + pvTerminal;

    return {
      enterpriseValue: enterpriseValue.toFixed(0),
      pvRevenues: sumPV.toFixed(0),
      pvTerminal: pvTerminal.toFixed(0),
    };
  };

  const calculateComparable = () => {
    const comps = parseFloat(comparableValuations);
    const rev = parseFloat(yourRevenue);
    if (!comps || !rev) return null;

    const impliedMultiple = comps / rev;
    return {
      impliedMultiple: impliedMultiple.toFixed(1),
      valuation: comps.toFixed(0),
    };
  };

  const revenueResult = method === 'revenue-multiple' ? calculateRevenueMultiple() : null;
  const dcfResult = method === 'dcf' ? calculateDCF() : null;
  const comparableResult = method === 'comparable' ? calculateComparable() : null;

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
                <CardTitle className="text-3xl flex items-center gap-2">
                  <DollarSign className="w-8 h-8 text-primary" />
                  Valuation Calculator
                </CardTitle>
                <CardDescription>
                  Estimate your startup's valuation using multiple methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={method} onValueChange={setMethod}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="revenue-multiple">Revenue Multiple</TabsTrigger>
                    <TabsTrigger value="dcf">DCF</TabsTrigger>
                    <TabsTrigger value="comparable">Comparables</TabsTrigger>
                  </TabsList>

                  <TabsContent value="revenue-multiple" className="space-y-4 mt-6">
                    <div>
                      <Label>Industry</Label>
                      <Select value={industry} onValueChange={setIndustry}>
                        <SelectTrigger className="mt-2 bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SaaS">SaaS</SelectItem>
                          <SelectItem value="Marketplace">Marketplace</SelectItem>
                          <SelectItem value="E-commerce">E-commerce</SelectItem>
                          <SelectItem value="FinTech">FinTech</SelectItem>
                          <SelectItem value="HealthTech">HealthTech</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Annual Revenue ($)</Label>
                        <Input
                          type="number"
                          placeholder="1,000,000"
                          value={revenue}
                          onChange={(e) => setRevenue(e.target.value)}
                          className="mt-2 bg-background/50"
                        />
                      </div>
                      <div>
                        <Label>YoY Growth Rate (%)</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={growthRate}
                          onChange={(e) => setGrowthRate(e.target.value)}
                          className="mt-2 bg-background/50"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="dcf" className="space-y-4 mt-6">
                    <div>
                      <Label>Projected Annual Revenue (Next 5 Years)</Label>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <Input
                            key={i}
                            type="number"
                            placeholder={`Year ${i + 1} Revenue`}
                            value={projectedRevenue[i]}
                            onChange={(e) => {
                              const newRevenues = [...projectedRevenue];
                              newRevenues[i] = e.target.value;
                              setProjectedRevenue(newRevenues);
                            }}
                            className="bg-background/50"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Discount Rate (%)</Label>
                        <Input
                          type="number"
                          placeholder="15"
                          value={discountRate}
                          onChange={(e) => setDiscountRate(e.target.value)}
                          className="mt-2 bg-background/50"
                        />
                      </div>
                      <div>
                        <Label>Terminal Growth Rate (%)</Label>
                        <Input
                          type="number"
                          placeholder="3"
                          value={terminalGrowthRate}
                          onChange={(e) => setTerminalGrowthRate(e.target.value)}
                          className="mt-2 bg-background/50"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="comparable" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Comparable Company Valuation ($)</Label>
                        <Input
                          type="number"
                          placeholder="50,000,000"
                          value={comparableValuations}
                          onChange={(e) => setComparableValuations(e.target.value)}
                          className="mt-2 bg-background/50"
                        />
                      </div>
                      <div>
                        <Label>Your Annual Revenue ($)</Label>
                        <Input
                          type="number"
                          placeholder="5,000,000"
                          value={yourRevenue}
                          onChange={(e) => setYourRevenue(e.target.value)}
                          className="mt-2 bg-background/50"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {revenueResult && (
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle>Valuation Range</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-background/50 border border-border">
                      <div className="text-sm text-muted-foreground mb-1">Conservative</div>
                      <div className="text-2xl font-bold text-primary">
                        ${parseFloat(revenueResult.low).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/20 border border-primary">
                      <div className="text-sm text-muted-foreground mb-1">Base Case</div>
                      <div className="text-2xl font-bold text-primary">
                        ${parseFloat(revenueResult.mid).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50 border border-border">
                      <div className="text-sm text-muted-foreground mb-1">Optimistic</div>
                      <div className="text-2xl font-bold text-primary">
                        ${parseFloat(revenueResult.high).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-border">
                    <p className="text-sm text-muted-foreground">
                      Based on a {revenueResult.multiple}x revenue multiple for {industry} companies 
                      with {growthRate}% growth rate
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {dcfResult && (
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle>DCF Valuation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-background/50 border border-border">
                      <div className="text-sm text-muted-foreground mb-1">PV of Revenues</div>
                      <div className="text-2xl font-bold text-primary">
                        ${parseFloat(dcfResult.pvRevenues).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50 border border-border">
                      <div className="text-sm text-muted-foreground mb-1">PV Terminal Value</div>
                      <div className="text-2xl font-bold text-primary">
                        ${parseFloat(dcfResult.pvTerminal).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/20 border border-primary">
                      <div className="text-sm text-muted-foreground mb-1">Enterprise Value</div>
                      <div className="text-2xl font-bold text-primary">
                        ${parseFloat(dcfResult.enterpriseValue).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {comparableResult && (
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle>Comparable Valuation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-background/50 border border-border">
                      <div className="text-sm text-muted-foreground mb-1">Implied Multiple</div>
                      <div className="text-2xl font-bold text-primary">
                        {comparableResult.impliedMultiple}x
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/20 border border-primary">
                      <div className="text-sm text-muted-foreground mb-1">Your Valuation</div>
                      <div className="text-2xl font-bold text-primary">
                        ${parseFloat(comparableResult.valuation).toLocaleString()}
                      </div>
                    </div>
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

export default ValuationCalculator;
