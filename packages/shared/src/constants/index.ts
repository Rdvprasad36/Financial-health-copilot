/** Application-wide constants */

/** Paise per rupee — all money is stored as integer paise */
export const PAISE_PER_RUPEE = 100;

/** Format paise amount to INR display string */
export function formatPaise(paise: bigint): string {
  const rupees = Number(paise) / PAISE_PER_RUPEE;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}

/** Format paise to compact display (e.g., ₹16.4L) */
export function formatPaiseCompact(paise: bigint): string {
  const rupees = Number(paise) / PAISE_PER_RUPEE;
  if (rupees >= 10_000_000) {
    return `₹${(rupees / 10_000_000).toFixed(1)}Cr`;
  }
  if (rupees >= 100_000) {
    return `₹${(rupees / 100_000).toFixed(1)}L`;
  }
  if (rupees >= 1_000) {
    return `₹${(rupees / 1_000).toFixed(1)}K`;
  }
  return `₹${rupees.toFixed(0)}`;
}

/** Convert rupees to paise */
export function rupeesToPaise(rupees: number): bigint {
  return BigInt(Math.round(rupees * PAISE_PER_RUPEE));
}

/** Convert paise to rupees */
export function paiseToRupees(paise: bigint): number {
  return Number(paise) / PAISE_PER_RUPEE;
}

/** Disclaimer text — must appear on all tax estimates */
export const TAX_DISCLAIMER =
  'This is an estimate to help you plan — please confirm with a CA before filing. Not a substitute for professional tax/legal advice.';

/** Indian financial year: April 1 – March 31 */
export function getFinancialYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  if (month < 3) {
    // Jan–Mar belongs to previous FY
    return `${year - 1}-${String(year).slice(2)}`;
  }
  return `${year}-${String(year + 1).slice(2)}`;
}

/** Get assessment year from financial year */
export function getAssessmentYear(fy: string): string {
  const startYear = parseInt(fy.split('-')[0], 10);
  return `${startYear + 1}-${String(startYear + 2).slice(2)}`;
}

/** Indian state codes for dropdown */
export const INDIAN_STATES = [
  { code: 'AN', name: 'Andaman and Nicobar Islands' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CG', name: 'Chhattisgarh' },
  { code: 'CH', name: 'Chandigarh' },
  { code: 'DD', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: 'DL', name: 'Delhi' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'HR', name: 'Haryana' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'JK', name: 'Jammu and Kashmir' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'LA', name: 'Ladakh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MN', name: 'Manipur' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OD', name: 'Odisha' },
  { code: 'PB', name: 'Punjab' },
  { code: 'PY', name: 'Puducherry' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TG', name: 'Telangana' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UK', name: 'Uttarakhand' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'WB', name: 'West Bengal' },
] as const;
