'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPaise, formatPaiseCompact } from '@fhc/shared';
import { ShieldCheck, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';

interface SafeToSpendProps {
  safeToSpendPaise: string;
  smoothedWeeklyIncomePaise: string;
  taxReservePaise: string;
  emergencyBufferPaise: string;
  warningFlags?: string[];
  explainer?: string;
}

export function SafeToSpendCard({
  safeToSpendPaise,
  smoothedWeeklyIncomePaise,
  taxReservePaise,
  emergencyBufferPaise,
  warningFlags = [],
  explainer,
}: SafeToSpendProps) {
  const safePaise = BigInt(safeToSpendPaise || 0);
  const smoothedPaise = BigInt(smoothedWeeklyIncomePaise || 0);
  const taxPaise = BigInt(taxReservePaise || 0);
  const bufferPaise = BigInt(emergencyBufferPaise || 0);

  const isWarning = warningFlags.includes('spending_into_tax_reserve');

  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Real-time Cash Runway
            </span>
          </div>
          {isWarning ? (
            <Badge variant="danger" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Spending Into Tax Reserve
            </Badge>
          ) : (
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              Safe Baseline
            </Badge>
          )}
        </div>

        <div className="mt-4">
          <div className="text-sm font-medium text-muted-foreground">Safe to spend this week</div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
              {formatPaise(safePaise)}
            </span>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="h-3.5 w-3.5" />
              EWMA Smoothed
            </span>
          </div>
        </div>

        {/* Explainers and Breakdown */}
        {explainer && (
          <div className="mt-4 rounded-lg bg-primary/5 p-3.5 border border-primary/10 text-sm text-foreground/90 flex gap-2.5 items-start">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">{explainer}</p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2 border-t pt-4 text-center">
          <div className="rounded-md bg-muted/40 p-2">
            <div className="text-[11px] text-muted-foreground font-medium">Avg Income</div>
            <div className="text-xs sm:text-sm font-semibold mt-0.5">{formatPaiseCompact(smoothedPaise)}/wk</div>
          </div>
          <div className="rounded-md bg-muted/40 p-2">
            <div className="text-[11px] text-muted-foreground font-medium">Tax Reserve</div>
            <div className="text-xs sm:text-sm font-semibold text-amber-600 mt-0.5">
              -{formatPaiseCompact(taxPaise)}
            </div>
          </div>
          <div className="rounded-md bg-muted/40 p-2">
            <div className="text-[11px] text-muted-foreground font-medium">Safety Buffer</div>
            <div className="text-xs sm:text-sm font-semibold text-blue-600 mt-0.5">
              -{formatPaiseCompact(bufferPaise)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
