const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Fallback demo user ID (Neha / Raj / Priya)
export const DEMO_USER_ID = 'steady-neha-demo-id';

export async function fetchSafeToSpend(userId: string) {
  try {
    const res = await fetch(`${BASE_URL}/dashboard/safe-to-spend?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    // Graceful fallback for offline / mock preview
    return {
      safeToSpendPaise: '3250000', // ₹32,500
      smoothedWeeklyIncomePaise: '4200000', // ₹42,000
      taxReservePaise: '420000', // ₹4,200
      gstReservePaise: '0',
      emergencyBufferPaise: '450000',
      platformFeeBufferPaise: '80000',
      warningFlags: [],
      explainer:
        "Based on your trailing 16 weeks, you're averaging ₹42,000/week. After setting aside ₹4,200 for advance tax and building your emergency buffer, you have ₹32,500 safely spendable this week.",
      weeklyChart: [
        { week: 'Wk 1', rawIncomePaise: '3500000', smoothedIncomePaise: '3800000' },
        { week: 'Wk 2', rawIncomePaise: '4200000', smoothedIncomePaise: '3900000' },
        { week: 'Wk 3', rawIncomePaise: '3900000', smoothedIncomePaise: '3900000' },
        { week: 'Wk 4', rawIncomePaise: '4800000', smoothedIncomePaise: '4100000' },
        { week: 'Wk 5', rawIncomePaise: '4500000', smoothedIncomePaise: '4200000' },
        { week: 'Wk 6', rawIncomePaise: '4200000', smoothedIncomePaise: '4200000' },
      ],
    };
  }
}

export async function fetchGstStatus(userId: string) {
  try {
    const res = await fetch(`${BASE_URL}/compliance/gst-status?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return {
      rolling12mTurnoverPaise: '164000000', // ₹16.4L
      applicableThresholdPaise: '200000000', // ₹20L
      proximityPct: 82,
      crossed: false,
      tier: 'warning',
      projectedCrossDate: '2026-11-20',
      caveats: [
        'Based on connected accounts only — all-India turnover under same PAN counts for actual compliance.',
      ],
    };
  }
}

export async function fetchTaxEstimate(userId: string) {
  try {
    const res = await fetch(`${BASE_URL}/compliance/tax-estimate?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return {
      annualizedIncomePaise: '218400000',
      estimatedTotalTaxPaise: '12480000',
      advanceTaxApplicable: true,
      quarterlyBreakdown: [
        { quarter: 'Q1', dueDate: '2026-06-15', cumulativePct: 0.15, cumulativeTaxPaise: '1872000' },
        { quarter: 'Q2', dueDate: '2026-09-15', cumulativePct: 0.45, cumulativeTaxPaise: '5616000' },
        { quarter: 'Q3', dueDate: '2026-12-15', cumulativePct: 0.75, cumulativeTaxPaise: '9360000' },
        { quarter: 'Q4', dueDate: '2027-03-15', cumulativePct: 1.0, cumulativeTaxPaise: '12480000' },
      ],
      disclaimer: 'Estimate only — not a substitute for a CA or ITR filing. Confirm before paying.',
    };
  }
}

export async function fetchNudges(userId: string) {
  try {
    const res = await fetch(`${BASE_URL}/nudges?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return [
      {
        id: 'nudge-1',
        type: 'gst_proximity',
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        payload: {
          title: 'GST Threshold Warning: 82% reached',
          body: "You're at ₹16.4L of your ₹20L GST threshold. At current growth, registration is expected in ~10 weeks.",
        },
        actionTaken: null,
      },
      {
        id: 'nudge-2',
        type: 'advance_tax_due',
        sentAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        payload: {
          title: 'Advance Tax Q2 Due Soon',
          body: 'Quarterly advance tax deadline is approaching. Ensure ₹4,200 is set aside this week.',
        },
        actionTaken: 'set_aside_confirmed',
      },
    ];
  }
}

export async function ackNudge(id: string, actionTaken: string) {
  return fetch(`${BASE_URL}/nudges/${id}/ack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionTaken }),
  }).then(r => r.json());
}

export async function postSimulate(params: { userId: string; extraIncomePaise: number; months: number }) {
  try {
    const res = await fetch(`${BASE_URL}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to simulate');
    return await res.json();
  } catch {
    const extraPaise = BigInt(params.extraIncomePaise || 0);
    const newTurnover = 164000000n + extraPaise;
    const proximity = Math.min(100, Math.round((Number(newTurnover) / 200000000) * 100));
    return {
      current: {
        turnoverPaise: '164000000',
        proximityPct: 82,
        tier: 'warning',
        projectedCrossDate: '2026-11-20',
        totalTaxPaise: '12480000',
      },
      projected: {
        turnoverPaise: newTurnover.toString(),
        proximityPct: proximity,
        tier: proximity >= 100 ? 'crossed' : proximity >= 95 ? 'critical' : 'warning',
        projectedCrossDate: proximity >= 100 ? 'Crossed Immediately' : '2026-10-15',
        totalTaxPaise: '14200000',
        incrementalTaxPaise: '1720000',
      },
      insights: [
        proximity >= 100
          ? 'Adding this income pushes you immediately past the ₹20L GST threshold.'
          : `You will reach ${proximity}% of your GST limit with this extra order.`,
        'Recommended tax set-aside on this extra order: 10% (₹' + (Number(extraPaise) * 0.1 / 100).toLocaleString('en-IN') + ').',
      ],
    };
  }
}

export async function postAsk(userId: string, question: string) {
  try {
    const res = await fetch(`${BASE_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, question }),
    });
    if (!res.ok) throw new Error('Failed to ask');
    return await res.json();
  } catch {
    return {
      answer:
        "Based on your recent 16-week trend, your income had a dip 2 weeks ago due to client delays, but your 4-week moving average remains healthy at ₹38,500/week. We recommend maintaining a ₹4,200 weekly tax reserve. This is an estimate to help you plan — please confirm with a CA before filing.",
    };
  }
}

export async function confirmGstRegistration(userId: string) {
  return fetch(`${BASE_URL}/actions/confirm-gst-registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  }).then(r => r.json());
}
