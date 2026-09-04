/**
 * Versioned tax configuration for India.
 * Rates change every Union Budget (Feb). This config is versioned so old estimates
 * remain reproducible and updates don't require code changes.
 *
 * IMPORTANT: All monetary values are in PAISE (1 INR = 100 paise).
 */

import type { BusinessType, TaxRegime } from '../types';

// ─── Config Version ──────────────────────────────────────────────────

export const CURRENT_CONFIG_VERSION = '2025-26-v1';
export const CURRENT_ASSESSMENT_YEAR = '2026-27';
export const CURRENT_FINANCIAL_YEAR = '2025-26';

// ─── GST Thresholds (in paise) ──────────────────────────────────────

/**
 * Special category states with lower GST thresholds.
 * Northeast states + hill states as per CGST Act.
 */
export const SPECIAL_CATEGORY_STATES = [
  'AR', // Arunachal Pradesh
  'AS', // Assam (removed from special category for GST but some rules apply)
  'MN', // Manipur
  'ML', // Meghalaya
  'MZ', // Mizoram
  'NL', // Nagaland
  'SK', // Sikkim
  'TR', // Tripura
  'HP', // Himachal Pradesh
  'UK', // Uttarakhand
  'JK', // Jammu & Kashmir
  'PY', // Puducherry
  'TG', // Telangana (for some specific categories)
] as const;

export interface GstThresholdConfig {
  goodsSeller: {
    general: bigint;
    specialCategory: bigint;
  };
  serviceProvider: {
    general: bigint;
    specialCategory: bigint;
  };
}

export const GST_THRESHOLDS: GstThresholdConfig = {
  goodsSeller: {
    general: BigInt(40_00_000_00),       // ₹40,00,000 = ₹40L
    specialCategory: BigInt(20_00_000_00), // ₹20,00,000 = ₹20L
  },
  serviceProvider: {
    general: BigInt(20_00_000_00),       // ₹20,00,000 = ₹20L
    specialCategory: BigInt(10_00_000_00), // ₹10,00,000 = ₹10L
  },
};

/**
 * GST nudge trigger tiers — percentages of threshold proximity.
 */
export const GST_NUDGE_TIERS = [
  { pct: 0.60, tier: 'watch' as const, label: '60% — time to start planning' },
  { pct: 0.80, tier: 'warning' as const, label: '80% — registration likely within months' },
  { pct: 0.95, tier: 'critical' as const, label: '95% — register now to avoid penalties' },
  { pct: 1.00, tier: 'crossed' as const, label: '100%+ — threshold crossed, registration mandatory' },
];

// ─── Income Tax Slabs (in paise) ────────────────────────────────────

export interface TaxSlab {
  from: bigint;
  to: bigint | null; // null = no upper limit
  rate: number;      // decimal, e.g., 0.05 = 5%
}

/**
 * New Tax Regime slabs (default from AY 2024-25 onwards).
 * Updated per Budget 2025.
 */
export const NEW_REGIME_SLABS: TaxSlab[] = [
  { from: BigInt(0),              to: BigInt(4_00_000_00),   rate: 0.00 },  // 0–4L: Nil
  { from: BigInt(4_00_000_00),    to: BigInt(8_00_000_00),   rate: 0.05 },  // 4–8L: 5%
  { from: BigInt(8_00_000_00),    to: BigInt(12_00_000_00),  rate: 0.10 },  // 8–12L: 10%
  { from: BigInt(12_00_000_00),   to: BigInt(16_00_000_00),  rate: 0.15 },  // 12–16L: 15%
  { from: BigInt(16_00_000_00),   to: BigInt(20_00_000_00),  rate: 0.20 },  // 16–20L: 20%
  { from: BigInt(20_00_000_00),   to: BigInt(24_00_000_00),  rate: 0.25 },  // 20–24L: 25%
  { from: BigInt(24_00_000_00),   to: null,                   rate: 0.30 },  // 24L+: 30%
];

/** Standard deduction under new regime */
export const NEW_REGIME_STANDARD_DEDUCTION = BigInt(75_000_00); // ₹75,000

/** Rebate u/s 87A — new regime: no tax if total income ≤ ₹12L (effective with marginal relief up to ~₹12.75L) */
export const NEW_REGIME_REBATE_LIMIT = BigInt(12_00_000_00);   // ₹12,00,000

/**
 * Old Tax Regime slabs.
 */
export const OLD_REGIME_SLABS: TaxSlab[] = [
  { from: BigInt(0),              to: BigInt(2_50_000_00),   rate: 0.00 },  // 0–2.5L: Nil
  { from: BigInt(2_50_000_00),    to: BigInt(5_00_000_00),   rate: 0.05 },  // 2.5–5L: 5%
  { from: BigInt(5_00_000_00),    to: BigInt(10_00_000_00),  rate: 0.20 },  // 5–10L: 20%
  { from: BigInt(10_00_000_00),   to: null,                   rate: 0.30 },  // 10L+: 30%
];

/** Old regime rebate u/s 87A: no tax if total income ≤ ₹5L */
export const OLD_REGIME_REBATE_LIMIT = BigInt(5_00_000_00);

// ─── Surcharge & Cess ───────────────────────────────────────────────

/** Health & Education Cess: 4% on total tax (including surcharge) */
export const CESS_RATE = 0.04;

/** Surcharge slabs on income tax for individuals */
export interface SurchargeSlab {
  incomeFrom: bigint;
  incomeTo: bigint | null;
  rate: number;
}

