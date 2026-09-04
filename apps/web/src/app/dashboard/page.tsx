'use client';

import React, { useState, useEffect } from 'react';
import { SafeToSpendCard } from '@/components/safe-to-spend-card';
import { GstProximityBar } from '@/components/gst-proximity-bar';
import { TaxReserveCard } from '@/components/tax-reserve-card';
import { IncomeChart } from '@/components/income-chart';
import { AskCopilot } from '@/components/ask-copilot';
import { fetchSafeToSpend, fetchGstStatus, fetchTaxEstimate, DEMO_USER_ID } from '@/lib/api';
import { Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [userId, setUserId] = useState(DEMO_USER_ID);
  const [selectedPersona, setSelectedPersona] = useState<'neha' | 'raj' | 'priya'>('neha');
  const [loading, setLoading] = useState(true);

  const [safeToSpendData, setSafeToSpendData] = useState<any>(null);
  const [gstData, setGstData] = useState<any>(null);
  const [taxData, setTaxData] = useState<any>(null);

  const loadDashboard = async (targetPersona: 'neha' | 'raj' | 'priya') => {
    setLoading(true);
    try {
      // For demo personas, adjust initial figures
      if (targetPersona === 'raj') {
        // Spiky Raj: high lumpy turnover near 80% GST
        setSafeToSpendData({
          safeToSpendPaise: '5500000',
          smoothedWeeklyIncomePaise: '7500000',
          taxReservePaise: '600000',
          gstReservePaise: '0',
          emergencyBufferPaise: '1200000',
          platformFeeBufferPaise: '200000',
          warningFlags: [],
          explainer:
            'Lumpy income detected: ₹0 for past 2 weeks followed by a ₹1.8L spike. Your smoothed baseline protects you against revenue droughts by holding an expanded emergency buffer of ₹12,000.',
          weeklyChart: [
            { week: 'Wk 1', rawIncomePaise: '0', smoothedIncomePaise: '6000000' },
            { week: 'Wk 2', rawIncomePaise: '0', smoothedIncomePaise: '4500000' },
            { week: 'Wk 3', rawIncomePaise: '18000000', smoothedIncomePaise: '7875000' },
            { week: 'Wk 4', rawIncomePaise: '0', smoothedIncomePaise: '5900000' },
            { week: 'Wk 5', rawIncomePaise: '16000000', smoothedIncomePaise: '8400000' },
            { week: 'Wk 6', rawIncomePaise: '0', smoothedIncomePaise: '6300000' },
          ],
        });
        setGstData({
          rolling12mTurnoverPaise: '320000000', // ₹32L of ₹40L goods
          applicableThresholdPaise: '400000000',
          proximityPct: 80,
          tier: 'warning',
          projectedCrossDate: '2026-11-15',
          caveats: ['Based on connected accounts only. ₹40L goods seller threshold applies in Maharashtra.'],
        });
        setTaxData({
          annualizedIncomePaise: '320000000',
          estimatedTotalTaxPaise: '1850000',
          advanceTaxApplicable: true,
          quarterlyBreakdown: [],
        });
      } else if (targetPersona === 'priya') {
        // Viral Priya: went viral, crossed 100% threshold
        setSafeToSpendData({
          safeToSpendPaise: '11500000',
          smoothedWeeklyIncomePaise: '16500000',
          taxReservePaise: '2800000',
          gstReservePaise: '825000',
          emergencyBufferPaise: '1000000',
          platformFeeBufferPaise: '375000',
          warningFlags: ['gst_registration_required'],
          explainer:
            'Viral breakout month! Weekly net revenue surged from ₹20K to ₹1.65L. Notice your GST reserve has been automatically activated (₹8,250/wk set aside) because your 12-month turnover crossed ₹20L.',
          weeklyChart: [
            { week: 'Wk 1', rawIncomePaise: '2200000', smoothedIncomePaise: '2500000' },
            { week: 'Wk 2', rawIncomePaise: '2400000', smoothedIncomePaise: '2500000' },
            { week: 'Wk 3', rawIncomePaise: '14000000', smoothedIncomePaise: '5375000' },
            { week: 'Wk 4', rawIncomePaise: '18000000', smoothedIncomePaise: '8531250' },
            { week: 'Wk 5', rawIncomePaise: '17000000', smoothedIncomePaise: '10648437' },
            { week: 'Wk 6', rawIncomePaise: '16500000', smoothedIncomePaise: '12111328' },
          ],
        });
        setGstData({
          rolling12mTurnoverPaise: '235000000', // ₹23.5L of ₹20L services
          applicableThresholdPaise: '200000000',
          proximityPct: 117.5,
          tier: 'crossed',
          projectedCrossDate: null,
          caveats: ['Compulsory GST registration applies. Section 122 penalties apply if not registered within 30 days.'],
        });
        setTaxData({
          annualizedIncomePaise: '235000000',
          estimatedTotalTaxPaise: '14500000',
          advanceTaxApplicable: true,
          quarterlyBreakdown: [],
        });
      } else {
        // Steady Neha
        const [sRes, gRes, tRes] = await Promise.all([
          fetchSafeToSpend(userId),
          fetchGstStatus(userId),
          fetchTaxEstimate(userId),
        ]);
        setSafeToSpendData(sRes);
        setGstData(gRes);
        setTaxData(tRes);
      }
    } catch {
      // Fallback in API helper
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(selectedPersona);
  }, [selectedPersona]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Demo Switcher Bar for Hackathon Walkthrough */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Users className="h-4 w-4 text-primary" />
          <span>Demo Persona Switcher:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant={selectedPersona === 'neha' ? 'default' : 'outline'}
            className="text-xs h-7 px-2.5"
            onClick={() => setSelectedPersona('neha')}
          >
            Steady Neha (Freelancer)
          </Button>
          <Button
            size="sm"
            variant={selectedPersona === 'raj' ? 'default' : 'outline'}
            className="text-xs h-7 px-2.5"
            onClick={() => setSelectedPersona('raj')}
          >
            Spiky Raj (80% GST Alert)
          </Button>
          <Button
            size="sm"
            variant={selectedPersona === 'priya' ? 'default' : 'outline'}
            className="text-xs h-7 px-2.5"
            onClick={() => setSelectedPersona('priya')}
          >
            Viral Priya (&gt;100% Crossed)
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => loadDashboard(selectedPersona)}
            title="Refresh Live Metrics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Hero: Safe to Spend Card */}
      {safeToSpendData && (
        <SafeToSpendCard
          safeToSpendPaise={safeToSpendData.safeToSpendPaise}
          smoothedWeeklyIncomePaise={safeToSpendData.smoothedWeeklyIncomePaise}
          taxReservePaise={safeToSpendData.taxReservePaise}
          emergencyBufferPaise={safeToSpendData.emergencyBufferPaise}
          warningFlags={safeToSpendData.warningFlags}
          explainer={safeToSpendData.explainer}
        />
      )}

      {/* Secondary Row: GST Proximity Bar + Tax Reserve Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gstData && (
          <GstProximityBar
            rolling12mTurnoverPaise={gstData.rolling12mTurnoverPaise}
            applicableThresholdPaise={gstData.applicableThresholdPaise}
            proximityPct={gstData.proximityPct}
            tier={gstData.tier}
            projectedCrossDate={gstData.projectedCrossDate}
            caveats={gstData.caveats}
          />
        )}

        {safeToSpendData && (
          <TaxReserveCard
            taxReservePaise={safeToSpendData.taxReservePaise}
            nextDueDate="15 Sep 2026"
            amountDuePaise={safeToSpendData.taxReservePaise}
            scheme={
              selectedPersona === 'raj'
                ? 'Sec 44AD (6% digital profit)'
                : 'Sec 44ADA (50% deemed profit)'
            }
          />
        )}
      </div>

      {/* Weekly Income & Smoothing Chart */}
      {safeToSpendData?.weeklyChart && (
        <IncomeChart data={safeToSpendData.weeklyChart} />
      )}

      {/* AI Free-text Q&A Copilot */}
      <AskCopilot />
    </div>
  );
}
