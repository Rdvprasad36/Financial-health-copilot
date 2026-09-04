import { Injectable } from '@nestjs/common';
import { getGstThreshold } from '@fhc/shared';
import type { BusinessType } from '@fhc/shared';

export interface GstProximityResult {
  proximityPercentage: number;
  projectedCrossDate: string | null;
  tier: 'safe' | 'watch' | 'warning' | 'critical' | 'crossed';
  caveats: string[];
}

@Injectable()
export class GstService {
  /**
   * Computes the proximity to the GST registration threshold.
   * @param rolling12mTurnoverPaise The rolling 12-month turnover in paise.
   * @param businessType The type of business (goods_seller, service_creator, freelancer, mixed).
   * @param stateCode The 2-letter state code.
   * @returns GstProximityResult object.
   */
  computeGstProximity(rolling12mTurnoverPaise: bigint, businessType: BusinessType, stateCode: string): GstProximityResult {
    const threshold = getGstThreshold(businessType, stateCode);
    const ratio = Number(rolling12mTurnoverPaise) / Number(threshold);
    
    let tier: GstProximityResult['tier'] = 'safe';
    if (ratio >= 1.0) tier = 'crossed';
    else if (ratio >= 0.95) tier = 'critical';
    else if (ratio >= 0.8) tier = 'warning';
    else if (ratio >= 0.6) tier = 'watch';
    
    let projectedCrossDate: string | null = null;
    if (tier !== 'crossed' && rolling12mTurnoverPaise > BigInt(0)) {
      const monthlyAvg = Number(rolling12mTurnoverPaise) / 12;
      const remaining = Number(threshold) - Number(rolling12mTurnoverPaise);
      const monthsToCross = remaining / monthlyAvg;
      
      const crossDate = new Date();
      crossDate.setDate(crossDate.getDate() + Math.round(monthsToCross * 30.44)); // Approx days in a month
      projectedCrossDate = crossDate.toISOString().split('T')[0];
    }

    return {
      proximityPercentage: ratio * 100,
      projectedCrossDate,
      tier,
      caveats: [
        'Based on connected accounts only',
        'inter-state supply may trigger compulsory registration'
      ]
    };
  }
}
