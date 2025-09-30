import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, Calculator } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SafeCalculator = () => {
  const navigate = useNavigate();
  const [safeType, setSafeType] = useState('valuation-cap');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [valuationCap, setValuationCap] = useState('');
  const [discount, setDiscount] = useState('20');
  const [pricePerShare, setPricePerShare] = useState('');
  const [preMoneyValuation, setPreMoneyValuation] = useState('');

  const calculateConversion = () => {
    const investment = parseFloat(investmentAmount);
    const cap = parseFloat(valuationCap);
    const discountRate = parseFloat(discount) / 100;
    const price = parseFloat(pricePerShare);
    const preMoney = parseFloat(preMoneyValuation);

    if (!investment || !price || !preMoney) return null;

    // Calculate conversion price
    let conversionPrice = price;
    
    if (safeType === 'valuation-cap' && cap) {
      const capPrice = (cap / preMoney) * price;
      conversionPrice = Math.min(price * (1 - discountRate), capPrice);
    } else if (safeType === 'discount-only') {
      conversionPrice = price * (1 - discountRate);
    }

    const sharesReceived = investment / conversionPrice;
    const postMoneyValuation = preMoney + parseFloat(investmentAmount);
    const ownershipPercentage = (sharesReceived * conversionPrice / postMoneyValuation) * 100;

    return {
      conversionPrice: conversionPrice.toFixed(2),
      sharesReceived: Math.round(sharesReceived),
      ownershipPercentage: ownershipPercentage.toFixed(2),
      effectiveValuation: (investment / (ownershipPercentage / 100)).toFixed(0),
    };
  };

  const result = calculateConversion();

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
                  <Calculator className="w-8 h-8 text-primary" />
                  SAFE Note Calculator
                </CardTitle>
                <CardDescription>
                  Calculate SAFE note conversions and resulting ownership
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>SAFE Type</Label>
                  <Select value={safeType} onValueChange={setSafeType}>
                    <SelectTrigger className="mt-2 bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="valuation-cap">Valuation Cap + Discount</SelectItem>
                      <SelectItem value="discount-only">Discount Only</SelectItem>
                      <SelectItem value="mfn">Most Favored Nation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Investment Amount ($)</Label>
                    <Input
                      type="number"
                      placeholder="100,000"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      className="mt-2 bg-background/50"
                    />
                  </div>

                  {safeType === 'valuation-cap' && (
                    <div>
                      <Label>Valuation Cap ($)</Label>
                      <Input
                        type="number"
                        placeholder="5,000,000"
                        value={valuationCap}
                        onChange={(e) => setValuationCap(e.target.value)}
                        className="mt-2 bg-background/50"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Discount Rate (%)</Label>
                    <Input
                      type="number"
                      placeholder="20"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="mt-2 bg-background/50"
                    />
                  </div>

                  <div>
                    <Label>Series A Price per Share ($)</Label>
                    <Input
                      type="number"
                      placeholder="2.00"
                      value={pricePerShare}
                      onChange={(e) => setPricePerShare(e.target.value)}
                      className="mt-2 bg-background/50"
                    />
                  </div>

                  <div>
                    <Label>Series A Pre-Money Valuation ($)</Label>
                    <Input
                      type="number"
                      placeholder="10,000,000"
                      value={preMoneyValuation}
                      onChange={(e) => setPreMoneyValuation(e.target.value)}
                      className="mt-2 bg-background/50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {result && (
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle>Conversion Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="text-sm text-muted-foreground mb-1">Conversion Price</div>
                      <div className="text-2xl font-bold text-primary">${result.conversionPrice}</div>
                      <div className="text-xs text-muted-foreground mt-1">per share</div>
                    </div>

                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="text-sm text-muted-foreground mb-1">Shares Received</div>
                      <div className="text-2xl font-bold text-primary">
                        {result.sharesReceived.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">shares</div>
                    </div>

                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="text-sm text-muted-foreground mb-1">Ownership Percentage</div>
                      <div className="text-2xl font-bold text-primary">{result.ownershipPercentage}%</div>
                      <div className="text-xs text-muted-foreground mt-1">of company</div>
                    </div>

                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="text-sm text-muted-foreground mb-1">Effective Valuation</div>
                      <div className="text-2xl font-bold text-primary">
                        ${parseFloat(result.effectiveValuation).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">post-money</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-background/50 border border-border mt-6">
                    <h4 className="font-semibold mb-2">Key Insights</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>
                        • Your SAFE converts at ${result.conversionPrice} per share, compared to the Series A 
                        price of ${pricePerShare}
                      </li>
                      <li>
                        • This represents a {(((parseFloat(pricePerShare) - parseFloat(result.conversionPrice)) / 
                        parseFloat(pricePerShare)) * 100).toFixed(1)}% discount to the Series A investors
                      </li>
                      <li>
                        • Your effective valuation of ${parseFloat(result.effectiveValuation).toLocaleString()} is{' '}
                        {parseFloat(result.effectiveValuation) < parseFloat(preMoneyValuation) ? 'lower' : 'higher'} than 
                        the Series A pre-money valuation
                      </li>
                    </ul>
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
