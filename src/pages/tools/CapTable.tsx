import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { 
  ArrowLeft, Plus, X, PieChart as PieChartIcon, TrendingDown, 
  Users, DollarSign, Target, Info, AlertCircle, CheckCircle,
  ArrowRight, Percent, Shield, Award, Layers, Calculator
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';

interface Stakeholder {
  id: string;
  name: string;
  shares: number;
  shareClass: 'common' | 'preferred';
  roundAdded: string;
  liquidationPreference?: number;
  participatingPreferred?: boolean;
}

interface FundingRound {
  id: string;
  name: string;
  investmentAmount: number;
  preMoneyValuation: number;
  sharesIssued: number;
  pricePerShare: number;
  liquidationPreference: number;
  participating: boolean;
  date: string;
}

interface OptionPool {
  totalShares: number;
  allocated: number;
  exercised: number;
  unvested: number;
}

const CapTable = () => {
  const navigate = useNavigate();
  
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([
    { 
      id: '1', 
      name: 'Founders', 
      shares: 7000000, 
      shareClass: 'common',
      roundAdded: 'Formation'
    },
    { 
      id: '2', 
      name: 'Employee Option Pool', 
      shares: 1000000, 
      shareClass: 'common',
      roundAdded: 'Formation'
    },
  ]);

  const [fundingRounds, setFundingRounds] = useState<FundingRound[]>([]);
  
  const [optionPool, setOptionPool] = useState<OptionPool>({
    totalShares: 1000000,
    allocated: 250000,
    exercised: 100000,
    unvested: 150000,
  });

  const [newRoundName, setNewRoundName] = useState('');
  const [newRoundAmount, setNewRoundAmount] = useState('');
  const [newRoundPreMoney, setNewRoundPreMoney] = useState('');
  const [newRoundLiqPref, setNewRoundLiqPref] = useState('1');
  const [newRoundParticipating, setNewRoundParticipating] = useState(false);
  const [exitValuation, setExitValuation] = useState('');

  const totalShares = stakeholders.reduce((sum, s) => sum + s.shares, 0);
  const commonShares = stakeholders.filter(s => s.shareClass === 'common').reduce((sum, s) => sum + s.shares, 0);
  const preferredShares = stakeholders.filter(s => s.shareClass === 'preferred').reduce((sum, s) => sum + s.shares, 0);

  const addStakeholder = () => {
    setStakeholders([
      ...stakeholders,
      { 
        id: Date.now().toString(), 
        name: '', 
        shares: 0, 
        shareClass: 'common',
        roundAdded: 'Custom'
      },
    ]);
  };

  const removeStakeholder = (id: string) => {
    setStakeholders(stakeholders.filter((s) => s.id !== id));
  };

  const updateStakeholder = (id: string, field: keyof Stakeholder, value: any) => {
    setStakeholders(
      stakeholders.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const addFundingRound = () => {
    const amount = parseFloat(newRoundAmount);
    const preMoney = parseFloat(newRoundPreMoney);
    
    if (!newRoundName || !amount || !preMoney) return;

    const postMoney = preMoney + amount;
    const newOwnership = amount / postMoney;
    const newShares = (totalShares * newOwnership) / (1 - newOwnership);
    const pricePerShare = amount / newShares;

    const round: FundingRound = {
      id: Date.now().toString(),
      name: newRoundName,
      investmentAmount: amount,
      preMoneyValuation: preMoney,
      sharesIssued: Math.round(newShares),
      pricePerShare: pricePerShare,
      liquidationPreference: parseFloat(newRoundLiqPref),
      participating: newRoundParticipating,
      date: new Date().toISOString().split('T')[0],
    };

    setFundingRounds([...fundingRounds, round]);

    // Add new investors as stakeholders
    setStakeholders([
      ...stakeholders,
      {
        id: Date.now().toString(),
        name: `${newRoundName} Investors`,
        shares: Math.round(newShares),
        shareClass: 'preferred',
        roundAdded: newRoundName,
        liquidationPreference: parseFloat(newRoundLiqPref),
        participatingPreferred: newRoundParticipating,
      }
    ]);

    // Reset form
    setNewRoundName('');
    setNewRoundAmount('');
    setNewRoundPreMoney('');
    setNewRoundLiqPref('1');
    setNewRoundParticipating(false);
  };

  const calculateWaterfall = () => {
    if (!exitValuation) return null;

    const exit = parseFloat(exitValuation);
    let remaining = exit;
    const distribution: { name: string; amount: number; percentage: number }[] = [];

    // Sort preferred shareholders by round (most recent first for liquidation preference)
    const preferredHolders = stakeholders.filter(s => s.shareClass === 'preferred');
    
    // Pay liquidation preferences first
    preferredHolders.forEach(holder => {
      const liqPref = (holder.liquidationPreference || 1) * (holder.shares / totalShares) * exit;
      const payout = Math.min(liqPref, remaining);
      distribution.push({
        name: holder.name,
        amount: payout,
        percentage: (payout / exit) * 100
      });
      remaining -= payout;
    });

    // Distribute remaining pro-rata
    if (remaining > 0) {
      stakeholders.forEach(holder => {
        const proRata = (holder.shares / totalShares) * remaining;
        const existing = distribution.find(d => d.name === holder.name);
        if (existing) {
          existing.amount += proRata;
          existing.percentage = (existing.amount / exit) * 100;
        } else {
          distribution.push({
            name: holder.name,
            amount: proRata,
            percentage: (proRata / exit) * 100
          });
        }
      });
    }

    return distribution.sort((a, b) => b.amount - a.amount);
  };

  const waterfall = calculateWaterfall();

  const getColor = (index: number) => {
    const colors = [
      'bg-cyan-500',
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    return colors[index % colors.length];
  };

  const getColorClass = (index: number) => {
    const colors = [
      'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
      'text-blue-400 border-blue-500/30 bg-blue-500/10',
      'text-purple-400 border-purple-500/30 bg-purple-500/10',
      'text-pink-400 border-pink-500/30 bg-pink-500/10',
      'text-green-400 border-green-500/30 bg-green-500/10',
      'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
      'text-orange-400 border-orange-500/30 bg-orange-500/10',
      'text-red-400 border-red-500/30 bg-red-500/10',
      'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
      'text-teal-400 border-teal-500/30 bg-teal-500/10',
    ];
    return colors[index % colors.length];
  };

  const totalInvested = fundingRounds.reduce((sum, r) => sum + r.investmentAmount, 0);
  const latestValuation = fundingRounds.length > 0 
    ? fundingRounds[fundingRounds.length - 1].preMoneyValuation + fundingRounds[fundingRounds.length - 1].investmentAmount
    : 0;

  return (
    <AuthGuard>
      <div className="min-h-screen relative bg-[#0A0F1C]">
        <StarField />
        
        <div className="relative z-10 container mx-auto px-4 py-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')} 
            className="mb-6 gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20 p-8">
              <div className="relative z-10">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                        <PieChartIcon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <h1 className="text-4xl font-bold text-white">Cap Table Manager</h1>
                    </div>
                    <p className="text-cyan-100/70 text-lg max-w-2xl">
                      Model ownership, track dilution, and analyze exit scenarios across funding rounds
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <div className="text-cyan-100/60 text-sm mb-1">Total Shares</div>
                      <div className="text-2xl font-bold text-white">{(totalShares / 1000000).toFixed(1)}M</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <div className="text-cyan-100/60 text-sm mb-1">Stakeholders</div>
                      <div className="text-2xl font-bold text-white">{stakeholders.length}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      <Layers className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-white/60 text-xs">Common Shares</div>
                      <div className="text-xl font-bold text-white">{(commonShares / 1000000).toFixed(2)}M</div>
                      <div className="text-cyan-400 text-xs">{((commonShares / totalShares) * 100).toFixed(1)}% of total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Shield className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-white/60 text-xs">Preferred Shares</div>
                      <div className="text-xl font-bold text-white">{(preferredShares / 1000000).toFixed(2)}M</div>
                      <div className="text-purple-400 text-xs">{((preferredShares / totalShares) * 100).toFixed(1)}% of total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-white/60 text-xs">Total Invested</div>
                      <div className="text-xl font-bold text-white">${(totalInvested / 1000000).toFixed(1)}M</div>
                      <div className="text-green-400 text-xs">{fundingRounds.length} rounds</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                      <Target className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-white/60 text-xs">Latest Valuation</div>
                      <div className="text-xl font-bold text-white">
                        {latestValuation > 0 ? `$${(latestValuation / 1000000).toFixed(1)}M` : 'N/A'}
                      </div>
                      <div className="text-orange-400 text-xs">post-money</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="stakeholders" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 bg-white/5 border border-white/10">
                <TabsTrigger value="stakeholders" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  Stakeholders
                </TabsTrigger>
                <TabsTrigger value="rounds" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  Funding Rounds
                </TabsTrigger>
                <TabsTrigger value="options" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  Option Pool
                </TabsTrigger>
                <TabsTrigger value="waterfall" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  Exit Analysis
                </TabsTrigger>
                <TabsTrigger value="education" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  Education
                </TabsTrigger>
              </TabsList>

              {/* Stakeholders Tab */}
              <TabsContent value="stakeholders" className="space-y-6">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl text-white flex items-center gap-2">
                          <Users className="w-5 h-5 text-cyan-400" />
                          Stakeholder Management
                        </CardTitle>
                        <CardDescription className="text-white/60">
                          Add and manage all equity holders
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={addStakeholder} 
                        className="gap-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30"
                      >
                        <Plus className="w-4 h-4" />
                        Add Stakeholder
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stakeholders.map((stakeholder, index) => (
                      <div key={stakeholder.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          <div className={`w-8 h-8 rounded-full ${getColor(index)} flex items-center justify-center`}>
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          </div>
                          
                          <div className="md:col-span-3">
                            <Input
                              placeholder="Stakeholder name"
                              value={stakeholder.name}
                              onChange={(e) => updateStakeholder(stakeholder.id, 'name', e.target.value)}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Input
                              type="number"
                              placeholder="Shares"
                              value={stakeholder.shares || ''}
                              onChange={(e) => updateStakeholder(stakeholder.id, 'shares', parseFloat(e.target.value) || 0)}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Select 
                              value={stakeholder.shareClass} 
                              onValueChange={(value: 'common' | 'preferred') => 
                                updateStakeholder(stakeholder.id, 'shareClass', value)
                              }
                            >
                              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="common">Common</SelectItem>
                                <SelectItem value="preferred">Preferred</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="md:col-span-2">
                            <Input
                              placeholder="Round"
                              value={stakeholder.roundAdded}
                              onChange={(e) => updateStakeholder(stakeholder.id, 'roundAdded', e.target.value)}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                          </div>

                          <div className="flex items-center gap-2 md:col-span-2">
                            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
                              {((stakeholder.shares / totalShares) * 100).toFixed(2)}%
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStakeholder(stakeholder.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Ownership Visualization */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">Ownership Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {stakeholders.map((stakeholder, index) => {
                        const percentage = (stakeholder.shares / totalShares) * 100;
                        return (
                          <div key={stakeholder.id}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${getColor(index)}`} />
                                <span className="font-medium text-white text-sm">
                                  {stakeholder.name || 'Unnamed'}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    stakeholder.shareClass === 'preferred' 
                                      ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' 
                                      : 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10'
                                  }`}
                                >
                                  {stakeholder.shareClass}
                                </Badge>
                              </div>
                              <span className="font-semibold text-cyan-400">{percentage.toFixed(2)}%</span>
                            </div>
                            <Progress 
                              value={percentage} 
                              className="h-2 bg-white/5"
                            />
                            <div className="text-xs text-white/50 mt-1">
                              {stakeholder.shares.toLocaleString()} shares · {stakeholder.roundAdded}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">Share Class Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-cyan-400" />
                            <h4 className="font-semibold text-white">Common Stock</h4>
                          </div>
                          <span className="text-2xl font-bold text-cyan-400">
                            {((commonShares / totalShares) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={(commonShares / totalShares) * 100} 
                          className="h-2 bg-white/10 mb-2"
                        />
                        <div className="text-sm text-white/70">
                          {commonShares.toLocaleString()} shares
                        </div>
                        <div className="text-xs text-white/50 mt-1">
                          Typically held by founders and employees
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-purple-400" />
                            <h4 className="font-semibold text-white">Preferred Stock</h4>
                          </div>
                          <span className="text-2xl font-bold text-purple-400">
                            {((preferredShares / totalShares) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={(preferredShares / totalShares) * 100} 
                          className="h-2 bg-white/10 mb-2"
                        />
                        <div className="text-sm text-white/70">
                          {preferredShares.toLocaleString()} shares
                        </div>
                        <div className="text-xs text-white/50 mt-1">
                          Held by investors with liquidation preferences
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Funding Rounds Tab */}
              <TabsContent value="rounds" className="space-y-6">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      Add Funding Round
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Model new investment rounds and track dilution
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white/80">Round Name</Label>
                        <Input
                          placeholder="e.g., Seed, Series A"
                          value={newRoundName}
                          onChange={(e) => setNewRoundName(e.target.value)}
                          className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        />
                      </div>

                      <div>
                        <Label className="text-white/80">Investment Amount ($)</Label>
                        <Input
                          type="number"
                          placeholder="2,000,000"
                          value={newRoundAmount}
                          onChange={(e) => setNewRoundAmount(e.target.value)}
                          className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        />
                      </div>

                      <div>
                        <Label className="text-white/80">Pre-Money Valuation ($)</Label>
                        <Input
                          type="number"
                          placeholder="8,000,000"
                          value={newRoundPreMoney}
                          onChange={(e) => setNewRoundPreMoney(e.target.value)}
                          className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        />
                      </div>

                      <div>
                        <Label className="text-white/80">Liquidation Preference (x)</Label>
                        <Select value={newRoundLiqPref} onValueChange={setNewRoundLiqPref}>
                          <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1x (Standard)</SelectItem>
                            <SelectItem value="1.5">1.5x</SelectItem>
                            <SelectItem value="2">2x</SelectItem>
                            <SelectItem value="3">3x</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="participating"
                        checked={newRoundParticipating}
                        onChange={(e) => setNewRoundParticipating(e.target.checked)}
                        className="rounded border-white/20"
                      />
                      <Label htmlFor="participating" className="text-white/80">
                        Participating Preferred (double-dip)
                      </Label>
                    </div>

                    <Button 
                      onClick={addFundingRound}
                      className="w-full bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30"
                      disabled={!newRoundName || !newRoundAmount || !newRoundPreMoney}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Funding Round
                    </Button>
                  </CardContent>
                </Card>

                {/* Funding History */}
                {fundingRounds.length > 0 && (
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">Funding History</CardTitle>
                      <CardDescription className="text-white/60">
                        Track all completed financing rounds
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {fundingRounds.map((round, index) => (
                        <div key={round.id} className={`p-4 rounded-xl border ${getColorClass(index)}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-white text-lg">{round.name}</h4>
                              <div className="text-xs text-white/50">{round.date}</div>
                            </div>
                            <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10">
                              ${(round.investmentAmount / 1000000).toFixed(1)}M raised
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-white/50 text-xs">Pre-Money</div>
                              <div className="text-white font-medium">${(round.preMoneyValuation / 1000000).toFixed(1)}M</div>
                            </div>
                            <div>
                              <div className="text-white/50 text-xs">Post-Money</div>
                              <div className="text-white font-medium">
                                ${((round.preMoneyValuation + round.investmentAmount) / 1000000).toFixed(1)}M
                              </div>
                            </div>
                            <div>
                              <div className="text-white/50 text-xs">Price/Share</div>
                              <div className="text-white font-medium">${round.pricePerShare.toFixed(4)}</div>
                            </div>
                            <div>
                              <div className="text-white/50 text-xs">Shares Issued</div>
                              <div className="text-white font-medium">{(round.sharesIssued / 1000000).toFixed(2)}M</div>
                            </div>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10 text-xs">
                              {round.liquidationPreference}x Liquidation Preference
                            </Badge>
                            {round.participating && (
                              <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 bg-yellow-500/10 text-xs">
                                Participating
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Option Pool Tab */}
              <TabsContent value="options" className="space-y-6">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-400" />
                      Employee Option Pool
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Manage equity reserved for employee compensation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white/80">Total Pool Size</Label>
                        <Input
                          type="number"
                          value={optionPool.totalShares}
                          onChange={(e) => setOptionPool({...optionPool, totalShares: parseFloat(e.target.value) || 0})}
                          className="mt-2 bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white/80">Allocated to Employees</Label>
                        <Input
                          type="number"
                          value={optionPool.allocated}
                          onChange={(e) => setOptionPool({...optionPool, allocated: parseFloat(e.target.value) || 0})}
                          className="mt-2 bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white/80">Exercised</Label>
                        <Input
                          type="number"
                          value={optionPool.exercised}
                          onChange={(e) => setOptionPool({...optionPool, exercised: parseFloat(e.target.value) || 0})}
                          className="mt-2 bg-white/5 border-white/10 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white/80">Unvested</Label>
                        <Input
                          type="number"
                          value={optionPool.unvested}
                          onChange={(e) => setOptionPool({...optionPool, unvested: parseFloat(e.target.value) || 0})}
                          className="mt-2 bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4 text-yellow-400" />
                          <div className="text-sm text-yellow-100/60">Available Pool</div>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {((optionPool.totalShares - optionPool.allocated) / 1000000).toFixed(2)}M
                        </div>
                        <div className="text-xs text-yellow-100/50 mt-1">
                          {(((optionPool.totalShares - optionPool.allocated) / optionPool.totalShares) * 100).toFixed(1)}% remaining
                        </div>
                        <Progress 
                          value={((optionPool.totalShares - optionPool.allocated) / optionPool.totalShares) * 100} 
                          className="mt-2 h-1 bg-white/10"
                        />
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <div className="text-sm text-green-100/60">Vested & Exercised</div>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {(optionPool.exercised / 1000000).toFixed(2)}M
                        </div>
                        <div className="text-xs text-green-100/50 mt-1">
                          {((optionPool.exercised / optionPool.totalShares) * 100).toFixed(1)}% of pool
                        </div>
                        <Progress 
                          value={(optionPool.exercised / optionPool.totalShares) * 100} 
                          className="mt-2 h-1 bg-white/10"
                        />
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className="w-4 h-4 text-blue-400" />
                          <div className="text-sm text-blue-100/60">Unvested</div>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {(optionPool.unvested / 1000000).toFixed(2)}M
                        </div>
                        <div className="text-xs text-blue-100/50 mt-1">
                          {((optionPool.unvested / optionPool.totalShares) * 100).toFixed(1)}% of pool
                        </div>
                        <Progress 
                          value={(optionPool.unvested / optionPool.totalShares) * 100} 
                          className="mt-2 h-1 bg-white/10"
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-white/80">
                          <p className="font-semibold text-white mb-1">Option Pool Best Practices</p>
                          <p className="mb-2">Typical option pools range from 10-20% of fully diluted shares. Consider refreshing the pool before major funding rounds to avoid excessive dilution.</p>
                          <ul className="space-y-1 text-xs text-white/60">
                            <li>• Seed stage: 10-15% option pool</li>
                            <li>• Series A: 15-20% option pool (refreshed)</li>
                            <li>• Vesting schedules typically span 4 years with 1-year cliff</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Exit Analysis Tab */}
              <TabsContent value="waterfall" className="space-y-6">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-orange-400" />
                      Exit Scenario Modeling
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Analyze liquidation waterfall and returns for different exit valuations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-white/80">Exit Valuation ($)</Label>
                      <Input
                        type="number"
                        placeholder="50,000,000"
                        value={exitValuation}
                        onChange={(e) => setExitValuation(e.target.value)}
                        className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                      <p className="text-xs text-white/50 mt-1">
                        Model acquisition price or IPO valuation
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {waterfall && waterfall.length > 0 && (
                  <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <CardTitle className="text-xl text-white">Liquidation Waterfall</CardTitle>
                      <CardDescription className="text-white/60">
                        Distribution of proceeds at ${(parseFloat(exitValuation) / 1000000).toFixed(1)}M exit
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {waterfall.map((item, index) => (
                        <div key={index} className={`p-4 rounded-xl border ${getColorClass(index)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getColor(index)}`} />
                              <span className="font-medium text-white">{item.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-white">
                                ${(item.amount / 1000000).toFixed(2)}M
                              </div>
                              <div className="text-xs text-white/60">{item.percentage.toFixed(2)}% of exit</div>
                            </div>
                          </div>
                          <Progress 
                            value={item.percentage} 
                            className="h-2 bg-white/10"
                          />
                        </div>
                      ))}

                      <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 mt-6">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-white/80">
                            <p className="font-semibold text-white mb-1">Waterfall Methodology</p>
                            <p>This analysis accounts for liquidation preferences and participating preferred rights. Preferred shareholders receive their preference amount first, then remaining proceeds are distributed pro-rata.</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Education Tab */}
              <TabsContent value="education" className="space-y-6">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white flex items-center gap-2">
                      <Info className="w-5 h-5 text-cyan-400" />
                      Cap Table Fundamentals
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Essential concepts for managing equity and ownership
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="space-y-2">
                      <AccordionItem value="what-is" className="border-white/10 bg-white/5 rounded-xl px-4">
                        <AccordionTrigger className="text-white hover:text-cyan-400 hover:no-underline">
                          What is a Cap Table?
                        </AccordionTrigger>
                        <AccordionContent className="text-white/70 space-y-2">
                          <p>
                            A capitalization table (cap table) is a spreadsheet or ledger that shows who owns what in your company. 
                            It tracks all securities including common stock, preferred stock, options, warrants, and convertible notes.
                          </p>
                          <p>
                            The cap table is critical for understanding dilution, planning future fundraising, and managing employee equity compensation.
                            It becomes increasingly complex with each funding round and option grant.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="common-vs-preferred" className="border-white/10 bg-white/5 rounded-xl px-4">
                        <AccordionTrigger className="text-white hover:text-cyan-400 hover:no-underline">
                          Common vs. Preferred Stock
                        </AccordionTrigger>
                        <AccordionContent className="text-white/70 space-y-2">
                          <div>
                            <p className="font-semibold text-cyan-400 mb-1">Common Stock:</p>
                            <ul className="space-y-1 text-sm">
                              <li>• Typically issued to founders and employees</li>
                              <li>• Last in line during liquidation (after preferred)</li>
                              <li>• Usually has voting rights</li>
                              <li>• No liquidation preference or special rights</li>
                            </ul>
                          </div>
                          <div>
                            <p className="font-semibold text-purple-400 mb-1 mt-3">Preferred Stock:</p>
                            <ul className="space-y-1 text-sm">
                              <li>• Issued to investors in financing rounds</li>
                              <li>• Priority in liquidation (paid before common)</li>
                              <li>• Often includes liquidation preferences (1x, 2x, etc.)</li>
                              <li>• May have anti-dilution protection</li>
                              <li>• Can be participating (double-dip) or non-participating</li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="liquidation-preference" className="border-white/10 bg-white/5 rounded-xl px-4">
                        <AccordionTrigger className="text-white hover:text-cyan-400 hover:no-underline">
                          Liquidation Preferences Explained
                        </AccordionTrigger>
                        <AccordionContent className="text-white/70 space-y-2">
                          <p>
                            Liquidation preferences determine the order and amounts paid to shareholders in an exit event 
                            (acquisition, IPO, or company shutdown).
                          </p>
                          <div>
                            <p className="font-semibold text-white mb-1">Common Structures:</p>
                            <ul className="space-y-2 text-sm">
                              <li>
                                <span className="text-cyan-400">1x Non-Participating:</span> Investor gets back 1x their investment OR 
                                their pro-rata share of proceeds, whichever is greater (most common and founder-friendly).
                              </li>
                              <li>
                                <span className="text-yellow-400">1x Participating:</span> Investor gets 1x their investment PLUS 
                                their pro-rata share of remaining proceeds (double-dip, less founder-friendly).
                              </li>
                              <li>
                                <span className="text-orange-400">2x or 3x:</span> Higher multiples sometimes seen in down rounds 
                                or distressed situations.
                              </li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="dilution" className="border-white/10 bg-white/5 rounded-xl px-4">
                        <AccordionTrigger className="text-white hover:text-cyan-400 hover:no-underline">
                          Understanding Dilution
                        </AccordionTrigger>
                        <AccordionContent className="text-white/70 space-y-2">
                          <p>
                            Dilution occurs when a company issues new shares, reducing existing shareholders' percentage ownership. 
                            While your ownership percentage decreases, the company value may increase, potentially making your 
                            stake more valuable overall.
                          </p>
                          <div>
                            <p className="font-semibold text-white mb-1">Example:</p>
                            <p className="text-sm bg-white/5 p-3 rounded-lg">
                              You own 1M shares out of 10M total (10%). Company raises $2M by issuing 2M new shares. 
                              You now own 1M out of 12M total (8.33%). You were diluted by 1.67 percentage points, 
                              but if the valuation increased significantly, your stake could be worth more.
                            </p>
                          </div>
                          <div className="text-yellow-400 text-sm mt-3">
                            <strong>Pro tip:</strong> Focus on the absolute value of your stake, not just the percentage. 
                            A smaller slice of a bigger pie can be better than a larger slice of a smaller pie.
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="option-pool" className="border-white/10 bg-white/5 rounded-xl px-4">
                        <AccordionTrigger className="text-white hover:text-cyan-400 hover:no-underline">
                          Managing the Option Pool
                        </AccordionTrigger>
                        <AccordionContent className="text-white/70 space-y-2">
                          <p>
                            The option pool is equity reserved for employee compensation. Typically 10-20% of fully diluted shares, 
                            it allows companies to attract and retain talent with equity incentives.
                          </p>
                          <div>
                            <p className="font-semibold text-white mb-1">Key Concepts:</p>
                            <ul className="space-y-2 text-sm">
                              <li>
                                <span className="text-cyan-400">Fully Diluted:</span> Include all outstanding shares plus options, 
                                warrants, and convertible securities
                              </li>
                              <li>
                                <span className="text-green-400">Vesting:</span> Options typically vest over 4 years with a 1-year cliff 
                                (earn 25% after 1 year, then monthly thereafter)
                              </li>
                              <li>
                                <span className="text-purple-400">Strike Price:</span> The price employees pay to exercise options, 
                                usually set at fair market value at grant time
                              </li>
                              <li>
                                <span className="text-orange-400">409A Valuation:</span> Independent valuation required to set strike 
                                prices for US companies
                              </li>
                            </ul>
                          </div>
                          <div className="text-yellow-400 text-sm mt-3">
                            <strong>Important:</strong> The option pool is usually created BEFORE a funding round to avoid 
                            diluting investors. Negotiate pool size carefully as it dilutes founders.
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="best-practices" className="border-white/10 bg-white/5 rounded-xl px-4">
                        <AccordionTrigger className="text-white hover:text-cyan-400 hover:no-underline">
                          Cap Table Management Best Practices
                        </AccordionTrigger>
                        <AccordionContent className="text-white/70 space-y-2">
                          <div>
                            <p className="font-semibold text-white mb-2">Essential Practices:</p>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span>Keep your cap table updated in real-time with every equity event</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span>Use proper cap table software (Carta, Pulley, AngelList) as you scale</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span>Model dilution before each funding round to understand impact</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span>Get legal counsel to review equity documents and ensure compliance</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span>Communicate clearly with employees about their equity and vesting schedules</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span>Plan for future rounds - maintain enough ownership to stay motivated</span>
                              </li>
                            </ul>
                          </div>
                          <div className="text-red-400 text-sm mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                            <strong>Common Mistakes to Avoid:</strong>
                            <ul className="mt-2 space-y-1">
                              <li>• Not tracking option exercises and expirations</li>
                              <li>• Issuing too much equity early without vesting</li>
                              <li>• Ignoring tax implications of equity compensation</li>
                              <li>• Creating too many share classes (complexity nightmare)</li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
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

export default CapTable;
