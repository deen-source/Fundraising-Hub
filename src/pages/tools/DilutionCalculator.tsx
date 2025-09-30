import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, BarChart3, Plus, X } from 'lucide-react';

interface Round {
  id: string;
  name: string;
  investment: number;
  valuation: number;
}

const DilutionCalculator = () => {
  const navigate = useNavigate();
  const [initialOwnership, setInitialOwnership] = useState('100');
  const [rounds, setRounds] = useState<Round[]>([
    { id: '1', name: 'Seed Round', investment: 500000, valuation: 5000000 },
  ]);

  const addRound = () => {
    setRounds([
      ...rounds,
      { id: Date.now().toString(), name: '', investment: 0, valuation: 0 },
    ]);
  };

  const removeRound = (id: string) => {
    setRounds(rounds.filter((r) => r.id !== id));
  };

  const updateRound = (id: string, field: keyof Round, value: string | number) => {
    setRounds(rounds.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const calculateDilution = () => {
    let currentOwnership = parseFloat(initialOwnership);
    const results = [];

    for (const round of rounds) {
      if (round.investment && round.valuation) {
        const newShares = (round.investment / round.valuation) * 100;
        const dilutionFactor = 1 - newShares / 100;
        const newOwnership = currentOwnership * dilutionFactor;
        const dilution = currentOwnership - newOwnership;

        results.push({
          round: round.name || 'Unnamed Round',
          investmentAmount: round.investment,
          postMoneyValuation: round.valuation,
          newInvestorOwnership: newShares,
          yourOwnershipBefore: currentOwnership,
          yourOwnershipAfter: newOwnership,
          dilution: dilution,
          yourValueBefore: (currentOwnership / 100) * (round.valuation - round.investment),
          yourValueAfter: (newOwnership / 100) * round.valuation,
        });

        currentOwnership = newOwnership;
      }
    }

    return results;
  };

  const results = calculateDilution();

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

          <div className="max-w-6xl mx-auto space-y-6">
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <BarChart3 className="w-8 h-8 text-primary" />
                  Dilution Calculator
                </CardTitle>
                <CardDescription>
                  Calculate ownership dilution across multiple funding rounds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Initial Ownership (%)</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={initialOwnership}
                    onChange={(e) => setInitialOwnership(e.target.value)}
                    className="mt-2 bg-background/50"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg font-semibold">Funding Rounds</Label>
                    <Button onClick={addRound} size="sm" variant="outline" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Round
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {rounds.map((round) => (
                      <div key={round.id} className="p-4 rounded-lg bg-background/50 border border-border">
                        <div className="flex items-center gap-3 mb-3">
                          <Input
                            placeholder="Round name"
                            value={round.name}
                            onChange={(e) => updateRound(round.id, 'name', e.target.value)}
                            className="flex-1 bg-background/50"
                          />
                          <Button variant="ghost" size="sm" onClick={() => removeRound(round.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm">Investment Amount ($)</Label>
                            <Input
                              type="number"
                              placeholder="500,000"
                              value={round.investment || ''}
                              onChange={(e) => updateRound(round.id, 'investment', parseFloat(e.target.value) || 0)}
                              className="mt-1 bg-background/50"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Post-Money Valuation ($)</Label>
                            <Input
                              type="number"
                              placeholder="5,000,000"
                              value={round.valuation || ''}
                              onChange={(e) => updateRound(round.id, 'valuation', parseFloat(e.target.value) || 0)}
                              className="mt-1 bg-background/50"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {results.length > 0 && (
              <>
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle>Dilution Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-2">Round</th>
                            <th className="text-right p-2">Investment</th>
                            <th className="text-right p-2">Valuation</th>
                            <th className="text-right p-2">Before</th>
                            <th className="text-right p-2">After</th>
                            <th className="text-right p-2">Dilution</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((result, idx) => (
                            <tr key={idx} className="border-b border-border/50">
                              <td className="p-2 font-medium">{result.round}</td>
                              <td className="text-right p-2">${result.investmentAmount.toLocaleString()}</td>
                              <td className="text-right p-2">${result.postMoneyValuation.toLocaleString()}</td>
                              <td className="text-right p-2 text-primary">{result.yourOwnershipBefore.toFixed(2)}%</td>
                              <td className="text-right p-2 text-primary">{result.yourOwnershipAfter.toFixed(2)}%</td>
                              <td className="text-right p-2 text-red-400">-{result.dilution.toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle>Value Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {results.map((result, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-background/50 border border-border">
                          <div className="font-semibold mb-3">{result.round}</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Your Value Before</div>
                              <div className="text-lg font-bold text-primary">
                                ${Math.round(result.yourValueBefore).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Your Value After</div>
                              <div className="text-lg font-bold text-primary">
                                ${Math.round(result.yourValueAfter).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Value Change</div>
                              <div className="text-lg font-bold text-green-500">
                                +${Math.round(result.yourValueAfter - result.yourValueBefore).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <h4 className="font-semibold mb-2">Key Insight</h4>
                      <p className="text-sm text-muted-foreground">
                        While your ownership percentage decreased from {initialOwnership}% to{' '}
                        {results[results.length - 1].yourOwnershipAfter.toFixed(2)}%, the absolute value of your stake
                        increased by $
                        {Math.round(
                          results[results.length - 1].yourValueAfter - results[0].yourValueBefore
                        ).toLocaleString()}
                        . This is the benefit of dilution with value creation.
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

export default DilutionCalculator;
