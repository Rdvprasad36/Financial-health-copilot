import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GstService } from './gst.service';
import { AdvanceTaxService } from './advance-tax.service';
import { BusinessType, TaxRegime, PresumptiveScheme } from '@fhc/shared';

@Controller('compliance')
export class ComplianceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gstService: GstService,
    private readonly advanceTaxService: AdvanceTaxService,
  ) {}

  @Get('gst-status')
  async getGstStatus(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    // Check if we have pre-computed status in DB
    const dbStatus = await this.prisma.gstThresholdStatus.findFirst({
      where: { userId },
      orderBy: { computedAt: 'desc' },
    });

    if (dbStatus) {
      return {
        rolling12mTurnoverPaise: dbStatus.rolling12mTurnoverPaise.toString(),
        applicableThresholdPaise: dbStatus.applicableThresholdPaise.toString(),
        proximityPct: dbStatus.proximityPct,
        crossed: dbStatus.crossed,
        projectedCrossDate: dbStatus.projectedCrossDate ? dbStatus.projectedCrossDate.toISOString().split('T')[0] : null,
      };
    }

    // Otherwise compute on-the-fly from transactions & user profile
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const txns = await this.prisma.transaction.findMany({
      where: {
        userId,
        txnDate: { gte: oneYearAgo },
      },
    });

    let rollingTurnover = 0n;
    for (const t of txns) {
      if (t.type === 'income') rollingTurnover += t.amountPaise;
      else if (t.type === 'refund') rollingTurnover -= t.amountPaise;
    }
    if (rollingTurnover < 0n) rollingTurnover = 0n;

    const result = this.gstService.computeGstProximity(
      rollingTurnover,
      user.businessType as BusinessType,
      user.stateCode,
    );

    return {
      rolling12mTurnoverPaise: rollingTurnover.toString(),
      applicableThresholdPaise: (user.businessType === 'goods_seller' ? 400000000n : 200000000n).toString(),
      proximityPct: result.proximityPercentage,
      crossed: result.tier === 'crossed',
      tier: result.tier,
      projectedCrossDate: result.projectedCrossDate,
      caveats: result.caveats,
    };
  }

  @Get('tax-estimate')
  async getTaxEstimate(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const dbEstimates = await this.prisma.taxEstimate.findMany({
      where: { userId },
      orderBy: { dueDate: 'asc' },
    });

    if (dbEstimates.length > 0) {
      return dbEstimates.map(e => ({
        quarter: e.quarter,
        dueDate: e.dueDate.toISOString().split('T')[0],
        estimatedIncomePaise: e.estimatedIncomePaise.toString(),
        estimatedTaxPaise: e.estimatedTaxPaise.toString(),
        cumulativePaidPaise: e.cumulativePaidPaise.toString(),
        status: e.status,
      }));
    }

    // Compute live
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const txns = await this.prisma.transaction.findMany({
      where: {
        userId,
        txnDate: { gte: oneYearAgo },
      },
    });

    let annualized = 0n;
    for (const t of txns) {
      if (t.type === 'income') annualized += t.amountPaise;
      else if (t.type === 'refund') annualized -= t.amountPaise;
    }
    if (annualized < 0n) annualized = 0n;

    const estimate = this.advanceTaxService.estimateAdvanceTax(
      annualized,
      user.presumptiveScheme as PresumptiveScheme,
      user.taxRegime as TaxRegime,
    );

    return {
      annualizedIncomePaise: estimate.taxableIncomePaise.toString(),
      estimatedTotalTaxPaise: estimate.totalTaxPaise.toString(),
      advanceTaxApplicable: estimate.isApplicable,
      quarterlyBreakdown: estimate.instalments.map(q => ({
        quarter: q.quarter,
        dueDate: q.dueDate,
        cumulativePct: q.cumulativePct,
        cumulativeTaxPaise: q.amountDuePaise.toString(),
        incrementalTaxPaise: '0', // Adjust if you have incremental calculation
      })),
      disclaimer: estimate.disclaimer,
    };
  }
}
