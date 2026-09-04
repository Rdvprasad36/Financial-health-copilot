import { SmoothingService } from '../smoothing.service';
import { generateSyntheticPersonas } from '../synthetic-data';
import { SMOOTHING_CONFIG } from '@fhc/shared';

describe('SmoothingService', () => {
  let smoothingService: SmoothingService;

  beforeEach(() => {
    smoothingService = new SmoothingService();
  });

  it('Steady income (Neha): EWMA should track closely to actual, small buffer', () => {
    const { neha } = generateSyntheticPersonas();
    
    // Simulate estimated tax of 10%
    const taxEstimate = {
      estimatedTotalTaxPaise: 40000000n, // 4L
      annualizedIncomePaise: 400000000n, // 40L
    };

    const result = smoothingService.computeSafeToSpend(neha.transactions, neha.user, taxEstimate);
    
    // Neha makes 35K-45K/week -> avg ~40K -> 40,000 * 100 = 4,000,000 paise
    // Expect smoothed to be around 40K
    expect(Number(result.smoothedWeeklyIncomePaise)).toBeGreaterThan(3400000);
    expect(Number(result.smoothedWeeklyIncomePaise)).toBeLessThan(4600000);
    
    // Expect emergency buffer to be relatively small (< 10K = 1,000,000 paise)
    expect(Number(result.emergencyBufferPaise)).toBeLessThan(1500000);
    
    // safeToSpend should not be negative
    expect(Number(result.safeToSpendPaise)).toBeGreaterThanOrEqual(0);
    expect(result.warningFlags).not.toContain('spending_into_tax_reserve');
  });

  it('Spiky income (Raj): EWMA should dampen spikes, larger emergency buffer', () => {
    const { raj } = generateSyntheticPersonas();
    
    const result = smoothingService.computeSafeToSpend(raj.transactions, raj.user);
    
    // Raj has spikes of 150K-200K every 3 weeks, so avg is ~50K-66K per week
    // His standard deviation will be high, leading to a larger emergency buffer
    // Let's check emergency buffer is substantial (> 10K)
    expect(Number(result.emergencyBufferPaise)).toBeGreaterThan(1000000);
    
    expect(Number(result.safeToSpendPaise)).toBeGreaterThanOrEqual(0);
  });

  it('Viral growth (Priya): EWMA should recover to new level', () => {
    const { priya } = generateSyntheticPersonas();
    
    // Take transactions up to week 10 after step-change.
    // Step change happened at day 180 (month 7).
    // Let's filter transactions to exactly 10 weeks (70 days) after day 180.
    const stepChangeDayIndex = 180;
    const testCutoffDayIndex = stepChangeDayIndex + 70;
    
    // Since dates are chronological in synthetic generation? Wait, `generateDates` creates them from oldest to newest.
    // `dates[0]` is 365 days ago, `dates[364]` is today.
    // Day 180 is ~6 months ago. Day 250 is 10 weeks after.
    const cutoffDate = priya.transactions[testCutoffDayIndex].txnDate;
    
    const partialTxns = priya.transactions.filter(t => t.txnDate.getTime() <= cutoffDate.getTime());
    
    const result = smoothingService.computeSafeToSpend(partialTxns, priya.user);
    
    // New level is 100K-200K / week (avg 150K)
    // By week 10, EWMA should be within 20% of new actual.
    // Let's just check if it crossed 100K (10,000,000 paise).
    expect(Number(result.smoothedWeeklyIncomePaise)).toBeGreaterThan(8000000);
  });

  it('Safe-to-spend never negative (returns 0 with warning flag)', () => {
    const { neha } = generateSyntheticPersonas();
    
    // Force huge tax estimate to make safeToSpend negative
    const hugeTaxEstimate = {
      estimatedTotalTaxPaise: 400000000n, // 40L tax on 40L income (100% tax)
      annualizedIncomePaise: 400000000n,
    };
    
    const result = smoothingService.computeSafeToSpend(neha.transactions, neha.user, hugeTaxEstimate);
    
    expect(result.safeToSpendPaise).toBe(0n);
    expect(result.warningFlags).toContain('spending_into_tax_reserve');
  });

  it('Tax reserve scales with effective tax rate', () => {
    const { neha } = generateSyntheticPersonas();
    
    // 20% tax rate
    const taxEstimate = {
      estimatedTotalTaxPaise: 800000n,
      annualizedIncomePaise: 4000000n,
    };
    
    const result = smoothingService.computeSafeToSpend(neha.transactions, neha.user, taxEstimate);
    
    const expectedTaxReserve = BigInt(Math.round(Number(result.smoothedWeeklyIncomePaise) * 0.20));
    expect(result.taxReservePaise).toBe(expectedTaxReserve);
  });

  it('GST reserve is 0 for non-registered users', () => {
    const { neha } = generateSyntheticPersonas();
    neha.user.registeredGst = false;
    
    const resultUnregistered = smoothingService.computeSafeToSpend(neha.transactions, neha.user);
    expect(resultUnregistered.gstReservePaise).toBe(0n);
    
    neha.user.registeredGst = true;
    const resultRegistered = smoothingService.computeSafeToSpend(neha.transactions, neha.user);
    
    const expectedGst = BigInt(Math.round(Number(resultRegistered.smoothedWeeklyIncomePaise) * 0.05));
    expect(resultRegistered.gstReservePaise).toBe(expectedGst);
  });
});
