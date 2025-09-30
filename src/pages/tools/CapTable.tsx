import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, Plus, X, PieChart as PieChartIcon } from 'lucide-react';

interface Stakeholder {
  id: string;
  name: string;
  shares: number;
}

const CapTable = () => {
  const navigate = useNavigate();
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([
    { id: '1', name: 'Founders', shares: 8000000 },
    { id: '2', name: 'Employees (Option Pool)', shares: 1000000 },
  ]);
  const [newRoundShares, setNewRoundShares] = useState('');
  const [newRoundAmount, setNewRoundAmount] = useState('');

  const totalShares = stakeholders.reduce((sum, s) => sum + s.shares, 0);
  const newRound = parseFloat(newRoundShares) || 0;
  const totalAfterRound = totalShares + newRound;

  const addStakeholder = () => {
    setStakeholders([
      ...stakeholders,
      { id: Date.now().toString(), name: '', shares: 0 },
    ]);
  };

  const removeStakeholder = (id: string) => {
    setStakeholders(stakeholders.filter((s) => s.id !== id));
  };

  const updateStakeholder = (id: string, field: 'name' | 'shares', value: string | number) => {
    setStakeholders(
      stakeholders.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const getColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-teal-500',
    ];
    return colors[index % colors.length];
  };

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
                  <PieChartIcon className="w-8 h-8 text-primary" />
                  Cap Table Simulator
                </CardTitle>
                <CardDescription>
                  Visualize ownership and model dilution scenarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg font-semibold">Current Stakeholders</Label>
                    <Button onClick={addStakeholder} size="sm" variant="outline" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Stakeholder
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {stakeholders.map((stakeholder, index) => (
                      <div key={stakeholder.id} className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${getColor(index)}`} />
                        <Input
                          placeholder="Stakeholder name"
                          value={stakeholder.name}
                          onChange={(e) => updateStakeholder(stakeholder.id, 'name', e.target.value)}
                          className="flex-1 bg-background/50"
                        />
                        <Input
                          type="number"
                          placeholder="Shares"
                          value={stakeholder.shares || ''}
                          onChange={(e) =>
                            updateStakeholder(stakeholder.id, 'shares', parseFloat(e.target.value) || 0)
                          }
                          className="w-40 bg-background/50"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStakeholder(stakeholder.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <Label className="text-lg font-semibold mb-4 block">Model New Round</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>New Shares Issued</Label>
                      <Input
                        type="number"
                        placeholder="1,000,000"
                        value={newRoundShares}
                        onChange={(e) => setNewRoundShares(e.target.value)}
                        className="mt-2 bg-background/50"
                      />
                    </div>
                    <div>
                      <Label>Investment Amount ($)</Label>
                      <Input
                        type="number"
                        placeholder="2,000,000"
                        value={newRoundAmount}
                        onChange={(e) => setNewRoundAmount(e.target.value)}
                        className="mt-2 bg-background/50"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card border-primary/20">
                <CardHeader>
                  <CardTitle>Current Ownership</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stakeholders.map((stakeholder, index) => {
                    const percentage = (stakeholder.shares / totalShares) * 100;
                    return (
                      <div key={stakeholder.id}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getColor(index)}`} />
                            <span className="font-medium">{stakeholder.name || 'Unnamed'}</span>
                          </div>
                          <span className="font-semibold text-primary">{percentage.toFixed(2)}%</span>
                        </div>
                        <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getColor(index)}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {stakeholder.shares.toLocaleString()} shares
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between font-semibold">
                      <span>Total Shares</span>
                      <span>{totalShares.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {newRound > 0 && (
                <Card className="glass-card border-primary/20">
                  <CardHeader>
                    <CardTitle>After New Round</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stakeholders.map((stakeholder, index) => {
                      const newPercentage = (stakeholder.shares / totalAfterRound) * 100;
                      const oldPercentage = (stakeholder.shares / totalShares) * 100;
                      const dilution = oldPercentage - newPercentage;
                      return (
                        <div key={stakeholder.id}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getColor(index)}`} />
                              <span className="font-medium">{stakeholder.name || 'Unnamed'}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-primary">
                                {newPercentage.toFixed(2)}%
                              </span>
                              <div className="text-xs text-red-400">
                                -{dilution.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                          <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getColor(index)}`}
                              style={{ width: `${newPercentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-primary" />
                          <span className="font-medium">New Investors</span>
                        </div>
                        <span className="font-semibold text-primary">
                          {((newRound / totalAfterRound) * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(newRound / totalAfterRound) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {newRound.toLocaleString()} shares
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border space-y-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total Shares</span>
                        <span>{totalAfterRound.toLocaleString()}</span>
                      </div>
                      {newRoundAmount && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Price per Share</span>
                          <span>
                            ${(parseFloat(newRoundAmount) / newRound).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default CapTable;
