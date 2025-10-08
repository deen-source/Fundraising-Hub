/**
 * YC Post-Money SAFE Calculator - Type Definitions
 *
 * All monetary values in AUD
 * All shares as whole numbers (display) but use Decimal internally
 */

export interface CapTable {
  /** Total shares outstanding (as-converted, pre-financing) */
  S_out: number;
  /** Total options outstanding (granted, unexercised) */
  Opt_out: number;
  /** Promised options (written but not granted) */
  Promised: number;
  /** Unissued options already reserved in pool */
  Pool_unissued: number;
  /** Founder common shares (subset of S_out, for display only) */
  Founder_shares: number;
}

export interface SAFE {
  /** Unique identifier */
  id: string;
  /** Chronological order (0, 1, 2...) */
  roundIndex: number;
  /** Investment amount in AUD */
  purchaseAmount: number;
  /** Post-money valuation cap in AUD */
  postMoneyCap: number;
  /** Discount rate (0..1, e.g. 0.2 = 20%) */
  discount: number;
  /** Pro-rata participation rights */
  hasProRata: boolean;
  /** Most Favored Nation clause */
  hasMFN: boolean;
}

export interface PricedRound {
  /** Total new money (excludes SAFEs/notes) in AUD */
  newMoneyTotal: number;
  /** Lead investor amount in AUD */
  leadAmount: number;
  /** Pre-money valuation in AUD */
  preMoneyValuation: number;
  /** Target option pool % post-round (0..1, e.g. 0.10 = 10%) */
  poolTargetPct: number;
  /** Minimum new money to qualify for equity conversion in AUD */
  qualifiedThreshold: number;
}

export interface LiquidityEvent {
  /** Total acquisition price in AUD */
  purchasePrice: number;
}

export interface CalculatorInputs {
  capTable: CapTable;
  safes: SAFE[];
  pricedRound: PricedRound;
  liquidityEvent: LiquidityEvent;
}

// ========================================
// EQUITY PATH OUTPUT TYPES
// ========================================

export interface SAFEConversion {
  /** SAFE identifier */
  safeId: string;
  /** SAFE round index */
  roundIndex: number;
  /** Original investment amount in AUD */
  purchaseAmount: number;
  /** Cap-based conversion price (AUD/share) */
  capPrice: number;
  /** Discount-based conversion price (AUD/share) - null if discount=0 (cap-only SAFE) */
  discountPrice: number | null;
  /** Actual conversion price used (min of cap/discount if discount exists, else cap, AUD/share) */
  chosenPrice: number;
  /**
   * Trigger that determined price (per-SAFE independent):
   * - 'cap': Cap price was lower than discount/round price
   * - 'discount': Discount price was lower than cap (only if discount > 0)
   * - 'round': Round price was lower than cap (only if discount = 0)
   *
   * Note: The "discount correction pass" may recompute P_round, but each SAFE
   * still chooses its own trigger independently via min(cap, discount) logic.
   */
  trigger: 'cap' | 'discount' | 'round';
  /** SAFE preferred shares received */
  safeShares: number;
  /** Pro-rata shares (if hasProRata) */
  proRataShares: number;
  /** Total shares (SAFE + pro-rata) */
  totalShares: number;
  /** Ownership percentage post-round */
  ownershipPct: number;
  /** MFN was triggered and adopted next round's terms */
  mfnUsed: boolean;
  /** Round index whose terms were adopted (if mfnUsed) */
  mfnAdoptedRound?: number;
}

export interface CapTableClass {
  /** Class name */
  className: string;
  /** Total shares */
  shares: number;
  /** Ownership percentage */
  ownershipPct: number;
}

export interface EquityPathResult {
  success: true;
  /** Is this a qualified financing? */
  isQualified: boolean;
  /** Round price per share (AUD/share) */
  roundPrice: number;
  /** Option pool increase (shares) */
  poolIncrease: number;
  /** Pre-money valuation (AUD) */
  preMoneyValuation: number;
  /** New money raised (AUD) */
  newMoney: number;
  /** Company Capitalization (shares, post-SAFE, pre-new-money) */
  companyCap: number;
  /** Base shares pre-SAFE conversion (S_out + Opt_out + Promised + Pool_unissued) - for transparency */
  basePreConversion: number;
  /** Lead investor amount (AUD) */
  leadAmount: number;
  /** Lead investor shares */
  leadShares: number;
  /** Derived other investors amount (AUD) */
  otherAmount: number;
  /** Derived other investors shares */
  otherShares: number;
  /** Per-SAFE conversion details */
  safeConversions: SAFEConversion[];
  /** Post-round cap table by class */
  capTableByClass: CapTableClass[];
  /** Total shares post-round */
  totalSharesPostRound: number;
}

export interface EquityPathError {
  success: false;
  message: string;
}

export type EquityPathOutput = EquityPathResult | EquityPathError;

// ========================================
// LIQUIDITY PATH OUTPUT TYPES
// ========================================

export interface SAFELiquidityDecision {
  /** SAFE identifier */
  safeId: string;
  /** SAFE round index */
  roundIndex: number;
  /** Original investment amount in AUD */
  purchaseAmount: number;
  /** Cash-out amount (equals purchaseAmount) */
  cashOutAmount: number;
  /** As-converted value (shares × PSC) */
  asConvertedValue: number;
  /** Chosen return (max of cash-out or convert) */
  chosenReturn: number;
  /** Decision: 'convert' | 'cash-out' */
  decision: 'convert' | 'cash-out';
  /** Conversion price if converting (AUD/share) */
  conversionPrice?: number;
  /** Shares received if converting */
  shares?: number;
}

export interface LiquidityPathResult {
  success: true;
  /** Total purchase price (AUD) */
  purchasePrice: number;
  /** Per-share consideration (AUD/share) */
  perShareConsideration: number;
  /** Liquidity capitalization (shares, excludes unissued pool) */
  liquidityCapitalization: number;
  /** Per-SAFE decisions */
  safeDecisions: SAFELiquidityDecision[];
  /** Total proceeds to SAFEs (AUD) */
  totalToSAFEs: number;
  /** Total proceeds to stockholders (AUD) */
  totalToStockholders: number;
}

export interface LiquidityPathError {
  success: false;
  message: string;
}

export type LiquidityPathOutput = LiquidityPathResult | LiquidityPathError;

// ========================================
// COMBINED OUTPUT
// ========================================

export interface CalculatorOutput {
  equity: EquityPathOutput;
  liquidity: LiquidityPathOutput;
}
