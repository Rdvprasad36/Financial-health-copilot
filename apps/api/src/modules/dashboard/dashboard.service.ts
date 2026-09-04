import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SmoothingService } from '../forecast/smoothing.service';
import { AdvanceTaxService } from '../compliance/advance-tax.service';
import { ExplainerService } from '../ai/explainer.service';
import { UserProfile, Transaction, PresumptiveScheme, TaxRegime, BusinessType } from '@fhc/shared';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly smoothingService: SmoothingService,
    private readonly advanceTaxService: AdvanceTaxService,
    private readonly explainerService: ExplainerService,
  ) {}

  async getSafeToSpend(userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Try finding latest snapshot
    const latestSnapshot = await this.prisma.safeToSpendSnapshot.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Also fetch transactions for weekly chart
    const txns = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { txnDate: 'asc' },
    });

    const userProfile: UserProfile = {
      id: user.id,
      fullName: user.fullName,
      businessType: user.businessType as BusinessType,
      stateCode: user.stateCode,
      registeredGst: user.registeredGst,
      presumptiveScheme: user.presumptiveScheme as PresumptiveScheme,
      taxRegime: user.taxRegime as TaxRegime,
      languagePreference: (user.languagePreference as 'en' | 'hinglish') || 'en',
    };

    const domainTxns: Transaction[] = txns.map((t: any) => ({
      id: t.id,
      userId: t.userId,
      sourceId: t.sourceId || '',
      type: t.type as any,
      amountPaise: t.amountPaise,
      currency: t.currency,
      category: t.category || undefined,
      counterparty: t.counterparty || undefined,
      txnDate: t.txnDate,
    }));

    // Compute fresh safe to spend
    const safeToSpend = this.smoothingService.computeSafeToSpend(domainTxns, userProfile);

    // Group transactions by week for the chart
    const chartWeeks: { week: string; rawIncomePaise: string; smoothedIncomePaise: string }[] = [];
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const now = new Date();
    for (let w = 15; w >= 0; w--) {
      const weekStart = new Date(now.getTime() - (w + 1) * msPerWeek);
      const weekEnd = new Date(now.getTime() - w * msPerWeek);
      const weekIncome = domainTxns
        .filter(t => t.txnDate >= weekStart && t.txnDate < weekEnd && t.type === 'income')
        .reduce((sum, t) => sum + t.amountPaise, 0n);

      chartWeeks.push({
        week: `Wk ${16 - w}`,
        rawIncomePaise: weekIncome.toString(),
        smoothedIncomePaise: safeToSpend.smoothedWeeklyIncomePaise.toString(),
      });
    }

    // Explainer text fallback or AI call
    let explainerText = `Safe to spend is calculated from your 16-week average income, with reserves set aside for advance tax and emergency buffer.`;
    try {
      explainerText = await this.explainerService.generateExplanation({
        safeToSpend,
        gstStatus: {
          rolling12mTurnoverPaise: safeToSpend.smoothedWeeklyIncomePaise * 52n,
          applicableThresholdPaise: user.businessType === 'goods_seller' ? 400000000n : 200000000n,
          proximityPct: 0.65,
          projectedCrossDate: null,
          crossed: false,
          tier: 'watch',
          caveats: ['Based on connected accounts only'],
        },
        taxEstimate: {
          financialYear: '2025-26',
          assessmentYear: '2026-27',
          configVersion: '2025-26-v1',
          regime: user.taxRegime as TaxRegime,
          presumptiveScheme: user.presumptiveScheme as PresumptiveScheme,
          annualizedIncomePaise: safeToSpend.smoothedWeeklyIncomePaise * 52n,
          estimatedTotalTaxPaise: safeToSpend.taxReservePaise * 52n,
          advanceTaxApplicable: true,
          quarterlyBreakdown: [],
          disclaimer: 'Estimate only',
        },
        userName: user.fullName,
        languagePreference: userProfile.languagePreference,
      });
    } catch {
      // Keep default
    }

    return {
      safeToSpendPaise: safeToSpend.safeToSpendPaise.toString(),
      smoothedWeeklyIncomePaise: safeToSpend.smoothedWeeklyIncomePaise.toString(),
      taxReservePaise: safeToSpend.taxReservePaise.toString(),
      gstReservePaise: safeToSpend.gstReservePaise.toString(),
      emergencyBufferPaise: safeToSpend.emergencyBufferPaise.toString(),
      platformFeeBufferPaise: safeToSpend.platformFeeBufferPaise.toString(),
      warningFlags: safeToSpend.warningFlags,
      explainer: explainerText,
      weeklyChart: chartWeeks,
    };
  }
}
