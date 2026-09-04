export type BusinessType = 'goods_seller' | 'service_creator' | 'freelancer' | 'mixed';
export type PresumptiveScheme = '44AD' | '44ADA' | 'none';
export type TaxRegime = 'new' | 'old';
export type TransactionType = 'income' | 'expense' | 'refund' | 'payout_fee';
export type PaymentProvider = 'razorpay' | 'upi_csv' | 'manual';
export type PaymentSourceStatus = 'active' | 'revoked' | 'error';
export type TaxEstimateStatus = 'upcoming' | 'due_soon' | 'overdue' | 'paid_marked';
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type NudgeType = 'gst_proximity' | 'advance_tax_due' | 'safe_to_spend_update' | 'low_buffer_warning';
export type NudgeChannel = 'whatsapp' | 'email' | 'in_app';
export type ApprovalStatus = 'suggested' | 'confirmed' | 'executed' | 'rejected';
export type LanguagePreference = 'en' | 'hinglish';
export interface UserProfile {
    id: string;
    phone?: string;
    email?: string;
    fullName: string;
    businessType: BusinessType;
    stateCode: string;
    registeredGst: boolean;
    gstin?: string;
    presumptiveScheme: PresumptiveScheme;
    taxRegime: TaxRegime;
    languagePreference: LanguagePreference;
}
export interface Transaction {
    id: string;
    userId: string;
    sourceId: string;
    providerTxnId?: string;
    type: TransactionType;
    amountPaise: bigint;
    currency: string;
    category?: string;
    counterparty?: string;
    txnDate: Date;
}
export interface GstProximityResult {
    rolling12mTurnoverPaise: bigint;
    applicableThresholdPaise: bigint;
    proximityPct: number;
    projectedCrossDate: Date | null;
    crossed: boolean;
    tier: 'safe' | 'watch' | 'warning' | 'critical' | 'crossed';
    caveats: string[];
}
export interface QuarterlyTaxBreakdown {
    quarter: Quarter;
    dueDate: Date;
    cumulativePct: number;
    cumulativeTaxPaise: bigint;
    incrementalTaxPaise: bigint;
}
export interface AdvanceTaxEstimate {
    financialYear: string;
    assessmentYear: string;
    configVersion: string;
    regime: TaxRegime;
    presumptiveScheme: PresumptiveScheme;
    annualizedIncomePaise: bigint;
    estimatedTotalTaxPaise: bigint;
    advanceTaxApplicable: boolean;
    quarterlyBreakdown: QuarterlyTaxBreakdown[];
    disclaimer: string;
}
export interface SafeToSpendResult {
    computedForDate: Date;
    smoothedWeeklyIncomePaise: bigint;
    taxReservePaise: bigint;
    gstReservePaise: bigint;
    platformFeeBufferPaise: bigint;
    emergencyBufferPaise: bigint;
    safeToSpendPaise: bigint;
    method: string;
    warningFlags: string[];
}
export interface NudgePayload {
    type: NudgeType;
    title: string;
    body: string;
    data: Record<string, unknown>;
    channel: NudgeChannel;
}
export interface ExplainerInput {
    safeToSpend: SafeToSpendResult;
    gstStatus: GstProximityResult;
    taxEstimate: AdvanceTaxEstimate;
    userName: string;
    languagePreference: LanguagePreference;
}
export interface SimulationRequest {
    extraIncomePaise: bigint;
    months: number;
}
export interface SimulationResult {
    projectedGstStatus: GstProximityResult;
    projectedTaxEstimate: AdvanceTaxEstimate;
    projectedSafeToSpend: SafeToSpendResult;
}
