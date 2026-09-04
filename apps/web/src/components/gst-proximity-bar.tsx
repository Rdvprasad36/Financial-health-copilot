'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatPaiseCompact } from '@fhc/shared';
import { AlertCircle, Calendar, Info } from 'lucide-react';

interface GstProximityProps {
  rolling12mTurnoverPaise: string;
  applicableThresholdPaise: string;
  proximityPct: number;
  tier?: 'safe' | 'watch' | 'warning' | 'critical' | 'crossed';
  projectedCrossDate?: string | null;
  caveats?: string[];
}

export function GstProximityBar({
  rolling12mTurnoverPaise,
  applicableThresholdPaise,
  proximityPct,
  tier = 'safe',
  projectedCrossDate,
  caveats = [],
}: GstProximityProps) {
  const currentPaise = BigInt(rolling12mTurnoverPaise || 0);
  const limitPaise = BigInt(applicableThresholdPaise || 200000000);

  const getTierBadge = () => {
    switch (tier) {
      case 'crossed':
        return <Badge variant="danger">100%+ Crossed</Badge>;
      case 'critical':
        return <Badge variant="danger">95%+ Critical</Badge>;
      case 'warning':
        return <Badge variant="warning">80%+ Warning</Badge>;
      case 'watch':
        return <Badge variant="secondary">60%+ Watch</Badge>;
      default:
        return <Badge variant="success">Safe (&lt;60%)</Badge>;
    }
  };

  const getIndicatorColor = () => {
    if (proximityPct >= 95) return 'bg-rose-500';
    if (proximityPct >= 80) return 'bg-amber-500';
    if (proximityPct >= 60) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">GST Registration Proximity</CardTitle>
          {getTierBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1.5 font-medium">
            <span className="text-foreground">
              {formatPaiseCompact(currentPaise)} / {formatPaiseCompact(limitPaise)}
            </span>
            <span className="font-bold text-foreground">{proximityPct.toFixed(1)}%</span>
          </div>
          <Progress value={proximityPct} indicatorColor={getIndicatorColor()} className="h-3" />
        </div>

        {projectedCrossDate && tier !== 'crossed' ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-md border">
            <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>
              Projected registration deadline:{' '}
              <strong className="text-foreground">{projectedCrossDate}</strong> (~
              {Math.max(1, Math.round((new Date(projectedCrossDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7)))}{' '}
              weeks away)
            </span>
          </div>
        ) : tier === 'crossed' ? (
          <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2.5 rounded-md border border-rose-500/20">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Threshold breached! Apply for GSTIN within 30 days to avoid Section 122 penalty.</span>
          </div>
        ) : null}

        <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground pt-1">
          <Info className="h-3 w-3 shrink-0 mt-0.5" />
          <span>
            {caveats[0] ||
              'Based on connected accounts only. Aggregate turnover under same PAN applies across all channels.'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
