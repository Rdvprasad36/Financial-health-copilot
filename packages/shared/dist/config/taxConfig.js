"use strict";
/**
 * Versioned tax configuration for India.
 * Rates change every Union Budget (Feb). This config is versioned so old estimates
 * remain reproducible and updates don't require code changes.
 *
 * IMPORTANT: All monetary values are in PAISE (1 INR = 100 paise).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATEGORY_PATTERNS = exports.TRANSACTION_CATEGORIES = exports.SMOOTHING_CONFIG = exports.PRESUMPTIVE_CONFIG = exports.PRESUMPTIVE_TAX_SCHEDULE = exports.ADVANCE_TAX_SCHEDULE = exports.ADVANCE_TAX_THRESHOLD_PAISE = exports.SURCHARGE_SLABS = exports.CESS_RATE = exports.OLD_REGIME_REBATE_LIMIT = exports.OLD_REGIME_SLABS = exports.NEW_REGIME_REBATE_LIMIT = exports.NEW_REGIME_STANDARD_DEDUCTION = exports.NEW_REGIME_SLABS = exports.GST_NUDGE_TIERS = exports.GST_THRESHOLDS = exports.SPECIAL_CATEGORY_STATES = exports.CURRENT_FINANCIAL_YEAR = exports.CURRENT_ASSESSMENT_YEAR = exports.CURRENT_CONFIG_VERSION = void 0;
exports.getTaxSlabs = getTaxSlabs;
exports.getRebateLimit = getRebateLimit;
exports.isSpecialCategoryState = isSpecialCategoryState;
exports.getGstThreshold = getGstThreshold;
// ─── Config Version ──────────────────────────────────────────────────
exports.CURRENT_CONFIG_VERSION = '2025-26-v1';
exports.CURRENT_ASSESSMENT_YEAR = '2026-27';
exports.CURRENT_FINANCIAL_YEAR = '2025-26';
// ─── GST Thresholds (in paise) ──────────────────────────────────────
/**
 * Special category states with lower GST thresholds.
 * Northeast states + hill states as per CGST Act.
 */
exports.SPECIAL_CATEGORY_STATES = [
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
];
exports.GST_THRESHOLDS = {
    goodsSeller: {
        general: BigInt(40_00_000_00), // ₹40,00,000 = ₹40L
        specialCategory: BigInt(20_00_000_00), // ₹20,00,000 = ₹20L
    },
    serviceProvider: {
        general: BigInt(20_00_000_00), // ₹20,00,000 = ₹20L
        specialCategory: BigInt(10_00_000_00), // ₹10,00,000 = ₹10L
    },
};
/**
 * GST nudge trigger tiers — percentages of threshold proximity.
 */
exports.GST_NUDGE_TIERS = [
    { pct: 0.60, tier: 'watch', label: '60% — time to start planning' },
    { pct: 0.80, tier: 'warning', label: '80% — registration likely within months' },
    { pct: 0.95, tier: 'critical', label: '95% — register now to avoid penalties' },
    { pct: 1.00, tier: 'crossed', label: '100%+ — threshold crossed, registration mandatory' },
];
/**
 * New Tax Regime slabs (default from AY 2024-25 onwards).
 * Updated per Budget 2025.
 */
exports.NEW_REGIME_SLABS = [
    { from: BigInt(0), to: BigInt(4_00_000_00), rate: 0.00 }, // 0–4L: Nil
    { from: BigInt(4_00_000_00), to: BigInt(8_00_000_00), rate: 0.05 }, // 4–8L: 5%
    { from: BigInt(8_00_000_00), to: BigInt(12_00_000_00), rate: 0.10 }, // 8–12L: 10%
    { from: BigInt(12_00_000_00), to: BigInt(16_00_000_00), rate: 0.15 }, // 12–16L: 15%
    { from: BigInt(16_00_000_00), to: BigInt(20_00_000_00), rate: 0.20 }, // 16–20L: 20%
    { from: BigInt(20_00_000_00), to: BigInt(24_00_000_00), rate: 0.25 }, // 20–24L: 25%
    { from: BigInt(24_00_000_00), to: null, rate: 0.30 }, // 24L+: 30%
];
/** Standard deduction under new regime */
exports.NEW_REGIME_STANDARD_DEDUCTION = BigInt(75_000_00); // ₹75,000
/** Rebate u/s 87A — new regime: no tax if total income ≤ ₹12L (effective with marginal relief up to ~₹12.75L) */
exports.NEW_REGIME_REBATE_LIMIT = BigInt(12_00_000_00); // ₹12,00,000
/**
 * Old Tax Regime slabs.
 */
