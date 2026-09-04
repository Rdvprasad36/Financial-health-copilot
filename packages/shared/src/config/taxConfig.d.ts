import type { BusinessType, TaxRegime } from '../types';
export declare const CURRENT_CONFIG_VERSION = "2025-26-v1";
export declare const CURRENT_ASSESSMENT_YEAR = "2026-27";
export declare const CURRENT_FINANCIAL_YEAR = "2025-26";
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
export declare const NEW_REGIME_SLABS: TaxSlab[];
export declare const NEW_REGIME_STANDARD_DEDUCTION: bigint;
export declare const NEW_REGIME_REBATE_LIMIT: bigint;
export declare const OLD_REGIME_SLABS: TaxSlab[];
export declare const OLD_REGIME_REBATE_LIMIT: bigint;
export declare const CESS_RATE = 0.04;
export interface SurchargeSlab {
    incomeFrom: bigint;
    incomeTo: bigint | null;
    rate: number;
}
export declare const SURCHARGE_SLABS: SurchargeSlab[];
export declare const ADVANCE_TAX_THRESHOLD_PAISE: bigint;
export interface AdvanceTaxScheduleEntry {
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    dueDay: number;
    dueMonth: number;
    cumulativePct: number;
}
export declare const ADVANCE_TAX_SCHEDULE: AdvanceTaxScheduleEntry[];
export declare const PRESUMPTIVE_TAX_SCHEDULE: AdvanceTaxScheduleEntry[];
export interface PresumptiveConfig {
    section44ADA: {
        profitRate: number;
        turnoverLimitPaise: bigint;
    };
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
export declare const CATEGORY_PATTERNS: Array<{
    pattern: RegExp;
    category: TransactionCategory;
}>;
