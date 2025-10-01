import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, BarChart3, Plus, X, TrendingDown, TrendingUp, Info, BookOpen, Lightbulb, AlertCircle, PieChart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Round {
  id: string;
  name: string;
  investment: number;
  valuation: number;
}

const DilutionCalculator = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('calculator');
  const [initialOwnership, setInitialOwnership] = useState('100');
  const [optionPool, setOptionPool] = useState('10');
  const [optionPoolTiming, setOptionPoolTiming] = useState<'pre' | 'post'>('pre');
  const [includeOptionPool, setIncludeOptionPool] = useState(false);
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
    const results: any[] = [];
    const poolSize = includeOptionPool ? parseFloat(optionPool) : 0;

    // Apply option pool dilution if pre-money
    if (includeOptionPool && optionPoolTiming === 'pre' && poolSize > 0) {
      const dilutionFactor = 1 - poolSize / 100;
      const newOwnership = currentOwnership * dilutionFactor;
      results.push({
        round: 'Option Pool Creation',
        investmentAmount: 0,
        postMoneyValuation: 0,
        newInvestorOwnership: poolSize,
        yourOwnershipBefore: currentOwnership,
        yourOwnershipAfter: newOwnership,
        dilution: currentOwnership - newOwnership,
        yourValueBefore: 0,
        yourValueAfter: 0,
        isOptionPool: true,
      });
      currentOwnership = newOwnership;
    }

    for (const round of rounds) {
      if (round.investment && round.valuation) {
        const newShares = (round.investment / round.valuation) * 100;
        const dilutionFactor = 1 - newShares / 100;
        const newOwnership = currentOwnership * dilutionFactor;
        const dilution = currentOwnership - newOwnership;

        const preMoneyVal = round.valuation - round.investment;

        results.push({
          round: round.name || 'Unnamed Round',
          investmentAmount: round.investment,
          postMoneyValuation: round.valuation,
          preMoneyValuation: preMoneyVal,
          newInvestorOwnership: newShares,
          yourOwnershipBefore: currentOwnership,
          yourOwnershipAfter: newOwnership,
          dilution: dilution,
          yourValueBefore: (currentOwnership / 100) * preMoneyVal,
          yourValueAfter: (newOwnership / 100) * round.valuation,
          isOptionPool: false,
        });

        currentOwnership = newOwnership;
      }
    }

    // Apply option pool dilution if post-money
    if (includeOptionPool && optionPoolTiming === 'post' && poolSize > 0 && results.length > 0) {
      const lastRound = results[results.length - 1];
      const dilutionFactor = 1 - poolSize / 100;
      const newOwnership = currentOwnership * dilutionFactor;
      results.push({
        round: 'Option Pool Creation',
        investmentAmount: 0,
        postMoneyValuation: lastRound.postMoneyValuation,
        newInvestorOwnership: poolSize,
        yourOwnershipBefore: currentOwnership,
        yourOwnershipAfter: newOwnership,
        dilution: currentOwnership - newOwnership,
        yourValueBefore: (currentOwnership / 100) * lastRound.postMoneyValuation,
        yourValueAfter: (newOwnership / 100) * lastRound.postMoneyValuation,
        isOptionPool: true,
      });
    }

    return results;
  };

  const results = calculateDilution();

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
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Financial Analysis</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight">Dilution Calculator</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Model ownership dilution across funding rounds and understand value creation
            </p>
          </div>

          {/* Executive Summary Banner */}
          {results.length > 0 && (
            <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-orange-400" />
                      <p className="text-sm text-gray-400">Ownership Change</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">{initialOwnership}%</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-2xl font-bold text-orange-400">
                        {results[results.length - 1].yourOwnershipAfter.toFixed(2)}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <Progress 
                        value={results[results.length - 1].yourOwnershipAfter} 
                        className="h-2"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-red-400" />
                      <p className="text-sm text-gray-400">Total Dilution</p>
                    </div>
                    <div className="text-2xl font-bold text-red-400">
                      {(parseFloat(initialOwnership) - results[results.length - 1].yourOwnershipAfter).toFixed(2)}%
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Across {results.filter(r => !r.isOptionPool).length} round{results.filter(r => !r.isOptionPool).length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <p className="text-sm text-gray-400">Value Created</p>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      ${Math.round(
                        results[results.length - 1].yourValueAfter - (results[0].yourValueBefore || 0)
                      ).toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Despite dilution</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <PieChart className="w-4 h-4 text-cyan-400" />
                      <p className="text-sm text-gray-400">Final Stake Value</p>
                    </div>
                    <div className="text-2xl font-bold text-cyan-400">
                      ${Math.round(results[results.length - 1].yourValueAfter).toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      At ${(results[results.length - 1].postMoneyValuation || 0).toLocaleString()} valuation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="calculator">Calculator</TabsTrigger>
                <TabsTrigger value="visualization">Visualization</TabsTrigger>
                <TabsTrigger value="education">Understanding Dilution</TabsTrigger>
                <TabsTrigger value="tips">Best Practices</TabsTrigger>
              </TabsList>

              {/* Calculator Tab */}
              <TabsContent value="calculator" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-white">Initial Setup</CardTitle>
                    <CardDescription className="text-gray-400">
                      Configure your starting ownership and option pool parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Initial Ownership (%)</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={initialOwnership}
                          onChange={(e) => setInitialOwnership(e.target.value)}
                          className="mt-2 bg-white/5 border-white/10 text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1">Founder ownership before any rounds</p>
                      </div>
                      
                      <div>
                        <Label className="text-white flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={includeOptionPool}
                            onChange={(e) => setIncludeOptionPool(e.target.checked)}
                            className="rounded"
                          />
                          Include Option Pool
                        </Label>
                        {includeOptionPool && (
                          <div className="mt-2 space-y-2">
                            <Input
                              type="number"
                              placeholder="10"
                              value={optionPool}
                              onChange={(e) => setOptionPool(e.target.value)}
                              className="bg-white/5 border-white/10 text-white"
                            />
                            <Select value={optionPoolTiming} onValueChange={(v) => setOptionPoolTiming(v as 'pre' | 'post')}>
                              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pre">Pre-money (dilutes founders)</SelectItem>
                                <SelectItem value="post">Post-money (dilutes investors too)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>

                    {includeOptionPool && (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex gap-2 items-start">
                          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-300">
                            <strong className="text-white">Option Pool Timing:</strong> Pre-money pools dilute founders before the round. 
                            Post-money pools dilute both founders and new investors proportionally.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">Funding Rounds</CardTitle>
                        <CardDescription className="text-gray-400">
                          Add rounds to model dilution over time
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={addRound} 
                        size="sm" 
                        className="gap-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border-cyan-500/30"
                      >
                        <Plus className="w-4 h-4" />
                        Add Round
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rounds.map((round, idx) => (
                        <div key={round.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-cyan-400 font-bold text-sm">{idx + 1}</span>
                            </div>
                            <Input
                              placeholder="Round name (e.g., Seed Round)"
                              value={round.name}
                              onChange={(e) => updateRound(round.id, 'name', e.target.value)}
                              className="flex-1 bg-white/5 border-white/10 text-white"
                            />
                            {rounds.length > 1 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeRound(round.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm text-gray-400">Investment Amount ($)</Label>
                              <Input
                                type="number"
                                placeholder="500,000"
                                value={round.investment || ''}
                                onChange={(e) => updateRound(round.id, 'investment', parseFloat(e.target.value) || 0)}
                                className="mt-1 bg-white/5 border-white/10 text-white"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-gray-400">Post-Money Valuation ($)</Label>
                              <Input
                                type="number"
                                placeholder="5,000,000"
                                value={round.valuation || ''}
                                onChange={(e) => updateRound(round.id, 'valuation', parseFloat(e.target.value) || 0)}
                                className="mt-1 bg-white/5 border-white/10 text-white"
                              />
                            </div>
                          </div>
                          {round.investment && round.valuation && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-400">Pre-money:</span>
                                  <span className="text-white ml-2 font-semibold">
                                    ${(round.valuation - round.investment).toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-400">New investor ownership:</span>
                                  <span className="text-cyan-400 ml-2 font-semibold">
                                    {((round.investment / round.valuation) * 100).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
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
              </TabsContent>

              {/* Visualization Tab - Continued in next part */}
            </Tabs>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default DilutionCalculator;
