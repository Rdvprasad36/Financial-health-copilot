export declare const PAISE_PER_RUPEE = 100;
export declare function formatPaise(paise: bigint): string;
export declare function formatPaiseCompact(paise: bigint): string;
export declare function rupeesToPaise(rupees: number): bigint;
export declare function paiseToRupees(paise: bigint): number;
export declare const TAX_DISCLAIMER = "This is an estimate to help you plan \u2014 please confirm with a CA before filing. Not a substitute for professional tax/legal advice.";
export declare function getFinancialYear(date?: Date): string;
export declare function getAssessmentYear(fy: string): string;
export declare const INDIAN_STATES: readonly [{
    readonly code: "AN";
    readonly name: "Andaman and Nicobar Islands";
}, {
    readonly code: "AP";
    readonly name: "Andhra Pradesh";
}, {
    readonly code: "AR";
    readonly name: "Arunachal Pradesh";
}, {
    readonly code: "AS";
    readonly name: "Assam";
}, {
    readonly code: "BR";
    readonly name: "Bihar";
}, {
    readonly code: "CG";
    readonly name: "Chhattisgarh";
}, {
    readonly code: "CH";
    readonly name: "Chandigarh";
}, {
    readonly code: "DD";
    readonly name: "Dadra and Nagar Haveli and Daman and Diu";
}, {
    readonly code: "DL";
    readonly name: "Delhi";
}, {
    readonly code: "GA";
    readonly name: "Goa";
}, {
    readonly code: "GJ";
    readonly name: "Gujarat";
}, {
    readonly code: "HP";
    readonly name: "Himachal Pradesh";
}, {
    readonly code: "HR";
    readonly name: "Haryana";
}, {
    readonly code: "JH";
    readonly name: "Jharkhand";
}, {
    readonly code: "JK";
    readonly name: "Jammu and Kashmir";
}, {
    readonly code: "KA";
    readonly name: "Karnataka";
}, {
    readonly code: "KL";
    readonly name: "Kerala";
}, {
    readonly code: "LA";
    readonly name: "Ladakh";
}, {
    readonly code: "MH";
    readonly name: "Maharashtra";
}, {
    readonly code: "ML";
    readonly name: "Meghalaya";
}, {
    readonly code: "MN";
    readonly name: "Manipur";
}, {
    readonly code: "MP";
    readonly name: "Madhya Pradesh";
}, {
    readonly code: "MZ";
    readonly name: "Mizoram";
}, {
    readonly code: "NL";
    readonly name: "Nagaland";
}, {
    readonly code: "OD";
    readonly name: "Odisha";
}, {
    readonly code: "PB";
    readonly name: "Punjab";
}, {
    readonly code: "PY";
    readonly name: "Puducherry";
}, {
    readonly code: "RJ";
    readonly name: "Rajasthan";
}, {
    readonly code: "SK";
    readonly name: "Sikkim";
}, {
    readonly code: "TG";
    readonly name: "Telangana";
}, {
    readonly code: "TN";
    readonly name: "Tamil Nadu";
}, {
    readonly code: "TR";
    readonly name: "Tripura";
}, {
    readonly code: "UK";
    readonly name: "Uttarakhand";
}, {
    readonly code: "UP";
    readonly name: "Uttar Pradesh";
}, {
    readonly code: "WB";
    readonly name: "West Bengal";
}];
