import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from './notification.service';
import { GstService } from '../compliance/gst.service';
import { SmoothingService } from '../forecast/smoothing.service';
import {
  NudgePayload,
  NudgeChannel,
  NudgeType,
  UserProfile,
  Transaction,
  BusinessType,
  PresumptiveScheme,
  TaxRegime,
} from '@fhc/shared';

@Injectable()
export class NudgeSchedulerService {
  private readonly logger = new Logger(NudgeSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private gstService: GstService,
    private smoothingService: SmoothingService,
  ) {}

  @Cron('0 6 * * *')
  async runDailyNudgeCheck() {
    this.logger.log('Starting daily nudge check...');

    const users = await this.prisma.user.findMany();

    for (const user of users) {
      try {
        await this.evaluateUserForNudges(user.id);
      } catch (error) {
        this.logger.error(`Error evaluating nudges for user ${user.id}: ${error}`);
      }
    }

    this.logger.log('Daily nudge check completed.');
  }

  async evaluateUserForNudges(userId: string) {
    const today = new Date();
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

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

    const domainTxns: Transaction[] = txns.map(t => ({
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

    // 1. Recompute GST proximity
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    let rollingTurnover = 0n;
    for (const t of domainTxns) {
      if (t.txnDate >= oneYearAgo) {
        if (t.type === 'income') rollingTurnover += t.amountPaise;
        else if (t.type === 'refund') rollingTurnover -= t.amountPaise;
      }
    }
    if (rollingTurnover < 0n) rollingTurnover = 0n;

    const gstResult = this.gstService.computeGstProximity(
      rollingTurnover,
      userProfile.businessType,
      userProfile.stateCode,
    );

    // Save GST threshold status snapshot
    await this.prisma.gstThresholdStatus.create({
      data: {
        userId,
        financialYear: '2025-26',
        rolling12mTurnoverPaise: rollingTurnover,
        applicableThresholdPaise: user.businessType === 'goods_seller' ? 400000000n : 200000000n,
        proximityPct: gstResult.proximityPercentage,
        crossed: gstResult.tier === 'crossed',
        projectedCrossDate: gstResult.projectedCrossDate ? new Date(gstResult.projectedCrossDate) : null,
      },
    });

    // 2. Recompute safe-to-spend
    const safeToSpendResult = this.smoothingService.computeSafeToSpend(domainTxns, userProfile);

    // Save safe-to-spend snapshot
    await this.prisma.safeToSpendSnapshot.create({
      data: {
        userId,
        computedForDate: today,
        smoothedIncomePaise: safeToSpendResult.smoothedWeeklyIncomePaise,
        taxReservePaise: safeToSpendResult.taxReservePaise,
        gstReservePaise: safeToSpendResult.gstReservePaise,
        platformFeeBufferPaise: safeToSpendResult.platformFeeBufferPaise,
        emergencyBufferPaise: safeToSpendResult.emergencyBufferPaise,
        safeToSpendPaise: safeToSpendResult.safeToSpendPaise,
        method: safeToSpendResult.method,
        warningFlags: safeToSpendResult.warningFlags,
      },
    });

    // 3. Evaluate trigger conditions

    // GST proximity tiers (60%, 80%, 95%, 100%)
    const pct = gstResult.proximityPercentage;
    let gstTier: number | null = null;
    if (pct >= 100) gstTier = 100;
    else if (pct >= 95) gstTier = 95;
    else if (pct >= 80) gstTier = 80;
    else if (pct >= 60) gstTier = 60;

    if (gstTier) {
      const tierKey = `gst_${gstTier}`;
      const title = `GST Threshold: ${gstTier}% Reached`;
      const body =
        gstTier >= 100
          ? 'Mandatory GST registration alert: your 12-month turnover has crossed the statutory threshold.'
          : `You're at ${gstResult.proximityPercentage.toFixed(0)}% of your GST registration limit. Plan ahead to register before penalty.`;

      if (await this.canSendNudge(userId, tierKey)) {
        await this.dispatchNudge(userId, 'gst_proximity', title, body, { tier: gstTier, pct }, ['in_app'], tierKey);
      }
    }

    // Advance tax due dates (14 days and 3 days before standard deadlines: 15 Jun, 15 Sep, 15 Dec, 15 Mar)
    const currentYear = today.getFullYear();
    const advanceTaxDates = [
      new Date(currentYear, 5, 15),
      new Date(currentYear, 8, 15),
      new Date(currentYear, 11, 15),
      new Date(currentYear + 1, 2, 15),
    ];

    for (const dueDate of advanceTaxDates) {
      const daysUntil = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil === 14 || daysUntil === 3) {
        const tierKey = `adv_tax_${dueDate.toISOString().slice(0, 10)}_${daysUntil}d`;
        const title = `Advance Tax Due in ${daysUntil} Days`;
        const body = `Quarterly advance tax deadline is on ${dueDate.toLocaleDateString('en-IN')}. Set aside funds now to avoid interest penalty.`;

        if (await this.canSendNudge(userId, tierKey)) {
          await this.dispatchNudge(userId, 'advance_tax_due', title, body, { daysUntil, dueDate }, ['in_app'], tierKey);
        }
      }
    }

    // Emergency buffer low warning
    if (safeToSpendResult.warningFlags.includes('spending_into_tax_reserve')) {
      const tierKey = 'spending_into_tax_reserve';
      const title = 'High Spending Warning';
      const body = 'Your current spending exceeds safe baseline and may dig into your tax reserve.';
      if (await this.canSendNudge(userId, tierKey)) {
        await this.dispatchNudge(userId, 'low_buffer_warning', title, body, {}, ['in_app'], tierKey);
      }
    }
  }

  private async canSendNudge(userId: string, tierKey: string): Promise<boolean> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentNudge = await this.prisma.nudge.findFirst({
      where: {
        userId,
        tierKey,
        sentAt: { gte: sevenDaysAgo },
      },
    });
    return !recentNudge;
  }

  private async dispatchNudge(
    userId: string,
    type: NudgeType,
    title: string,
    body: string,
    data: any,
    channels: NudgeChannel[],
    tierKey: string
  ) {
    const payload: NudgePayload = {
      type,
      title,
      body,
      data: { ...data, tierKey },
      channel: channels[0],
    };

    await this.notificationService.dispatch(userId, payload, channels);
  }
}
