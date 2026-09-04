/**
 * Versioned tax configuration for India.
 * Rates change every Union Budget (Feb). This config is versioned so old estimates
 * remain reproducible and updates don't require code changes.
 *
 * IMPORTANT: All monetary values are in PAISE (1 INR = 100 paise).
 */
import type { BusinessType, TaxRegime } from '../types';
export declare const CURRENT_CONFIG_VERSION = "2025-26-v1";
export declare const CURRENT_ASSESSMENT_YEAR = "2026-27";
export declare const CURRENT_FINANCIAL_YEAR = "2025-26";
/**
 * Special category states with lower GST thresholds.
 * Northeast states + hill states as per CGST Act.
 */
export declare const SPECIAL_CATEGORY_STATES: readonly ["AR", "AS", "MN", "ML", "MZ", "NL", "SK", "TR", "HP", "UK", "JK", "PY", "TG"];
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
export declare const GST_THRESHOLDS: GstThresholdConfig;
/**
 * GST nudge trigger tiers — percentages of threshold proximity.
 */
export declare const GST_NUDGE_TIERS: ({
    pct: number;
    tier: "watch";
    label: string;
} | {
    pct: number;
    tier: "warning";
    label: string;
} | {
    pct: number;
    tier: "critical";
    label: string;
} | {
    pct: number;
    tier: "crossed";
    label: string;
})[];
export interface TaxSlab {
    from: bigint;
    to: bigint | null;
    rate: number;
}
/**
 * New Tax Regime slabs (default from AY 2024-25 onwards).
 * Updated per Budget 2025.
 */
export declare const NEW_REGIME_SLABS: TaxSlab[];
/** Standard deduction under new regime */
export declare const NEW_REGIME_STANDARD_DEDUCTION: bigint;
/** Rebate u/s 87A — new regime: no tax if total income ≤ ₹12L (effective with marginal relief up to ~₹12.75L) */
export declare const NEW_REGIME_REBATE_LIMIT: bigint;
/**
 * Old Tax Regime slabs.
 */
export declare const OLD_REGIME_SLABS: TaxSlab[];
/** Old regime rebate u/s 87A: no tax if total income ≤ ₹5L */
export declare const OLD_REGIME_REBATE_LIMIT: bigint;
/** Health & Education Cess: 4% on total tax (including surcharge) */
export declare const CESS_RATE = 0.04;
/** Surcharge slabs on income tax for individuals */
export interface SurchargeSlab {
    incomeFrom: bigint;
    incomeTo: bigint | null;
    rate: number;
}
export declare const SURCHARGE_SLABS: SurchargeSlab[];
/** Minimum tax liability to trigger advance tax requirement */
export declare const ADVANCE_TAX_THRESHOLD_PAISE: bigint;
export interface AdvanceTaxScheduleEntry {
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    dueDay: number;
    dueMonth: number;
    cumulativePct: number;
}
/** Standard quarterly advance tax schedule (non-presumptive) */
export declare const ADVANCE_TAX_SCHEDULE: AdvanceTaxScheduleEntry[];
/** Presumptive scheme: single instalment by March 15 */
export declare const PRESUMPTIVE_TAX_SCHEDULE: AdvanceTaxScheduleEntry[];
export interface PresumptiveConfig {
    /** Section 44ADA: professionals/creators, gross receipts ≤ ₹75L digital */
    section44ADA: {
        profitRate: number;
        turnoverLimitPaise: bigint;
    };
    /** Section 44AD: goods/trading, turnover ≤ ₹3Cr mostly digital */
    section44AD: {
        digitalProfitRate: number;
        nonDigitalProfitRate: number;
        turnoverLimitPaise: bigint;
    };
}
export declare const PRESUMPTIVE_CONFIG: PresumptiveConfig;
export declare function getTaxSlabs(regime: TaxRegime): TaxSlab[];
export declare function getRebateLimit(regime: TaxRegime): bigint;
export declare function isSpecialCategoryState(stateCode: string): boolean;
export declare function getGstThreshold(businessType: BusinessType, stateCode: string): bigint;
export declare const SMOOTHING_CONFIG: {
    alpha: number;
    trailingWeeks: number;
    emergencyBufferMultiplier: number;
    method: "ewma_v1";
};
export declare const TRANSACTION_CATEGORIES: readonly ["sales", "ad_spend", "platform_fee", "shipping", "personal_transfer", "refund", "settlement", "payout", "subscription", "raw_material", "service_income", "other"];
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];
/** Keyword patterns for auto-categorization */
export declare const CATEGORY_PATTERNS: Array<{
    pattern: RegExp;
    category: TransactionCategory;
}>;