exports.OLD_REGIME_SLABS = [
    { from: BigInt(0), to: BigInt(2_50_000_00), rate: 0.00 }, // 0–2.5L: Nil
    { from: BigInt(2_50_000_00), to: BigInt(5_00_000_00), rate: 0.05 }, // 2.5–5L: 5%
    { from: BigInt(5_00_000_00), to: BigInt(10_00_000_00), rate: 0.20 }, // 5–10L: 20%
    { from: BigInt(10_00_000_00), to: null, rate: 0.30 }, // 10L+: 30%
];
/** Old regime rebate u/s 87A: no tax if total income ≤ ₹5L */
exports.OLD_REGIME_REBATE_LIMIT = BigInt(5_00_000_00);
// ─── Surcharge & Cess ───────────────────────────────────────────────
/** Health & Education Cess: 4% on total tax (including surcharge) */
exports.CESS_RATE = 0.04;
exports.SURCHARGE_SLABS = [
    { incomeFrom: BigInt(0), incomeTo: BigInt(50_00_000_00), rate: 0.00 },
    { incomeFrom: BigInt(50_00_000_00), incomeTo: BigInt(1_00_00_000_00), rate: 0.10 },
    { incomeFrom: BigInt(1_00_00_000_00), incomeTo: BigInt(2_00_00_000_00), rate: 0.15 },
    { incomeFrom: BigInt(2_00_00_000_00), incomeTo: null, rate: 0.25 },
];
// ─── Advance Tax Schedule ───────────────────────────────────────────
/** Minimum tax liability to trigger advance tax requirement */
exports.ADVANCE_TAX_THRESHOLD_PAISE = BigInt(10_000_00); // ₹10,000
/** Standard quarterly advance tax schedule (non-presumptive) */
exports.ADVANCE_TAX_SCHEDULE = [
    { quarter: 'Q1', dueDay: 15, dueMonth: 6, cumulativePct: 0.15 },
    { quarter: 'Q2', dueDay: 15, dueMonth: 9, cumulativePct: 0.45 },
    { quarter: 'Q3', dueDay: 15, dueMonth: 12, cumulativePct: 0.75 },
    { quarter: 'Q4', dueDay: 15, dueMonth: 3, cumulativePct: 1.00 },
];
/** Presumptive scheme: single instalment by March 15 */
exports.PRESUMPTIVE_TAX_SCHEDULE = [
    { quarter: 'Q4', dueDay: 15, dueMonth: 3, cumulativePct: 1.00 },
];
exports.PRESUMPTIVE_CONFIG = {
    section44ADA: {
        profitRate: 0.50,
        turnoverLimitPaise: BigInt(75_00_000_00), // ₹75,00,000
    },
    section44AD: {
        digitalProfitRate: 0.06,
        nonDigitalProfitRate: 0.08,
        turnoverLimitPaise: BigInt(3_00_00_000_00), // ₹3,00,00,000
    },
};
// ─── Helper: Get slabs by regime ────────────────────────────────────
function getTaxSlabs(regime) {
    return regime === 'new' ? exports.NEW_REGIME_SLABS : exports.OLD_REGIME_SLABS;
}
function getRebateLimit(regime) {
    return regime === 'new' ? exports.NEW_REGIME_REBATE_LIMIT : exports.OLD_REGIME_REBATE_LIMIT;
}
function isSpecialCategoryState(stateCode) {
    return exports.SPECIAL_CATEGORY_STATES.includes(stateCode.toUpperCase());
}
function getGstThreshold(businessType, stateCode) {
    const isSpecial = isSpecialCategoryState(stateCode);
    const isGoods = businessType === 'goods_seller';
    if (isGoods) {
        return isSpecial ? exports.GST_THRESHOLDS.goodsSeller.specialCategory : exports.GST_THRESHOLDS.goodsSeller.general;
    }
    // service_creator, freelancer, mixed → service provider thresholds
    return isSpecial ? exports.GST_THRESHOLDS.serviceProvider.specialCategory : exports.GST_THRESHOLDS.serviceProvider.general;
}
// ─── EWMA Smoothing Config ─────────────────────────────────────────
exports.SMOOTHING_CONFIG = {
    alpha: 0.25,
    trailingWeeks: 16,
    emergencyBufferMultiplier: 0.5,
    method: 'ewma_v1',
};
// ─── Categories ─────────────────────────────────────────────────────
exports.TRANSACTION_CATEGORIES = [
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
];
/** Keyword patterns for auto-categorization */
exports.CATEGORY_PATTERNS = [
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
