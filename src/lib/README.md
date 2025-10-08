# YC Post-Money SAFE Calculator - Math Engine

## Overview

This math engine implements **YC Post-Money SAFE conversion mechanics** with full support for:
- **Valuation cap** and **discount** triggers
- **Most Favored Nation (MFN)** clauses (single-hop)
- **Pro-rata participation rights**
- **Option pool top-up** calculations
- **Liquidity events** (convert vs cash-out analysis)

All calculations use **Decimal.js-light** for high precision. Results are rounded only for display.

---

## Architecture

### Core Files

1. **`types.ts`** - TypeScript interfaces for all inputs/outputs
2. **`math.ts`** - Pure calculation functions (equity & liquidity paths)
3. **`format.ts`** - Display formatting helpers (AUD 0-decimals, whole shares)
4. **`fixtures.ts`** - 3 test scenarios in AUD
5. **`math.test.ts`** - Comprehensive test suite (15 tests, 100% pass rate)

---

## Key Concepts

### Post-Money SAFE Mechanics

Unlike pre-money SAFEs, **post-money SAFEs** explicitly define the investor's ownership percentage upfront:

```
Ownership % = Investment Amount / Post-Money Valuation Cap
```

This makes cap table dilution **predictable and non-dilutive** to SAFE holders.

### Company Capitalization (Non-Iterative)

The math engine uses an **algebraic, non-iterative** formula to calculate Company Capitalization:

```
CompanyCap = Base / (1 - Σ ownership_i)
```

Where:
- **Base** = S_out + Opt_out + Promised + Pool_unissued
- **ownership_i** = purchaseAmount_i / postMoneyCap_i

This pulls SAFEs into the denominator without loops.

---

## Calculations

### A. Equity Path (Priced Round Conversion)

#### 1. **Cap Price**
```
P_cap_i = postMoneyCap_i / CompanyCap
```

#### 2. **Discount Price**
```
P_disc_i = P_round × (1 - discount_i)
```

Where `P_round = preMoneyValuation / (FD_postSAFE + Inc_pool)`

#### 3. **SAFE Price** (per-SAFE independent)
```
For discount = 0:
  P_safe_i = min(P_cap_i, P_round)
  trigger = 'cap' if P_cap wins, else 'round'

For discount > 0:
  P_safe_i = min(P_cap_i, P_disc_i)
  trigger = 'cap' if P_cap wins, else 'discount'
```

#### 4. **SAFE Shares**
```
Shares_SAFE_i = purchaseAmount_i / P_safe_i
```

#### 5. **Option Pool Top-Up** (Closed-Form Solution)
```
Inc_pool = [ p × (Vpre + N) × B - Vpre × U ] / [ Vpre - p × (Vpre + N) ]
```

Where:
- `p` = poolTargetPct (e.g., 0.10 for 10%)
- `Vpre` = preMoneyValuation
- `N` = newMoneyTotal
- `B` = FD_postSAFE (fully diluted shares post-SAFE)
- `U` = Pool_unissued

**Guard:** If denominator ≤ 0, return validation error.

#### 6. **Pro-Rata Rights** (YC Side-Letter Style)
```
ProRata%_i = Shares_SAFE_i / FD_postSAFE
ProRata$_i = newMoneyTotal × ProRata%_i
ProRataShares_i = ProRata$_i / P_round
```

Only for SAFEs with `hasProRata = true`.

#### 7. **Discount Correction Pass**

If any SAFE is governed by round price (trigger = 'discount' or 'round'):
1. Recompute FD_postSAFE with actual SAFE shares
2. Recompute P_round with updated FD_postSAFE
3. Re-evaluate all SAFE conversions

This is a **one-pass correction** (no iteration).

---

### B. Liquidity Path (Exit Before Priced Round)

#### 1. **Liquidity Capitalization** (Two-Pass)

**Pass 1:** Assume all SAFEs convert
```
LiqCap = S_out + Opt_out + Promised_receiving_proceeds + Σ SAFE_shares
```

**Pass 2:** Mark cash-outs, recalculate
```
LiqCap = S_out + Opt_out + Promised_receiving_proceeds + Σ converting_SAFE_shares
```

#### 2. **Per-Share Consideration**
```
PSC = purchasePrice / LiqCap
```

#### 3. **Liquidity Prices**
```
P_liq_cap_i = postMoneyCap_i / LiqCap

P_liq_disc_i = PSC × (1 - discount_i)  // if discount > 0

P_liq_i = min(P_liq_cap_i, P_liq_disc_i)
```

