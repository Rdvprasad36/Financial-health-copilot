import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GstService } from '../compliance/gst.service';
import { AdvanceTaxService } from '../compliance/advance-tax.service';
import { BusinessType, TaxRegime, PresumptiveScheme } from '@fhc/shared';

@Injectable()
export class SimulateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gstService: GstService,
    private readonly advanceTaxService: AdvanceTaxService,
  ) {}

  async simulate(params: { userId: string; extraIncomePaise: number | string; months?: number }) {
    const { userId } = params;
    const months = params.months || 1;
    const extraIncomePaise = BigInt(params.extraIncomePaise || 0);

    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Get current 12m turnover
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const txns = await this.prisma.transaction.findMany({
      where: {
        userId,
        txnDate: { gte: oneYearAgo },
      },
    });

    let current12mTurnover = 0n;
    for (const t of txns) {
      if (t.type === 'income') current12mTurnover += t.amountPaise;
      else if (t.type === 'refund') current12mTurnover -= t.amountPaise;
    }
    if (current12mTurnover < 0n) current12mTurnover = 0n;

    // Projected turnover with the extra income
    const projected12mTurnover = current12mTurnover + extraIncomePaise;

    // Current GST status
    const currentGst = this.gstService.computeGstProximity(
      current12mTurnover,
      user.businessType as BusinessType,
      user.stateCode,
    );

    // Projected GST status
    const projectedGst = this.gstService.computeGstProximity(
      projected12mTurnover,
      user.businessType as BusinessType,
      user.stateCode,
    );

    // Annualized income for tax estimation
    const currentTaxEstimate = this.advanceTaxService.estimateAdvanceTax(
      current12mTurnover,
      user.presumptiveScheme as PresumptiveScheme,
      user.taxRegime as TaxRegime,
    );

    const projectedTaxEstimate = this.advanceTaxService.estimateAdvanceTax(
      projected12mTurnover,
      user.presumptiveScheme as PresumptiveScheme,
      user.taxRegime as TaxRegime,
    );

    const incrementalTaxPaise =
      projectedTaxEstimate.totalTaxPaise > currentTaxEstimate.totalTaxPaise
        ? projectedTaxEstimate.totalTaxPaise - currentTaxEstimate.totalTaxPaise
        : 0n;

    return {
      current: {
        turnoverPaise: current12mTurnover.toString(),
        proximityPct: currentGst.proximityPercentage,
        tier: currentGst.tier,
        projectedCrossDate: currentGst.projectedCrossDate,
        totalTaxPaise: currentTaxEstimate.totalTaxPaise.toString(),
      },
      projected: {
        turnoverPaise: projected12mTurnover.toString(),
        proximityPct: projectedGst.proximityPercentage,
        tier: projectedGst.tier,
        projectedCrossDate: projectedGst.projectedCrossDate,
        totalTaxPaise: projectedTaxEstimate.totalTaxPaise.toString(),
        incrementalTaxPaise: incrementalTaxPaise.toString(),
      },
      insights: [
        projectedGst.tier === 'crossed'
          ? 'Adding this income will immediately cross your GST threshold. GST registration will become mandatory.'
          : projectedGst.proximityPercentage >= 80
          ? `You will reach ${projectedGst.proximityPercentage.toFixed(1)}% of your GST limit. Start preparing your documents.`
          : 'You remain comfortably under your GST threshold.',
        incrementalTaxPaise > 0n
          ? `Estimated additional tax set-aside needed: ₹${(Number(incrementalTaxPaise) / 100).toLocaleString('en-IN')}.`
          : 'No additional tax liability triggered under current regime rebate.',
      ],
    };
  }
}
