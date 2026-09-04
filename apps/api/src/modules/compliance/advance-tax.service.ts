import { Injectable } from '@nestjs/common';
import { 
  getTaxSlabs, 
  getRebateLimit, 
  CESS_RATE, 
  SURCHARGE_SLABS,
  PRESUMPTIVE_CONFIG,
  ADVANCE_TAX_THRESHOLD_PAISE,
  ADVANCE_TAX_SCHEDULE,
  PRESUMPTIVE_TAX_SCHEDULE,
  CURRENT_CONFIG_VERSION,
  CURRENT_ASSESSMENT_YEAR,
  NEW_REGIME_STANDARD_DEDUCTION
} from '@fhc/shared';
import type { TaxRegime } from '@fhc/shared';

export type PresumptiveScheme = '44ADA' | '44AD' | 'none';

export interface AdvanceTaxInstalment {
  quarter: string;
  dueDate: string;
  cumulativePct: number;
  amountDuePaise: bigint;
}

export interface AdvanceTaxEstimate {
  taxableIncomePaise: bigint;
  totalTaxPaise: bigint;
  isApplicable: boolean;
  instalments: AdvanceTaxInstalment[];
  configVersion: string;
  assessmentYear: string;
  disclaimer: string;
}

@Injectable()
export class AdvanceTaxService {
  /**
   * Computes total tax on given taxable income for a regime.
   */
  computeTaxOnIncome(taxableIncomePaise: bigint, regime: TaxRegime): bigint {
    const slabs = getTaxSlabs(regime);
    let taxPaise = BigInt(0);

    for (const slab of slabs) {
      if (taxableIncomePaise > slab.from) {
        const taxableInSlab = slab.to !== null && taxableIncomePaise > slab.to
          ? slab.to - slab.from
          : taxableIncomePaise - slab.from;
        
        taxPaise += BigInt(Math.floor(Number(taxableInSlab) * slab.rate));
      }
    }

    const rebateLimit = getRebateLimit(regime);
    if (taxableIncomePaise <= rebateLimit) {
      return BigInt(0);
    }
    
    let surchargeRate = 0;
    for (const s of SURCHARGE_SLABS) {
      if (taxableIncomePaise > s.incomeFrom) {
        if (s.incomeTo === null || taxableIncomePaise <= s.incomeTo) {
          surchargeRate = s.rate;
          break;
        }
      }
    }
    
    const surchargeAmount = BigInt(Math.floor(Number(taxPaise) * surchargeRate));
    const taxWithSurcharge = taxPaise + surchargeAmount;
    const cessAmount = BigInt(Math.floor(Number(taxWithSurcharge) * CESS_RATE));
    
    return taxWithSurcharge + cessAmount;
  }

  /**
   * Estimates advance tax schedule based on income and presumptive scheme.
   */
  estimateAdvanceTax(annualizedIncomePaise: bigint, presumptiveScheme: PresumptiveScheme, regime: TaxRegime, financialYear = '2025-26'): AdvanceTaxEstimate {
    let taxableIncomePaise = annualizedIncomePaise;
    
    if (presumptiveScheme === '44ADA') {
      taxableIncomePaise = BigInt(Math.floor(Number(annualizedIncomePaise) * PRESUMPTIVE_CONFIG.section44ADA.profitRate));
    } else if (presumptiveScheme === '44AD') {
      taxableIncomePaise = BigInt(Math.floor(Number(annualizedIncomePaise) * PRESUMPTIVE_CONFIG.section44AD.digitalProfitRate));
    }

    if (regime === 'new') {
      taxableIncomePaise = taxableIncomePaise > NEW_REGIME_STANDARD_DEDUCTION ? taxableIncomePaise - NEW_REGIME_STANDARD_DEDUCTION : BigInt(0);
    }

    const totalTaxPaise = this.computeTaxOnIncome(taxableIncomePaise, regime);
    const isApplicable = totalTaxPaise >= ADVANCE_TAX_THRESHOLD_PAISE;
    const schedule = presumptiveScheme === 'none' ? ADVANCE_TAX_SCHEDULE : PRESUMPTIVE_TAX_SCHEDULE;
    const startYear = parseInt(financialYear.split('-')[0], 10);
    
    const instalments: AdvanceTaxInstalment[] = schedule.map((entry: any) => {
      const year = entry.dueMonth < 4 ? startYear + 1 : startYear;
      const dueDate = `${year}-${entry.dueMonth.toString().padStart(2, '0')}-${entry.dueDay.toString().padStart(2, '0')}`;
      return {
        quarter: entry.quarter,
        dueDate,
        cumulativePct: entry.cumulativePct,
        amountDuePaise: BigInt(Math.floor(Number(totalTaxPaise) * entry.cumulativePct))
      };
    });

    return {
      taxableIncomePaise,
      totalTaxPaise,
      isApplicable,
      instalments,
      configVersion: CURRENT_CONFIG_VERSION,
      assessmentYear: CURRENT_ASSESSMENT_YEAR,
      disclaimer: 'This is an estimate. Final tax liability may vary. Please consult a tax advisor.'
    };
  }
}
