'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { postSimulate, DEMO_USER_ID } from '@/lib/api';
import { formatPaiseCompact } from '@fhc/shared';
import { Calculator, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

export function SimulatorForm() {
  const [extraRupees, setExtraRupees] = useState('300000'); // ₹3 Lakhs default
  const [months, setMonths] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSimulate = async () => {
    const rupees = parseFloat(extraRupees) || 0;
    const extraPaise = Math.round(rupees * 100);

    setLoading(true);
    try {
      const data = await postSimulate({
        userId: DEMO_USER_ID,
        extraIncomePaise: extraPaise,
        months,
      });
      setResult(data);
    } catch {
      // Handled in api client
    } finally {
      setLoading(false);
    }
  };

  // Run on first load
  React.useEffect(() => {
    handleSimulate();
  }, []);

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Hypothetical Order / Revenue Simulator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Expected Extra Inflow (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-muted-foreground">₹</span>
                <Input
                  type="number"
                  value={extraRupees}
                  onChange={(e) => setExtraRupees(e.target.value)}
                  className="pl-7 text-sm"
                  placeholder="e.g. 300000"
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[100000, 300000, 500000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setExtraRupees(amt.toString())}
                    className="text-[11px] bg-muted hover:bg-muted/80 text-muted-foreground px-2 py-0.5 rounded transition-colors"
                  >
                    +₹{(amt / 100000).toFixed(0)}L
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Over Timeline
              </label>
              <div className="flex gap-2">
                {[1, 2, 3].map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant={months === m ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMonths(m)}
                    className="flex-1 text-xs"
                  >
                    {m} Month{m > 1 ? 's' : ''}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={handleSimulate}
            disabled={loading}
            className="w-full text-xs h-9 gap-2 mt-2"
          >
            {loading ? (
              <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
            ) : (
              <>
                <span>Calculate Compliance & Tax Impact</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Current State */}
            <Card className="bg-muted/30 border shadow-none">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Current Trajectory</span>
                  <Badge variant="secondary" className="text-[11px]">
                    {result.current.proximityPct.toFixed(1)}% GST Proximity
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-foreground">
                    {formatPaiseCompact(BigInt(result.current.turnoverPaise))}
                  </div>
                  <Progress value={result.current.proximityPct} className="h-2" />
                </div>
                <div className="text-xs text-muted-foreground">
                  Cross date: <strong>{result.current.projectedCrossDate || 'Not crossed'}</strong>
                </div>
              </CardContent>
            </Card>

            {/* Projected State */}
            <Card className="border-primary/40 bg-primary/5 shadow-none">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-primary uppercase">With Extra ₹{(parseFloat(extraRupees) / 100000).toFixed(1)}L</span>
                  <Badge
                    variant={result.projected.proximityPct >= 95 ? 'danger' : 'warning'}
                    className="text-[11px]"
                  >
                    {result.projected.proximityPct.toFixed(1)}% GST Proximity
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-foreground">
                    {formatPaiseCompact(BigInt(result.projected.turnoverPaise))}
                  </div>
                  <Progress
                    value={result.projected.proximityPct}
                    indicatorColor={result.projected.proximityPct >= 95 ? 'bg-rose-500' : 'bg-amber-500'}
                    className="h-2"
                  />
                </div>
                <div className="text-xs text-foreground font-medium flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>
                    New cross deadline: <strong>{result.projected.projectedCrossDate}</strong>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Insights */}
          <Card className="border shadow-sm">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                <span>Copilot What-If Insights</span>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {result.insights.map((insight: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