#### 4. **Convert vs Cash-Out Decision**
```
Shares_liq_i = purchaseAmount_i / P_liq_i
AsConvertedValue_i = Shares_liq_i × PSC
Return_i = max(AsConvertedValue_i, purchaseAmount_i)

Decision: choose path with higher return
```

---

## Most Favored Nation (MFN)

### Rules

1. **Single-hop only**: Each SAFE can only reference the immediately next SAFE round (roundIndex + 1)
2. **Final SAFE cannot have MFN** (no next round to reference)
3. **Comparison basis**: Actual SAFE conversion price (after min(cap, discount) logic)
4. **Effect**: If next round yields strictly lower price, adopt next round's (cap, discount)
5. **One-time**: MFN flag cleared after adoption (non-recursive)

### Implementation

```typescript
if (nextPrice < currentPrice) {
  currentSafe.postMoneyCap = nextSafe.postMoneyCap;
  currentSafe.discount = nextSafe.discount;
  currentSafe.hasMFN = false;
  currentSafe.mfnAdoptedRound = nextSafe.roundIndex;
}
```

Runs as **preprocessing step** before conversion calculations.

---

## Rounding

### Internal Math
- **Full precision** using `Decimal.js-light`
- No rounding during calculations

### Display
- **AUD**: 0 decimals, comma separators
  - Positive: `$123,456`
  - Negative: `($123,456)`
- **Shares**: Whole numbers, comma separators
  - Example: `1,234,567`
- **Prices/share**: 2 decimals
  - Example: `$1.23`
- **Percentages**: 2 decimals
  - Example: `12.34%`

---

## Test Scenarios

### Scenario A: Cap-Governed Equity (Qualified)
- 2 SAFEs, both convert via cap
- SAFE A has pro-rata rights
- Pool target: 10% post-round
- **Expected**: Qualified financing, cap-triggered conversions

### Scenario B: Discount-Governed & Not Qualified
- 1 SAFE with high cap (40M), significant discount (25%)
- New money below threshold
- **Expected**: Not qualified, equity blocked, liquidity still available

### Scenario C: Liquidity Event (Mixed)
- 3 SAFEs across different rounds
- MFN on SAFE D (references SAFE E)
- Purchase price: $35M
- **Expected**: Mixed convert/cash-out decisions, MFN may trigger

---

## Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

**Current test results:** ✅ **15/15 passing (100%)**

---

## Usage Example

```typescript
import { calculate } from '@/lib/math';
import type { CalculatorInputs } from '@/lib/types';

const inputs: CalculatorInputs = {
  capTable: {
    S_out: 8_000_000,
    Opt_out: 800_000,
    Promised: 200_000,
    Pool_unissued: 1_000_000,
    Founder_shares: 6_500_000,
  },
  safes: [
    {
      id: 'safe-1',
      roundIndex: 0,
      purchaseAmount: 500_000,
      postMoneyCap: 10_000_000,
      discount: 0.20,
      hasProRata: true,
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
    purchasePrice: 0,
    includePromisedInProceeds: false,
  },
};

const results = calculate(inputs);

if (results.equity.success) {
  console.log('Round price:', results.equity.roundPrice);
  console.log('SAFE conversions:', results.equity.safeConversions);
}
```

---

## Validation

### Automatic Checks

1. **leadAmount + otherAmount must equal newMoneyTotal**
2. **Pool target validation**: Denominator must be > 0
3. **SAFE ownership sum < 100%** (prevents invalid cap table)
4. **Integer shares** for all inputs

### Error Handling

All errors return structured objects:
```typescript
{
  success: false,
  message: 'Descriptive error message'
}
```

Never throws exceptions.

---

## Assumptions & Scope

### In Scope
✅ YC Post-Money SAFEs (cap + discount)
✅ Pro-rata rights (YC side-letter style)
✅ MFN clauses (single-hop)
✅ Option pool top-up
✅ Liquidity events (convert vs cash-out)

### Out of Scope
❌ Pre-money SAFEs
❌ Convertible notes (interest, maturity dates)
❌ Multiple priced rounds
❌ Warrants, RSUs
❌ Preferred stock preferences (liquidation, participation)

---

## References

- [YC SAFE Templates](https://www.ycombinator.com/documents)
- [YC Post-Money SAFE Primer](https://www.ycombinator.com/post_money_safe)
- Decimal.js Documentation

---

## License

Part of Invest Studio AI
© 2025 Arconic Capital
