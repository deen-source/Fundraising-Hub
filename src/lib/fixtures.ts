/**
 * YC Post-Money SAFE Calculator - Test Fixtures
 *
 * Three example scenarios (all in AUD):
 * A) Equity - Cap-governed SAFE (qualified financing)
 * B) Equity - Discount-governed & Not Qualified
 * C) Liquidity - Mixed convert/cash-out decisions
 */

import type { CalculatorInputs } from './types';

/**
 * Scenario A: Equity - Cap-governed SAFE
 * - Two SAFEs in round 0, both convert via cap
 * - SAFE A has pro-rata rights
 * - Qualified financing (new money > threshold)
 */
export const scenarioA: CalculatorInputs = {
  capTable: {
    S_out: 8_000_000,
    Opt_out: 800_000,
    Promised: 200_000,
    Pool_unissued: 1_000_000,
    Founder_shares: 6_500_000,
  },
  safes: [
    {
      id: 'safe-a1',
      roundIndex: 0,
      purchaseAmount: 500_000,
      postMoneyCap: 10_000_000,
      discount: 0.20,
      hasProRata: true,
      hasMFN: false,
    },
    {
      id: 'safe-a2',
      roundIndex: 0,
      purchaseAmount: 500_000,
      postMoneyCap: 20_000_000,
      discount: 0.0,
      hasProRata: false,
      hasMFN: false,
    },
  ],
  pricedRound: {
    newMoneyTotal: 5_000_000,
    leadAmount: 3_500_000,
    otherAmount: 1_500_000,
    preMoneyValuation: 20_000_000,
    poolTargetPct: 0.10,
    qualifiedThreshold: 2_000_000,
  },
  liquidityEvent: {
    purchasePrice: 0, // Not used in equity mode
    includePromisedInProceeds: false,
  },
};

/**
 * Scenario B: Equity - Discount-governed & Not Qualified
 * - One SAFE with high cap and significant discount
 * - New money below threshold (not qualified)
 * - Should trigger discount-governed conversion path
 */
export const scenarioB: CalculatorInputs = {
  capTable: {
    S_out: 10_000_000,
    Opt_out: 500_000,
    Promised: 100_000,
    Pool_unissued: 900_000,
    Founder_shares: 7_800_000,
  },
  safes: [
    {
      id: 'safe-b1',
      roundIndex: 0,
      purchaseAmount: 1_000_000,
      postMoneyCap: 40_000_000,
      discount: 0.25,
      hasProRata: true,
      hasMFN: false,
    },
  ],
  pricedRound: {
    newMoneyTotal: 750_000,
    leadAmount: 750_000,
    otherAmount: 0,
    preMoneyValuation: 15_000_000,
    poolTargetPct: 0.12,
    qualifiedThreshold: 1_000_000, // NOT QUALIFIED
  },
  liquidityEvent: {
    purchasePrice: 0,
    includePromisedInProceeds: false,
  },
};

/**
 * Scenario C: Liquidity - Mixed convert/cash-out
 * - Three SAFE rounds (0, 1, 2)
 * - SAFE D has MFN referencing SAFE E (round 1)
 * - Acquisition before priced round
 * - Some SAFEs convert, others cash out
 */
export const scenarioC: CalculatorInputs = {
  capTable: {
    S_out: 7_000_000,
    Opt_out: 600_000,
    Promised: 150_000,
    Pool_unissued: 750_000,
    Founder_shares: 5_400_000,
  },
  safes: [
    {
      id: 'safe-d',
      roundIndex: 0,
      purchaseAmount: 400_000,
      postMoneyCap: 18_000_000,
      discount: 0.15,
      hasProRata: true,
      hasMFN: true, // MFN references round 1
    },
    {
      id: 'safe-e',
      roundIndex: 1,
      purchaseAmount: 600_000,
      postMoneyCap: 16_000_000,
      discount: 0.20,
      hasProRata: false,
      hasMFN: false,
    },
    {
      id: 'safe-f',
      roundIndex: 2,
      purchaseAmount: 500_000,
      postMoneyCap: 28_000_000,
      discount: 0.0,
      hasProRata: true,
      hasMFN: false, // Final SAFE, MFN not allowed
    },
  ],
  pricedRound: {
    newMoneyTotal: 0, // Not used in liquidity mode
    leadAmount: 0,
    otherAmount: 0,
    preMoneyValuation: 0,
    poolTargetPct: 0,
    qualifiedThreshold: 0,
  },
  liquidityEvent: {
    purchasePrice: 35_000_000,
    includePromisedInProceeds: false, // Can toggle to true to see impact
  },
};

/**
 * All test scenarios
 */
export const fixtures = {
  scenarioA,
  scenarioB,
  scenarioC,
};

/**
 * Scenario names for UI dropdown
 */
export const scenarioNames = {
  scenarioA: 'Scenario A: Cap-Governed Equity',
  scenarioB: 'Scenario B: Discount-Governed (Not Qualified)',
  scenarioC: 'Scenario C: Liquidity Event',
};
