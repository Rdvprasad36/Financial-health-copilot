"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INDIAN_STATES = exports.TAX_DISCLAIMER = exports.PAISE_PER_RUPEE = void 0;
exports.formatPaise = formatPaise;
exports.formatPaiseCompact = formatPaiseCompact;
exports.rupeesToPaise = rupeesToPaise;
exports.paiseToRupees = paiseToRupees;
exports.getFinancialYear = getFinancialYear;
exports.getAssessmentYear = getAssessmentYear;
exports.PAISE_PER_RUPEE = 100;
function formatPaise(paise) {
    const rupees = Number(paise) / exports.PAISE_PER_RUPEE;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(rupees);
}
function formatPaiseCompact(paise) {
    const rupees = Number(paise) / exports.PAISE_PER_RUPEE;
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
function rupeesToPaise(rupees) {
    return BigInt(Math.round(rupees * exports.PAISE_PER_RUPEE));
}
function paiseToRupees(paise) {
    return Number(paise) / exports.PAISE_PER_RUPEE;
}
exports.TAX_DISCLAIMER = 'This is an estimate to help you plan — please confirm with a CA before filing. Not a substitute for professional tax/legal advice.';
function getFinancialYear(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth();
    if (month < 3) {
        return `${year - 1}-${String(year).slice(2)}`;
    }
    return `${year}-${String(year + 1).slice(2)}`;
}
function getAssessmentYear(fy) {
    const startYear = parseInt(fy.split('-')[0], 10);
    return `${startYear + 1}-${String(startYear + 2).slice(2)}`;
}
exports.INDIAN_STATES = [
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
];
//# sourceMappingURL=index.js.map