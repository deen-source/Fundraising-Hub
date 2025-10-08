/**
 * YC Post-Money SAFE Calculator - Core Math Engine
 *
 * All calculations use Decimal.js-light for precision
 * Implements YC Post-Money SAFE conversion mechanics with:
 * - MFN (Most Favored Nation) single-hop adoption
 * - Cap and discount-governed conversion
 * - Pro-rata rights calculation
 * - Liquidity event analysis (convert vs cash-out)
 */

import Decimal from 'decimal.js-light';
import type {
  CalculatorInputs,
  CapTable,
  SAFE,
  PricedRound,
  LiquidityEvent,
  EquityPathOutput,
  LiquidityPathOutput,
  SAFEConversion,
  CapTableClass,
  SAFELiquidityDecision,
} from './types';
import { roundShares, roundAUD } from './format';

// ========================================
// HELPER FUNCTIONS
// ========================================

/** Min of two Decimal values */
function decimalMin(a: Decimal, b: Decimal): Decimal {
  return a.lte(b) ? a : b;
}

/** Max of two Decimal values */
function decimalMax(a: Decimal, b: Decimal): Decimal {
  return a.gte(b) ? a : b;
}

// ========================================
// MFN PREPROCESSING
// ========================================

/**
 * Apply MFN (Most Favored Nation) logic to SAFEs
 * Single-hop: each SAFE can only adopt the immediately next round's terms
 * Triggers if next round's terms yield a strictly lower conversion price
 */
export function computeMFNTerms(
  safes: SAFE[],
  pricedRound: PricedRound,
  companyCap: Decimal
): SAFE[] {
  // Sort SAFEs by roundIndex
  const sorted = [...safes].sort((a, b) => a.roundIndex - b.roundIndex);
  const result: SAFE[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const currentSafe = { ...sorted[i] };

    // Final SAFE cannot have MFN (no next round to reference)
    if (i === sorted.length - 1) {
      result.push({ ...currentSafe, hasMFN: false });
      continue;
    }

    // If MFN is enabled, compare with next round
    if (currentSafe.hasMFN) {
      const nextSafe = sorted[i + 1];

      // Compute what the conversion price would be under current terms
      const currentCapPrice = new Decimal(currentSafe.postMoneyCap).div(companyCap);
      const currentDiscPrice = new Decimal(pricedRound.preMoneyValuation)
        .div(companyCap)
        .mul(new Decimal(1).minus(currentSafe.discount));
      const currentPrice = decimalMin(currentCapPrice, currentDiscPrice);

      // Compute what the conversion price would be under next round's terms
      const nextCapPrice = new Decimal(nextSafe.postMoneyCap).div(companyCap);
      const nextDiscPrice = new Decimal(pricedRound.preMoneyValuation)
        .div(companyCap)
        .mul(new Decimal(1).minus(nextSafe.discount));
      const nextPrice = decimalMin(nextCapPrice, nextDiscPrice);

      // If next round's price is strictly lower, adopt its terms
      if (nextPrice.lt(currentPrice)) {
        result.push({
          ...currentSafe,
          postMoneyCap: nextSafe.postMoneyCap,
          discount: nextSafe.discount,
          hasMFN: false, // Clear MFN after adoption
          mfnAdoptedRound: nextSafe.roundIndex,
        });
      } else {
        result.push({ ...currentSafe, hasMFN: false });
      }
    } else {
      result.push(currentSafe);
    }
  }

  return result;
}

// ========================================
// EQUITY PATH (PRICED ROUND CONVERSION)
// ========================================

/**
 * Calculate equity financing conversion
 * Implements post-money SAFE mechanics with cap/discount triggers
 */
