/**
 * YC Post-Money SAFE Calculator - Formatting Helpers
 *
 * Display AUD with 0 decimals, shares as whole numbers
 * Keep internal math at full precision using Decimal
 */

import Decimal from 'decimal.js-light';

/**
 * Format AUD currency with no decimals
 * Negatives shown as ($123,456)
 * @param value - Amount in AUD
 * @returns Formatted string like "$123,456" or "($123,456)"
 */
export function formatAUD(value: number | Decimal): string {
  const num = typeof value === 'number' ? value : value.toNumber();
  const absValue = Math.abs(Math.round(num));
  const formatted = absValue.toLocaleString('en-AU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (num < 0) {
    return `($${formatted})`;
  }
  return `$${formatted}`;
}

/**
 * Format shares as whole numbers with comma separators
 * @param value - Share count
 * @returns Formatted string like "1,234,567"
 */
export function formatShares(value: number | Decimal): string {
  const num = typeof value === 'number' ? value : value.toNumber();
  return Math.round(num).toLocaleString('en-AU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format price per share with 2 decimals
 * @param value - Price per share in AUD
 * @returns Formatted string like "$1.23"
 */
export function formatPricePerShare(value: number | Decimal): string {
  const num = typeof value === 'number' ? value : value.toNumber();
  const absValue = Math.abs(num);
  const formatted = absValue.toLocaleString('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (num < 0) {
    return `($${formatted})`;
  }
  return `$${formatted}`;
}

/**
 * Format percentage with 2 decimals
 * @param value - Percentage as decimal (0.1234 = 12.34%)
 * @returns Formatted string like "12.34%"
 */
export function formatPercent(value: number | Decimal): string {
  const num = typeof value === 'number' ? value : value.toNumber();
  return `${(num * 100).toFixed(2)}%`;
}

/**
 * Format discount rate as percentage (input is 0..1)
 * @param value - Discount rate (0.2 = 20%)
 * @returns Formatted string like "20%"
 */
export function formatDiscountRate(value: number | Decimal): string {
  return formatPercent(value);
}

/**
 * Round shares to whole number
 * @param value - Share count (Decimal or number)
 * @returns Whole number
 */
export function roundShares(value: number | Decimal): number {
  const num = typeof value === 'number' ? value : value.toNumber();
  return Math.round(num);
}

/**
 * Round AUD to whole number
 * @param value - Amount in AUD (Decimal or number)
 * @returns Whole number
 */
export function roundAUD(value: number | Decimal): number {
  const num = typeof value === 'number' ? value : value.toNumber();
  return Math.round(num);
}

/**
 * Convert number to Decimal for precise calculations
 * @param value - Input number
 * @returns Decimal instance
 */
export function toDecimal(value: number): Decimal {
  return new Decimal(value);
}

/**
 * Convert Decimal to number for display
 * @param value - Decimal instance
 * @returns Number
 */
export function toNumber(value: Decimal): number {
  return value.toNumber();
}