export const SURCHARGE_SLABS: SurchargeSlab[] = [
  { incomeFrom: BigInt(0),               incomeTo: BigInt(50_00_000_00),    rate: 0.00 },
  { incomeFrom: BigInt(50_00_000_00),    incomeTo: BigInt(1_00_00_000_00),  rate: 0.10 },
  { incomeFrom: BigInt(1_00_00_000_00),  incomeTo: BigInt(2_00_00_000_00),  rate: 0.15 },
  { incomeFrom: BigInt(2_00_00_000_00),  incomeTo: null,                     rate: 0.25 },
];

// ─── Advance Tax Schedule ───────────────────────────────────────────

/** Minimum tax liability to trigger advance tax requirement */
export const ADVANCE_TAX_THRESHOLD_PAISE = BigInt(10_000_00); // ₹10,000

export interface AdvanceTaxScheduleEntry {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  dueDay: number;
  dueMonth: number; // 1-indexed (6=June, 9=Sep, 12=Dec, 3=Mar)
  cumulativePct: number;
}

/** Standard quarterly advance tax schedule (non-presumptive) */
export const ADVANCE_TAX_SCHEDULE: AdvanceTaxScheduleEntry[] = [
  { quarter: 'Q1', dueDay: 15, dueMonth: 6,  cumulativePct: 0.15 },
  { quarter: 'Q2', dueDay: 15, dueMonth: 9,  cumulativePct: 0.45 },
  { quarter: 'Q3', dueDay: 15, dueMonth: 12, cumulativePct: 0.75 },
  { quarter: 'Q4', dueDay: 15, dueMonth: 3,  cumulativePct: 1.00 },
];

/** Presumptive scheme: single instalment by March 15 */
export const PRESUMPTIVE_TAX_SCHEDULE: AdvanceTaxScheduleEntry[] = [
  { quarter: 'Q4', dueDay: 15, dueMonth: 3, cumulativePct: 1.00 },
];

// ─── Presumptive Taxation ───────────────────────────────────────────

export interface PresumptiveConfig {
  /** Section 44ADA: professionals/creators, gross receipts ≤ ₹75L digital */
  section44ADA: {
    profitRate: number;                   // 50% of gross receipts
    turnoverLimitPaise: bigint;
  };
  /** Section 44AD: goods/trading, turnover ≤ ₹3Cr mostly digital */
  section44AD: {
    digitalProfitRate: number;            // 6% of digital turnover
    nonDigitalProfitRate: number;         // 8% of non-digital turnover
    turnoverLimitPaise: bigint;
  };
}

export const PRESUMPTIVE_CONFIG: PresumptiveConfig = {
  section44ADA: {
    profitRate: 0.50,
    turnoverLimitPaise: BigInt(75_00_000_00),  // ₹75,00,000
  },
  section44AD: {
    digitalProfitRate: 0.06,
    nonDigitalProfitRate: 0.08,
    turnoverLimitPaise: BigInt(3_00_00_000_00), // ₹3,00,00,000
  },
};

// ─── Helper: Get slabs by regime ────────────────────────────────────

export function getTaxSlabs(regime: TaxRegime): TaxSlab[] {
  return regime === 'new' ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
}

export function getRebateLimit(regime: TaxRegime): bigint {
  return regime === 'new' ? NEW_REGIME_REBATE_LIMIT : OLD_REGIME_REBATE_LIMIT;
}

export function isSpecialCategoryState(stateCode: string): boolean {
  return (SPECIAL_CATEGORY_STATES as readonly string[]).includes(stateCode.toUpperCase());
}

export function getGstThreshold(businessType: BusinessType, stateCode: string): bigint {
  const isSpecial = isSpecialCategoryState(stateCode);
  const isGoods = businessType === 'goods_seller';

  if (isGoods) {
    return isSpecial ? GST_THRESHOLDS.goodsSeller.specialCategory : GST_THRESHOLDS.goodsSeller.general;
  }
  // service_creator, freelancer, mixed → service provider thresholds
  return isSpecial ? GST_THRESHOLDS.serviceProvider.specialCategory : GST_THRESHOLDS.serviceProvider.general;
}

// ─── EWMA Smoothing Config ─────────────────────────────────────────

export const SMOOTHING_CONFIG = {
  alpha: 0.25,
  trailingWeeks: 16,
  emergencyBufferMultiplier: 0.5,
  method: 'ewma_v1' as const,
};

// ─── Categories ─────────────────────────────────────────────────────

export const TRANSACTION_CATEGORIES = [
  'sales',
  'ad_spend',
  'platform_fee',
  'shipping',
  'personal_transfer',
  'refund',
  'settlement',
  'payout',
  'subscription',
  'raw_material',
  'service_income',
  'other',
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

/** Keyword patterns for auto-categorization */
export const CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: TransactionCategory }> = [
  { pattern: /razorpay.*settlement/i, category: 'settlement' },
  { pattern: /meta.*ads?|facebook.*ads?|instagram.*ads?/i, category: 'ad_spend' },
  { pattern: /google.*ads?/i, category: 'ad_spend' },
  { pattern: /shiprocket|delhivery|bluedart|ekart|dtdc/i, category: 'shipping' },
  { pattern: /shopify|woocommerce|amazon.*seller/i, category: 'platform_fee' },
  { pattern: /razorpay.*fee|payment.*gateway.*fee/i, category: 'platform_fee' },
  { pattern: /self.*transfer|own.*account/i, category: 'personal_transfer' },
  { pattern: /refund|reversal|chargeback/i, category: 'refund' },
  { pattern: /salary|freelance.*payment|consulting|invoice/i, category: 'service_income' },
  { pattern: /sale|order|purchase|product/i, category: 'sales' },
];
