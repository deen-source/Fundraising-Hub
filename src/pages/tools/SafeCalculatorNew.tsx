/**
 * YC Post-Money SAFE Calculator
 *
 * Comprehensive tool for modeling SAFE conversions in equity financing
 * and liquidity events with full YC post-money mechanics.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, Calculator, Plus, Trash2, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import math engine
import { calculate } from '@/lib/math';
import { formatAUD, formatShares, formatPricePerShare, formatPercent } from '@/lib/format';
import type { CalculatorInputs, SAFE, EquityPathResult, LiquidityPathResult } from '@/lib/types';

const SafeCalculatorNew = () => {
  const navigate = useNavigate();

  // Form state
  const [capTable, setCapTable] = useState({
    S_out: 8_000_000,
    Opt_out: 800_000,
    Promised: 200_000,
    Pool_unissued: 1_000_000,
    Founder_shares: 6_500_000,
  });
  const [safes, setSafes] = useState<SAFE[]>([]);
  const [pricedRound, setPricedRound] = useState({
    newMoneyTotal: 5_000_000,
    leadAmount: 3_500_000,
    otherAmount: 1_500_000,
    preMoneyValuation: 20_000_000,
    poolTargetPct: 0.10,
    qualifiedThreshold: 2_000_000,
  });
  const [liquidityEvent, setLiquidityEvent] = useState({
    purchasePrice: 0,
    includePromisedInProceeds: false,
  });

  // Results state
  const [results, setResults] = useState<{ equity: any; liquidity: any } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Helper functions for formatting inputs with thousand separators
  const formatNumberInput = (value: number): string => {
    return value.toLocaleString('en-US');
  };

  const parseNumberInput = (value: string): number => {
    const parsed = parseFloat(value.replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  // Handle computation
  const handleCompute = () => {
    setValidationErrors([]);

    // Validation
    const errors: string[] = [];

    if (Math.abs(pricedRound.leadAmount + pricedRound.otherAmount - pricedRound.newMoneyTotal) > 0.01) {
      errors.push('Lead amount + Other amount must equal total new money');
    }

    if (safes.length === 0) {
      errors.push('At least one SAFE is required');
    }

    safes.forEach((safe, idx) => {
      if (safe.purchaseAmount <= 0) errors.push(`SAFE ${idx + 1}: Investment amount must be > 0`);
      if (safe.postMoneyCap <= 0) errors.push(`SAFE ${idx + 1}: Valuation cap must be > 0`);
      if (safe.discount < 0 || safe.discount > 1) errors.push(`SAFE ${idx + 1}: Discount must be between 0% and 100%`);
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Run calculation
    const inputs: CalculatorInputs = {
      capTable,
      safes,
      pricedRound,
      liquidityEvent,
    };

    const output = calculate(inputs);
    setResults(output);
  };

  // Add SAFE
  const handleAddSafe = () => {
    const maxRoundIndex = safes.length > 0 ? Math.max(...safes.map(s => s.roundIndex)) : -1;
    setSafes([...safes, {
      id: `safe-${Date.now()}`,
      roundIndex: maxRoundIndex + 1,
      purchaseAmount: 0,
      postMoneyCap: 0,
      discount: 0.20,
      hasProRata: false,
      hasMFN: false,
    }]);
  };

  // Remove SAFE
  const handleRemoveSafe = (id: string) => {
    setSafes(safes.filter(s => s.id !== id));
  };

  const isQualified = results?.equity.success && results.equity.isQualified;
  const showEquityResults = results?.equity.success && results.equity.isQualified;
  const showLiquidityResults = results?.liquidity.success;

  return (
    <AuthGuard>
      <div className="min-h-screen relative bg-background">
        <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Calculator className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Post-Money SAFE</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-4">SAFE Calculator</h1>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              This calculator is intended to help founders plan for SAFE financing by demonstrating the impact of conversion in a future priced round. This tool was built with common market terms in mind, but terms may vary based on the specific financing documents used.
            </p>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Not Qualified Warning */}
          {results?.equity.success === false && results.equity.message.includes('Not a qualified financing') && (
            <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <strong>Not a Qualified Financing</strong> - New money (${pricedRound.newMoneyTotal.toLocaleString()})
                is below threshold (${pricedRound.qualifiedThreshold.toLocaleString()}). Equity conversion blocked.
                Liquidity scenario still available.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="inputs" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="inputs">Inputs</TabsTrigger>
              <TabsTrigger value="equity" disabled={!showEquityResults}>Equity Results</TabsTrigger>
              <TabsTrigger value="liquidity" disabled={!showLiquidityResults}>Liquidity Results</TabsTrigger>
            </TabsList>

            {/* INPUTS TAB */}
            <TabsContent value="inputs" className="space-y-6">
              {/* Cap Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Cap Table</CardTitle>
                  <CardDescription>Pre-financing share counts (as-converted)</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Shares Outstanding</Label>
                    <Input
                      type="text"
                      value={formatNumberInput(capTable.S_out)}
                      onChange={(e) => setCapTable({ ...capTable, S_out: parseNumberInput(e.target.value) })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Options Outstanding</Label>
                    <Input
                      type="text"
                      value={formatNumberInput(capTable.Opt_out)}
                      onChange={(e) => setCapTable({ ...capTable, Opt_out: parseNumberInput(e.target.value) })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Promised Options</Label>
                    <Input
                      type="text"
                      value={formatNumberInput(capTable.Promised)}
                      onChange={(e) => setCapTable({ ...capTable, Promised: parseNumberInput(e.target.value) })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Pool Unissued</Label>
                    <Input
                      type="text"
                      value={formatNumberInput(capTable.Pool_unissued)}
                      onChange={(e) => setCapTable({ ...capTable, Pool_unissued: parseNumberInput(e.target.value) })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Founder Shares</Label>
                    <Input
                      type="text"
                      value={formatNumberInput(capTable.Founder_shares)}
                      onChange={(e) => setCapTable({ ...capTable, Founder_shares: parseNumberInput(e.target.value) })}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* SAFEs */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>SAFEs</CardTitle>
                      <CardDescription>Simple Agreements for Future Equity</CardDescription>
                    </div>
                    <Button onClick={handleAddSafe} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add SAFE
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {safes.map((safe, idx) => {
                    const isLastSafe = idx === safes.length - 1;
                    return (
                      <div key={safe.id} className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">SAFE {idx + 1} (Round {safe.roundIndex})</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSafe(safe.id)}
                            disabled={safes.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Investment Amount (AUD)</Label>
                            <Input
                              type="text"
                              value={formatNumberInput(safe.purchaseAmount)}
                              onChange={(e) => {
                                const updated = [...safes];
                                updated[idx].purchaseAmount = parseNumberInput(e.target.value);
                                setSafes(updated);
                              }}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>Valuation Cap (AUD)</Label>
                            <Input
                              type="text"
                              value={formatNumberInput(safe.postMoneyCap)}
                              onChange={(e) => {
                                const updated = [...safes];
                                updated[idx].postMoneyCap = parseNumberInput(e.target.value);
                                setSafes(updated);
                              }}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>Discount (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={(safe.discount * 100).toString()}
                              onChange={(e) => {
                                const updated = [...safes];
                                updated[idx].discount = (parseFloat(e.target.value) || 0) / 100;
                                setSafes(updated);
                              }}
                              className="mt-2"
                            />
                          </div>
                        </div>

                        <div className="flex gap-6">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={safe.hasProRata}
                              onCheckedChange={(checked) => {
                                const updated = [...safes];
                                updated[idx].hasProRata = checked;
                                setSafes(updated);
                              }}
                            />
                            <Label>Pro-Rata Rights</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={safe.hasMFN}
                              onCheckedChange={(checked) => {
                                const updated = [...safes];
                                updated[idx].hasMFN = checked;
                                setSafes(updated);
                              }}
                              disabled={isLastSafe}
                            />
                            <Label className={isLastSafe ? 'text-muted-foreground' : ''}>
                              MFN Clause {isLastSafe && '(N/A for final SAFE)'}
                            </Label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Priced Round */}
              <Card>
                <CardHeader>
                  <CardTitle>First Priced Round (Series A)</CardTitle>
                  <CardDescription>Equity financing parameters</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Total New Money (AUD)</Label>
                    <Input
                      type="text"
                      value={formatNumberInput(pricedRound.newMoneyTotal)}
                      onChange={(e) => setPricedRound({ ...pricedRound, newMoneyTotal: parseNumberInput(e.target.value) })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Lead Amount (AUD)</Label>
                    <Input
                      type="text"
                      value={formatNumberInput(pricedRound.leadAmount)}
                      onChange={(e) => setPricedRound({ ...pricedRound, leadAmount: parseNumberInput(e.target.value) })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Other Amount (AUD)</Label>
                    <Input
                      type="text"
                      value={formatNumberInput(pricedRound.otherAmount)}
                      onChange={(e) => setPricedRound({ ...pricedRound, otherAmount: parseNumberInput(e.target.value) })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Pre-Money Valuation (AUD)</Label>
                    <Input
                      type="text"
                      value={formatNumberInput(pricedRound.preMoneyValuation)}
                      onChange={(e) => setPricedRound({ ...pricedRound, preMoneyValuation: parseNumberInput(e.target.value) })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Pool Target (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={(pricedRound.poolTargetPct * 100).toString()}
                      onChange={(e) => setPricedRound({ ...pricedRound, poolTargetPct: (parseFloat(e.target.value) || 0) / 100 })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Qualified Threshold (AUD)</Label>
                    <Input
                      type="text"
                      value={formatNumberInput(pricedRound.qualifiedThreshold)}
                      onChange={(e) => setPricedRound({ ...pricedRound, qualifiedThreshold: parseNumberInput(e.target.value) })}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Liquidity Event */}
              <Card>
                <CardHeader>
                  <CardTitle>Exit Simulator (Liquidity Event)</CardTitle>
                  <CardDescription>Acquisition before priced round</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Purchase Price (AUD)</Label>
                      <Input
                        type="text"
                        value={formatNumberInput(liquidityEvent.purchasePrice)}
                        onChange={(e) => setLiquidityEvent({ ...liquidityEvent, purchasePrice: parseNumberInput(e.target.value) })}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex items-center space-x-2 mt-8">
                      <Switch
                        checked={liquidityEvent.includePromisedInProceeds || false}
                        onCheckedChange={(checked) => setLiquidityEvent({ ...liquidityEvent, includePromisedInProceeds: checked })}
                      />
                      <Label>Include Promised Options in Proceeds</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compute Button */}
              <Card>
                <CardContent className="pt-6">
                  <Button onClick={handleCompute} size="lg" className="w-full">
                    <Calculator className="w-5 h-5 mr-2" />
                    Compute SAFE Conversions
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* EQUITY RESULTS TAB */}
            <TabsContent value="equity" className="space-y-6">
              {showEquityResults && (
                <>
                  {(() => {
                    const equity = results.equity as EquityPathResult;

                    return (
                      <>
                        {/* Summary */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-primary" />
                              Conversion Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="p-4 rounded-lg bg-primary/5 border">
                                <div className="text-sm text-muted-foreground mb-1">Round Price</div>
                                <div className="text-2xl font-bold">{formatPricePerShare(equity.roundPrice)}</div>
                                <div className="text-xs text-muted-foreground mt-1">per share</div>
                              </div>
                              <div className="p-4 rounded-lg bg-muted border">
                                <div className="text-sm text-muted-foreground mb-1">Pool Increase</div>
                                <div className="text-2xl font-bold">{formatShares(equity.poolIncrease)}</div>
                                <div className="text-xs text-muted-foreground mt-1">shares</div>
                              </div>
                              <div className="p-4 rounded-lg bg-muted border">
                                <div className="text-sm text-muted-foreground mb-1">Pre-Money</div>
                                <div className="text-2xl font-bold">{formatAUD(equity.preMoneyValuation)}</div>
                              </div>
                              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                                <div className="text-sm text-muted-foreground mb-1">Status</div>
                                <Badge className="text-sm">Qualified Financing</Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Per-SAFE Conversions */}
                        <Card>
                          <CardHeader>
                            <CardTitle>SAFE Conversions</CardTitle>
                            <CardDescription>Individual conversion details per SAFE</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {equity.safeConversions.map((conv, idx) => (
                              <div key={conv.safeId} className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline">SAFE {idx + 1}</Badge>
                                    <Badge variant={conv.trigger === 'cap' ? 'default' : 'secondary'}>
                                      Trigger: {conv.trigger.toUpperCase()}
                                    </Badge>
                                    {conv.mfnUsed && (
                                      <Badge className="bg-purple-500">
                                        MFN Used → Round {conv.mfnAdoptedRound}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-primary">{formatPercent(conv.ownershipPct)}</div>
                                    <div className="text-xs text-muted-foreground">ownership</div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <div className="text-muted-foreground text-xs mb-1">Investment</div>
                                    <div className="font-medium">{formatAUD(conv.purchaseAmount)}</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground text-xs mb-1">Cap Price</div>
                                    <div className="font-medium">{formatPricePerShare(conv.capPrice)}</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground text-xs mb-1">Discount Price</div>
                                    <div className="font-medium">{conv.discountPrice !== null ? formatPricePerShare(conv.discountPrice) : 'N/A'}</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground text-xs mb-1">Chosen Price</div>
                                    <div className="font-medium text-primary">{formatPricePerShare(conv.chosenPrice)}</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground text-xs mb-1">SAFE Shares</div>
                                    <div className="font-medium">{formatShares(conv.safeShares)}</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground text-xs mb-1">Pro-Rata Shares</div>
                                    <div className="font-medium">{formatShares(conv.proRataShares)}</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground text-xs mb-1">Total Shares</div>
                                    <div className="font-medium">{formatShares(conv.totalShares)}</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground text-xs mb-1">Ownership</div>
                                    <div className="font-medium text-primary">{formatPercent(conv.ownershipPct)}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        {/* Cap Table */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Post-Round Cap Table</CardTitle>
                            <CardDescription>Fully diluted ownership by class</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {equity.capTableByClass.map((cls) => (
                                <div key={cls.className} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                                  <div className="flex items-center gap-3">
                                    <div className="font-medium">{cls.className}</div>
                                    <div className="text-sm text-muted-foreground">{formatShares(cls.shares)} shares</div>
                                  </div>
                                  <div className="font-bold">{formatPercent(cls.ownershipPct)}</div>
                                </div>
                              ))}
                              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 font-bold">
                                <div>Total</div>
                                <div>{formatShares(equity.totalSharesPostRound)} shares</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    );
                  })()}
                </>
              )}
            </TabsContent>

            {/* LIQUIDITY RESULTS TAB */}
            <TabsContent value="liquidity" className="space-y-6">
              {showLiquidityResults && (
                <>
                  {(() => {
                    const liquidity = results.liquidity as LiquidityPathResult;

                    return (
                      <>
                        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/10">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-blue-800 dark:text-blue-200">
                            <strong>Note:</strong> Liquidity capitalization excludes unissued pool and includes only SAFEs that choose to convert.
                          </AlertDescription>
                        </Alert>

                        {/* Summary */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <DollarSign className="w-5 h-5 text-primary" />
                              Liquidity Event Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-4 rounded-lg bg-primary/5 border">
                                <div className="text-sm text-muted-foreground mb-1">Purchase Price</div>
                                <div className="text-2xl font-bold">{formatAUD(liquidity.purchasePrice)}</div>
                              </div>
                              <div className="p-4 rounded-lg bg-muted border">
                                <div className="text-sm text-muted-foreground mb-1">Per-Share Consideration</div>
                                <div className="text-2xl font-bold">{formatPricePerShare(liquidity.perShareConsideration)}</div>
                              </div>
                              <div className="p-4 rounded-lg bg-muted border">
                                <div className="text-sm text-muted-foreground mb-1">Liquidity Cap</div>
                                <div className="text-2xl font-bold">{formatShares(liquidity.liquidityCapitalization)}</div>
                                <div className="text-xs text-muted-foreground mt-1">shares</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Per-SAFE Decisions */}
                        <Card>
                          <CardHeader>
                            <CardTitle>SAFE Liquidity Decisions</CardTitle>
                            <CardDescription>Convert vs cash-out analysis per SAFE</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {liquidity.safeDecisions.map((decision, idx) => (
                                <div key={decision.safeId} className="p-4 border rounded-lg">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <Badge variant="outline">SAFE {idx + 1}</Badge>
                                      <Badge variant={decision.decision === 'convert' ? 'default' : 'secondary'}>
                                        {decision.decision.toUpperCase()}
                                      </Badge>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xl font-bold text-primary">{formatAUD(decision.chosenReturn)}</div>
                                      <div className="text-xs text-muted-foreground">return</div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <div className="text-muted-foreground text-xs mb-1">Investment</div>
                                      <div className="font-medium">{formatAUD(decision.purchaseAmount)}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground text-xs mb-1">Cash-Out</div>
                                      <div className="font-medium">{formatAUD(decision.cashOutAmount)}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground text-xs mb-1">As-Converted Value</div>
                                      <div className="font-medium">{formatAUD(decision.asConvertedValue)}</div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground text-xs mb-1">Chosen Return</div>
                                      <div className="font-medium text-primary">{formatAUD(decision.chosenReturn)}</div>
                                    </div>
                                    {decision.decision === 'convert' && (
                                      <>
                                        <div>
                                          <div className="text-muted-foreground text-xs mb-1">Conversion Price</div>
                                          <div className="font-medium">{formatPricePerShare(decision.conversionPrice!)}</div>
                                        </div>
                                        <div>
                                          <div className="text-muted-foreground text-xs mb-1">Shares Received</div>
                                          <div className="font-medium">{formatShares(decision.shares!)}</div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Totals */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Distribution Summary</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                                <div className="font-medium">Total to SAFEs</div>
                                <div className="font-bold">{formatAUD(liquidity.totalToSAFEs)}</div>
                              </div>
                              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                                <div className="font-medium">Total to Stockholders</div>
                                <div className="font-bold">{formatAUD(liquidity.totalToStockholders)}</div>
                              </div>
                              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 font-bold">
                                <div>Purchase Price</div>
                                <div>{formatAUD(liquidity.purchasePrice)}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    );
                  })()}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  );
};

export default SafeCalculatorNew;
