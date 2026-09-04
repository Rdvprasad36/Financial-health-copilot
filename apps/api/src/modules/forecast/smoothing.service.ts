import { Injectable } from '@nestjs/common';
import { Transaction, UserProfile, SafeToSpendResult, SMOOTHING_CONFIG } from '@fhc/shared';

@Injectable()
export class SmoothingService {
  /**
   * Computes the safe-to-spend amount based on EWMA smoothing of trailing income.
   */
  computeSafeToSpend(
    transactions: Transaction[],
    userProfile: UserProfile,
    taxEstimate?: { estimatedTotalTaxPaise: bigint; annualizedIncomePaise: bigint }
  ): SafeToSpendResult {
    // 1. Bucket trailing 16 weeks
    const refDate = transactions.length > 0 
      ? new Date(Math.max(...transactions.map(t => t.txnDate.getTime())))
      : new Date();
      
    const sortedTxns = [...transactions].sort((a, b) => a.txnDate.getTime() - b.txnDate.getTime());
    
    const weeksCount = SMOOTHING_CONFIG.trailingWeeks;
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    
    const weeklyIncome = new Array(weeksCount).fill(0n);
    const weeklyPlatformFees = new Array(weeksCount).fill(0n);
    
    for (const txn of sortedTxns) {
      const msDiff = refDate.getTime() - txn.txnDate.getTime();
      const weekIndexDesc = Math.floor(msDiff / msPerWeek);
      
      if (weekIndexDesc >= 0 && weekIndexDesc < weeksCount) {
        const ascIndex = weeksCount - 1 - weekIndexDesc;
        
        if (txn.type === 'income') {
          weeklyIncome[ascIndex] += txn.amountPaise;
        } else if (txn.type === 'refund') {
          weeklyIncome[ascIndex] -= txn.amountPaise;
        }
        
        if (txn.type === 'payout_fee' || txn.category === 'platform_fee') {
          weeklyPlatformFees[ascIndex] += txn.amountPaise;
        }
      }
    }
    
    // The spec mentioned "income - refunds - platform fees" for the bucket, 
    // but also to subtract platformFeeBuffer later. 
    // To avoid double-counting, we smooth the gross income (minus refunds), 
    // and hold platform fees as a buffer. 
    // If we strictly follow the spec's first sentence, we can subtract it here. 
    // We will stick to income - refunds for the base smoothed income.
    
    // Find first week with data
    let firstDataWeek = weeklyIncome.findIndex(amt => amt > 0n);
    if (firstDataWeek === -1) firstDataWeek = weeksCount - 1; // fallback if no income
    
    const actual = weeklyIncome.slice(firstDataWeek);
    if (actual.length === 0) actual.push(0n);
    
    // 2. Compute EWMA
    const alpha = SMOOTHING_CONFIG.alpha;
    let smoothed = actual[0];
    for (let i = 1; i < actual.length; i++) {
      smoothed = BigInt(Math.round(alpha * Number(actual[i]) + (1 - alpha) * Number(smoothed)));
    }
    
    const smoothedWeeklyIncomePaise = smoothed > 0n ? smoothed : 0n;
    
    // 3. Compute weekly std dev of the 16-week trailing income
    const actualNumbers = weeklyIncome.map(n => Number(n)); // use all 16 weeks for std dev
    const mean = actualNumbers.reduce((a, b) => a + b, 0) / weeksCount;
    const variance = actualNumbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / weeksCount;
    const stdDev = Math.sqrt(variance);
    const emergencyBufferPaise = BigInt(Math.round(stdDev * SMOOTHING_CONFIG.emergencyBufferMultiplier));
    
    // 4. Reserves
    let effectiveTaxRate = 0.10; // default
    if (taxEstimate && taxEstimate.annualizedIncomePaise > 0n) {
      effectiveTaxRate = Number(taxEstimate.estimatedTotalTaxPaise) / Number(taxEstimate.annualizedIncomePaise);
    }
    const taxReservePaise = BigInt(Math.round(Number(smoothedWeeklyIncomePaise) * effectiveTaxRate));
    
    const gstReservePaise = userProfile.registeredGst 
      ? BigInt(Math.round(Number(smoothedWeeklyIncomePaise) * 0.05)) 
      : 0n;
      
    // trailing average of platform_fee transactions as % of income
    let totalIncome = 0n;
    let totalPlatformFees = 0n;
    for (let i = 0; i < weeksCount; i++) {
      totalIncome += weeklyIncome[i];
      totalPlatformFees += weeklyPlatformFees[i];
    }
    
    let platformFeePct = 0.02; // default 2%
    if (totalIncome > 0n) {
      platformFeePct = Number(totalPlatformFees) / Number(totalIncome);
    }
    const platformFeeBufferPaise = BigInt(Math.round(Number(smoothedWeeklyIncomePaise) * platformFeePct));
    
    // 5. safeToSpend
    let safeToSpendPaise = smoothedWeeklyIncomePaise - taxReservePaise - gstReservePaise - platformFeeBufferPaise - emergencyBufferPaise;
    
    // 6. Floor and warnings
    const warningFlags: string[] = [];
    if (safeToSpendPaise < 0n) {
      safeToSpendPaise = 0n;
      warningFlags.push('spending_into_tax_reserve');
    }
    if (actual.length < 2) {
      warningFlags.push('insufficient_data');
    }
    
    return {
      computedForDate: refDate,
      smoothedWeeklyIncomePaise,
      taxReservePaise,
      gstReservePaise,
      platformFeeBufferPaise,
      emergencyBufferPaise,
      safeToSpendPaise,
      method: SMOOTHING_CONFIG.method,
      warningFlags
    };
  }
}
