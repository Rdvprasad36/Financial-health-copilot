import { PrismaClient } from '@prisma/client';
import { generateSyntheticPersonas } from '../modules/forecast/synthetic-data';
import { GstService } from '../modules/compliance/gst.service';
import { AdvanceTaxService } from '../modules/compliance/advance-tax.service';
import { SmoothingService } from '../modules/forecast/smoothing.service';
import { BusinessType, PresumptiveScheme, TaxRegime } from '@fhc/shared';

const prisma = new PrismaClient();
const gstService = new GstService();
const advanceTaxService = new AdvanceTaxService();
const smoothingService = new SmoothingService();

async function main() {
  console.log('🌱 Starting Financial Health Copilot demo database seeding...');

  // Clean existing demo data if any
  try {
    await prisma.nudge.deleteMany();
    await prisma.approvalAction.deleteMany();
    await prisma.safeToSpendSnapshot.deleteMany();
    await prisma.gstThresholdStatus.deleteMany();
    await prisma.taxEstimate.deleteMany();
    await prisma.fyRollup.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.paymentSource.deleteMany();
    await prisma.user.deleteMany();
    console.log('🧹 Cleaned existing records.');
  } catch (err) {
    console.log('⚠️ Cleanup skipped or table empty:', err);
  }

  const { neha, raj, priya } = generateSyntheticPersonas();
  const personas = [
    { data: neha, label: 'Steady Neha (Freelancer, KA)' },
    { data: raj, label: 'Spiky Raj (Instagram Reseller, MH, ~80% GST)' },
    { data: priya, label: 'Viral Priya (Creator with viral breakout, DL, >100% GST)' },
  ];

  for (const { data, label } of personas) {
    console.log(`\n👤 Seeding persona: ${label}...`);

    // 1. Create User
    const user = await prisma.user.create({
      data: {
        id: data.user.id,
        fullName: data.user.fullName,
        email: `${data.user.fullName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
        businessType: data.user.businessType,
        stateCode: data.user.stateCode,
        registeredGst: data.user.registeredGst,
        presumptiveScheme: data.user.presumptiveScheme,
        taxRegime: data.user.taxRegime,
        languagePreference: data.user.languagePreference,
        notificationChannels: ['in_app', 'email'],
        onboardingCompletedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      },
    });

    // 2. Create Payment Source
    const pSource = await prisma.paymentSource.create({
      data: {
        userId: user.id,
        provider: 'upi_csv',
        externalAccountId: `acc_${user.id.slice(0, 8)}`,
        status: 'active',
        lastSyncedAt: new Date(),
      },
    });

    // 3. Batch insert Transactions
    console.log(`   Inserting ${data.transactions.length} transactions...`);
    const txnsToInsert = data.transactions.map(t => ({
      id: t.id,
      userId: user.id,
      sourceId: pSource.id,
      providerTxnId: `txn_${t.id.slice(0, 12)}`,
      type: t.type,
      amountPaise: t.amountPaise,
      currency: t.currency,
      category: t.category || 'sales',
      counterparty: t.counterparty || 'Customer / Client',
      txnDate: t.txnDate,
    }));

    // Insert in chunks of 50
    for (let i = 0; i < txnsToInsert.length; i += 50) {
      await prisma.transaction.createMany({
        data: txnsToInsert.slice(i, i + 50),
        skipDuplicates: true,
      });
    }

    // 4. Compute Gross Turnover & Rollups
    let grossTurnover = 0n;
    let netIncome = 0n;
    let totalExpenses = 0n;

    for (const t of data.transactions) {
      if (t.type === 'income') {
        grossTurnover += t.amountPaise;
        netIncome += t.amountPaise;
      } else if (t.type === 'refund') {
        netIncome -= t.amountPaise;
      } else if (t.type === 'expense' || t.type === 'payout_fee') {
        totalExpenses += t.amountPaise;
      }
    }

    await prisma.fyRollup.create({
      data: {
        userId: user.id,
        financialYear: '2025-26',
        grossTurnoverPaise: grossTurnover,
        netIncomePaise: netIncome,
        totalExpensesPaise: totalExpenses,
        transactionCount: data.transactions.length,
      },
    });

    // 5. Compute & Save GST Threshold Status
    const gstResult = gstService.computeGstProximity(
      grossTurnover,
      user.businessType as BusinessType,
      user.stateCode,
    );

    await prisma.gstThresholdStatus.create({
      data: {
        userId: user.id,
        financialYear: '2025-26',
        rolling12mTurnoverPaise: grossTurnover,
        applicableThresholdPaise: user.businessType === 'goods_seller' ? 400000000n : 200000000n,
        proximityPct: gstResult.proximityPercentage,
        crossed: gstResult.tier === 'crossed',
        crossedAt: gstResult.tier === 'crossed' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : null,
        projectedCrossDate: gstResult.projectedCrossDate ? new Date(gstResult.projectedCrossDate) : null,
      },
    });

    // 6. Compute & Save Advance Tax Estimates
    const taxEstimate = advanceTaxService.estimateAdvanceTax(
      grossTurnover,
      user.presumptiveScheme as PresumptiveScheme,
      user.taxRegime as TaxRegime,
    );

    for (const q of taxEstimate.instalments) {
      await prisma.taxEstimate.create({
        data: {
          userId: user.id,
          financialYear: '2025-26',
          quarter: q.quarter,
          dueDate: new Date(q.dueDate),
          estimatedIncomePaise: grossTurnover,
          estimatedTaxPaise: q.amountDuePaise,
          cumulativePaidPaise: q.quarter === 'Q1' ? q.amountDuePaise : 0n,
          status: q.quarter === 'Q1' ? 'paid_marked' : q.quarter === 'Q2' ? 'due_soon' : 'upcoming',
          configVersion: taxEstimate.configVersion,
          regime: user.taxRegime,
        },
      });
    }

    // 7. Compute & Save Safe to Spend Snapshot
    const safeToSpend = smoothingService.computeSafeToSpend(data.transactions, data.user);
    await prisma.safeToSpendSnapshot.create({
      data: {
        userId: user.id,
        computedForDate: new Date(),
        smoothedIncomePaise: safeToSpend.smoothedWeeklyIncomePaise,
        taxReservePaise: safeToSpend.taxReservePaise,
        gstReservePaise: safeToSpend.gstReservePaise,
        platformFeeBufferPaise: safeToSpend.platformFeeBufferPaise,
        emergencyBufferPaise: safeToSpend.emergencyBufferPaise,
        safeToSpendPaise: safeToSpend.safeToSpendPaise,
        method: safeToSpend.method,
        warningFlags: safeToSpend.warningFlags,
      },
    });

    // 8. Seed Proactive Nudges
    if (gstResult.proximityPercentage >= 60) {
      await prisma.nudge.create({
        data: {
          userId: user.id,
          type: 'gst_proximity',
          channel: 'whatsapp',
          sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          tierKey: 'gst_proximity_80',
          actionTaken: gstResult.tier === 'crossed' ? 'registered_gst' : null,
          payload: {
            title: `GST Threshold Warning: ${(gstResult.proximityPercentage).toFixed(0)}% reached`,
            body: `You're at ₹${(Number(grossTurnover) / 10000000).toFixed(1)}L of your ₹${user.businessType === 'goods_seller' ? '40L' : '20L'} threshold. Plan registration before penalties kick in!`,
            proximityPct: gstResult.proximityPercentage,
          },
        },
      });
    }

    await prisma.nudge.create({
      data: {
        userId: user.id,
        type: 'advance_tax_due',
        channel: 'in_app',
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        tierKey: 'advance_tax_q2',
        actionTaken: 'set_aside_confirmed',
        payload: {
          title: 'Advance Tax Q2 Due Soon',
          body: `Upcoming instalment deadline: 15 Sep. Recommended set-aside: ₹${(Number(safeToSpend.taxReservePaise) / 100).toLocaleString('en-IN')}.`,
        },
      },
    });

    console.log(`   ✅ Seeded ${user.fullName}: User ID = ${user.id}`);
  }

  console.log('\n🎉 Demo seeding completed successfully!');
  console.log('You can now launch the Next.js frontend and NestJS API to begin the live demo.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