export function equityPath(inputs: CalculatorInputs): EquityPathOutput {
  const { capTable, safes, pricedRound } = inputs;

  // Validate: leadAmount must not exceed newMoneyTotal
  if (pricedRound.leadAmount > pricedRound.newMoneyTotal) {
    return {
      success: false,
      message: 'Lead amount cannot exceed total new money',
    };
  }

  // Check if qualified
  const isQualified = pricedRound.newMoneyTotal >= pricedRound.qualifiedThreshold;

  if (!isQualified) {
    return {
      success: false,
      message: 'Not a qualified financing - new money below threshold',
    };
  }

  try {
    // Step 1: Calculate Base (pre-conversion shares in Company Cap)
    const Base = new Decimal(capTable.S_out)
      .plus(capTable.Opt_out)
      .plus(capTable.Promised)
      .plus(capTable.Pool_unissued);

    // Step 2: Calculate ownership fractions for each SAFE
    const ownershipFractions = safes.map((safe) =>
      new Decimal(safe.purchaseAmount).div(safe.postMoneyCap)
    );

    // Step 3: Calculate Company Capitalization (post-SAFE, pre-pool, pre-new-money)
    // CompanyCap = Base / (1 - Σ o_i)
    const sumOwnership = ownershipFractions.reduce(
      (sum, o) => sum.plus(o),
      new Decimal(0)
    );

    if (sumOwnership.gte(1)) {
      return {
        success: false,
        message: 'SAFE ownership sum >= 100% - invalid cap table structure',
      };
    }

    const companyCap = Base.div(new Decimal(1).minus(sumOwnership));

    // Step 4: Apply MFN preprocessing (returns modified SAFEs)
    const safesWithMFN = computeMFNTerms(safes, pricedRound, companyCap);

    // Step 5: Calculate cap prices for each SAFE
    const safePricesAndShares = safesWithMFN.map((safe) => {
      const capPrice = new Decimal(safe.postMoneyCap).div(companyCap);
      return { safe, capPrice, shares: new Decimal(0) }; // shares computed later
    });

    // Step 6: Calculate pool increase
    // Inc_pool = [ p × (Vpre + N) × B − Vpre × U ] / [ Vpre − p × (Vpre + N) ]
    const p = new Decimal(pricedRound.poolTargetPct);
    const Vpre = new Decimal(pricedRound.preMoneyValuation);
    const N = new Decimal(pricedRound.newMoneyTotal);
    const U = new Decimal(capTable.Pool_unissued);
    const B = companyCap;

    const numerator = p.mul(Vpre.plus(N)).mul(B).minus(Vpre.mul(U));
    const denominator = Vpre.minus(p.mul(Vpre.plus(N)));

    if (denominator.lte(0)) {
      return {
        success: false,
        message: 'Invalid pool target - target percentage too high for valuation',
      };
    }

    const poolIncrease = decimalMax(new Decimal(0), numerator.div(denominator));

    // Step 7: Calculate round price (first pass - cap-only assumption)
    // P_round = preMoneyValuation / (FD_postSAFE + Inc_pool)
    const FD_postSAFE_capOnly = companyCap;
    let roundPrice = Vpre.div(FD_postSAFE_capOnly.plus(poolIncrease));

    // Step 8: Calculate discount prices and final SAFE prices
    // IMPORTANT: Per-SAFE trigger determination
    // Each SAFE independently chooses its trigger based on its own terms:
    // - If discount = 0 (cap-only): compare cap vs round → trigger is 'cap' or 'round'
    // - If discount > 0: compare cap vs discount → trigger is 'cap' or 'discount'
    const safeConversionsFirstPass = safePricesAndShares.map(({ safe, capPrice }) => {
      let discountPrice: Decimal | null;
      let chosenPrice: Decimal;
      let trigger: 'cap' | 'discount' | 'round';

      if (safe.discount === 0) {
        // Cap-only SAFE: no discount price exists
        discountPrice = null;
        chosenPrice = decimalMin(capPrice, roundPrice);
        trigger = chosenPrice.eq(capPrice) ? 'cap' : 'round';
      } else {
        // SAFE with discount: compare cap vs discounted round price
        discountPrice = roundPrice.mul(new Decimal(1).minus(safe.discount));
        chosenPrice = decimalMin(capPrice, discountPrice);
        trigger = chosenPrice.eq(capPrice) ? 'cap' : 'discount';
      }

      const safeShares = new Decimal(safe.purchaseAmount).div(chosenPrice);

      return {
        safe,
        capPrice,
        discountPrice,
        chosenPrice,
        trigger,
        safeShares,
      };
    });

    // Step 9: Check if any SAFE is round-price-governed (one correction pass)
    // This includes both 'discount' and 'round' triggers
    const hasRoundPriceGoverned = safeConversionsFirstPass.some(
      (conv) => conv.trigger === 'discount' || conv.trigger === 'round'
    );

    let safeConversions = safeConversionsFirstPass;
    let FD_postSAFE = FD_postSAFE_capOnly;
    let finalPoolIncrease = poolIncrease;

    if (hasRoundPriceGoverned) {
      // Correction pass per spec: recompute FD_postSAFE and P_round once
      // Do NOT recalculate pool increase - use original Inc_pool
      // IMPORTANT: Each SAFE still chooses its own trigger independently

      // Recompute FD_postSAFE with actual SAFE shares from first pass
      FD_postSAFE = Base.plus(
        safeConversionsFirstPass.reduce(
          (sum, conv) => sum.plus(conv.safeShares),
          new Decimal(0)
        )
      );

      // Recompute round price with updated FD_postSAFE but SAME pool increase
      roundPrice = Vpre.div(FD_postSAFE.plus(poolIncrease));

      // Recompute SAFE conversions with new round price (final pass)
      // Each SAFE independently re-evaluates its trigger with updated P_round
      safeConversions = safePricesAndShares.map(({ safe, capPrice }) => {
        let discountPrice: Decimal | null;
        let chosenPrice: Decimal;
        let trigger: 'cap' | 'discount' | 'round';

        if (safe.discount === 0) {
          // Cap-only SAFE: no discount price exists
          discountPrice = null;
          chosenPrice = decimalMin(capPrice, roundPrice);
          trigger = chosenPrice.eq(capPrice) ? 'cap' : 'round';
        } else {
          // SAFE with discount: compare cap vs discounted round price
          discountPrice = roundPrice.mul(new Decimal(1).minus(safe.discount));
          chosenPrice = decimalMin(capPrice, discountPrice);
          trigger = chosenPrice.eq(capPrice) ? 'cap' : 'discount';
        }

        const safeShares = new Decimal(safe.purchaseAmount).div(chosenPrice);

        return {
          safe,
          capPrice,
          discountPrice,
          chosenPrice,
          trigger,
          safeShares,
        };
      });

      // Update FD_postSAFE with final SAFE shares for ownership calculations
      FD_postSAFE = Base.plus(
        safeConversions.reduce(
          (sum, conv) => sum.plus(conv.safeShares),
          new Decimal(0)
        )
      );
    }

    // Step 10: Calculate pro-rata shares
    // Pro-rata % = SAFE shares / FD_postSAFE (before pool increase & new money)
    const safeConversionsWithProRata = safeConversions.map((conv) => {
      const proRataPct = conv.safeShares.div(FD_postSAFE);
      const proRataDollars = conv.safe.hasProRata
        ? N.mul(proRataPct)
        : new Decimal(0);
      const proRataShares = conv.safe.hasProRata
        ? proRataDollars.div(roundPrice)
        : new Decimal(0);

      return {
        ...conv,
        proRataShares,
        proRataDollars,
      };
    });

    // Step 11: Derive other investors amount and shares
    const totalProRataDollars = safeConversionsWithProRata.reduce(
      (sum, conv) => sum.plus(conv.proRataDollars),
      new Decimal(0)
    );

    const leadAmount = new Decimal(pricedRound.leadAmount);
    const otherDollars = decimalMax(
      new Decimal(0),
      N.minus(leadAmount).minus(totalProRataDollars)
    );

    // Validation: Check if lead + pro-rata exceeds total
    let validationWarning = '';
    if (leadAmount.plus(totalProRataDollars).gt(N)) {
      validationWarning = 'Pro-rata rights plus lead amount exceed total new money - other investors set to zero';
    }

    const leadShares = leadAmount.div(roundPrice);
    const otherShares = otherDollars.div(roundPrice);
    const newInvestorShares = leadShares.plus(otherShares);

    // Step 12: Calculate total shares post-round
    const totalSafeShares = safeConversionsWithProRata.reduce(
      (sum, conv) => sum.plus(conv.safeShares),
      new Decimal(0)
    );
    const totalProRataShares = safeConversionsWithProRata.reduce(
      (sum, conv) => sum.plus(conv.proRataShares),
      new Decimal(0)
    );

    const totalSharesPostRound = FD_postSAFE
      .plus(poolIncrease)
      .plus(newInvestorShares)
      .plus(totalProRataShares);

    // Step 13: Build SAFE conversion output
    const safeConversionOutput: SAFEConversion[] = safeConversionsWithProRata.map(
      (conv) => {
        const totalShares = conv.safeShares.plus(conv.proRataShares);
        const ownershipPct = totalShares.div(totalSharesPostRound);
        const mfnUsed = (conv.safe as any).mfnAdoptedRound !== undefined;
        const mfnAdoptedRound = (conv.safe as any).mfnAdoptedRound;

        return {
          safeId: conv.safe.id,
          roundIndex: conv.safe.roundIndex,
          purchaseAmount: conv.safe.purchaseAmount,
          capPrice: conv.capPrice.toNumber(),
          discountPrice: conv.discountPrice !== null ? conv.discountPrice.toNumber() : null,
          chosenPrice: conv.chosenPrice.toNumber(),
          trigger: conv.trigger,
          safeShares: roundShares(conv.safeShares),
          proRataShares: roundShares(conv.proRataShares),
          totalShares: roundShares(totalShares),
          ownershipPct: ownershipPct.toNumber(),
          mfnUsed,
          mfnAdoptedRound,
        };
      }
    );

    // Step 14: Build cap table by class
    const founderShares = new Decimal(capTable.Founder_shares);
    const otherCommon = new Decimal(capTable.S_out).minus(founderShares);
    const optionsPostRound = new Decimal(capTable.Pool_unissued).plus(finalPoolIncrease);
    const safePreferred = totalSafeShares.plus(totalProRataShares);
    const pricedPreferred = newInvestorShares;

    const capTableByClass: CapTableClass[] = [
      {
        className: 'Founders',
        shares: roundShares(founderShares),
        ownershipPct: founderShares.div(totalSharesPostRound).toNumber(),
      },
      {
        className: 'Other Common',
        shares: roundShares(otherCommon),
        ownershipPct: otherCommon.div(totalSharesPostRound).toNumber(),
      },
      {
        className: 'Options',
        shares: roundShares(optionsPostRound),
        ownershipPct: optionsPostRound.div(totalSharesPostRound).toNumber(),
      },
      {
        className: 'SAFE Preferred',
        shares: roundShares(safePreferred),
        ownershipPct: safePreferred.div(totalSharesPostRound).toNumber(),
      },
      {
        className: 'Priced Round Preferred',
        shares: roundShares(pricedPreferred),
        ownershipPct: pricedPreferred.div(totalSharesPostRound).toNumber(),
      },
    ];

    return {
      success: true,
      isQualified,
      roundPrice: roundPrice.toNumber(),
      poolIncrease: roundShares(finalPoolIncrease),
      preMoneyValuation: pricedRound.preMoneyValuation,
      newMoney: pricedRound.newMoneyTotal,
      companyCap: roundShares(companyCap),
      basePreConversion: roundShares(Base),
      leadAmount: pricedRound.leadAmount,
      leadShares: roundShares(leadShares),
      otherAmount: otherDollars.toNumber(),
      otherShares: roundShares(otherShares),
      safeConversions: safeConversionOutput,
      capTableByClass,
      totalSharesPostRound: roundShares(totalSharesPostRound),
    };
  } catch (error) {
    return {
      success: false,
      message: `Calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ========================================
// LIQUIDITY PATH (EXIT BEFORE PRICED ROUND)
// ========================================

/**
 * Calculate liquidity event (acquisition before priced round)
 * SAFEs choose convert vs cash-out based on which gives higher return
 * Uses two-pass approach to handle circular dependency in LiqCap
 */
export function liquidityPath(inputs: CalculatorInputs): LiquidityPathOutput {
  const { capTable, safes, liquidityEvent } = inputs;

  try {
    // Step 1: Calculate base stockholder shares (always include Promised)
    const stockholderShares = new Decimal(capTable.S_out)
      .plus(capTable.Opt_out)
      .plus(capTable.Promised);

    const purchasePrice = new Decimal(liquidityEvent.purchasePrice);

    // Two-pass approach:
    // Pass 1: Assume all SAFEs convert, calculate PSC
    // Pass 2: Mark cash-outs, recalculate PSC and returns

    // PASS 1: Assume all convert
    let liqCapAssumingAllConvert = stockholderShares;

    const firstPassDecisions = safes.map((safe) => {
      const capPrice = new Decimal(safe.postMoneyCap).div(liqCapAssumingAllConvert);
      const shares = new Decimal(safe.purchaseAmount).div(capPrice);
      liqCapAssumingAllConvert = liqCapAssumingAllConvert.plus(shares);

      return {
        safe,
        capPrice,
        shares,
      };
    });

    // Recalculate LiqCap with all SAFEs converting
    const liqCap1 = stockholderShares.plus(
      firstPassDecisions.reduce(
        (sum, d) => sum.plus(d.shares),
        new Decimal(0)
      )
    );

    const psc1 = purchasePrice.div(liqCap1);

    // PASS 2: Determine cash-out vs convert for each SAFE
    const secondPassDecisions = safes.map((safe) => {
      // Recalculate conversion with current LiqCap
      const capPrice = new Decimal(safe.postMoneyCap).div(liqCap1);

      // If SAFE has discount, apply it to PSC
      const discPrice = safe.discount > 0
        ? psc1.mul(new Decimal(1).minus(safe.discount))
        : capPrice; // No discount = use cap price

      const conversionPrice = decimalMin(capPrice, discPrice);
      const shares = new Decimal(safe.purchaseAmount).div(conversionPrice);
      const asConvertedValue = shares.mul(psc1);
      const cashOutValue = new Decimal(safe.purchaseAmount);

      const decision = asConvertedValue.gt(cashOutValue) ? 'convert' : 'cash-out';

      return {
        safe,
        conversionPrice,
        shares,
        asConvertedValue,
        cashOutValue,
        decision,
      };
    });

    // Rebuild LiqCap with only converting SAFEs
    const convertingSAFEs = secondPassDecisions.filter((d) => d.decision === 'convert');
    const liqCapFinal = stockholderShares.plus(
      convertingSAFEs.reduce(
        (sum, d) => sum.plus(d.shares),
        new Decimal(0)
      )
    );

    const pscFinal = purchasePrice.div(liqCapFinal);

    // Recalculate returns with final PSC
    const finalDecisions = secondPassDecisions.map((d) => {
      if (d.decision === 'convert') {
        const asConvertedValue = d.shares.mul(pscFinal);
        return {
          ...d,
          asConvertedValue,
          chosenReturn: asConvertedValue,
        };
      } else {
        return {
          ...d,
          chosenReturn: d.cashOutValue,
        };
      }
    });

    // Calculate totals
    const totalToSAFEs = finalDecisions.reduce(
      (sum, d) => sum.plus(d.chosenReturn),
      new Decimal(0)
    );
    const totalToStockholders = purchasePrice.minus(totalToSAFEs);

    // Build output
    const safeDecisions: SAFELiquidityDecision[] = finalDecisions.map((d) => ({
      safeId: d.safe.id,
      roundIndex: d.safe.roundIndex,
      purchaseAmount: d.safe.purchaseAmount,
      cashOutAmount: d.cashOutValue.toNumber(),
      asConvertedValue: d.asConvertedValue.toNumber(),
      chosenReturn: d.chosenReturn.toNumber(),
      decision: d.decision,
      conversionPrice: d.decision === 'convert' ? d.conversionPrice.toNumber() : undefined,
      shares: d.decision === 'convert' ? roundShares(d.shares) : undefined,
    }));

    return {
      success: true,
      purchasePrice: liquidityEvent.purchasePrice,
      perShareConsideration: pscFinal.toNumber(),
      liquidityCapitalization: roundShares(liqCapFinal),
      safeDecisions,
      totalToSAFEs: roundAUD(totalToSAFEs),
      totalToStockholders: roundAUD(totalToStockholders),
    };
  } catch (error) {
    return {
      success: false,
      message: `Calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ========================================
// MAIN CALCULATOR FUNCTION
// ========================================

/**
 * Main calculator function - runs both equity and liquidity paths
 */
export function calculate(inputs: CalculatorInputs) {
  return {
    equity: equityPath(inputs),
    liquidity: liquidityPath(inputs),
  };
}
