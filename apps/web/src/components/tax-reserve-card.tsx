'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPaise, formatPaiseCompact } from '@fhc/shared';
import { Clock, Landmark, CheckCircle2 } from 'lucide-react';

interface TaxReserveProps {
  taxReservePaise: string;
  nextDueDate?: string;
  amountDuePaise?: string;
  scheme?: string;
  onConfirmSetAside?: () => void;
}

export function TaxReserveCard({
  taxReservePaise,
  nextDueDate = '15 Sep 2026',
  amountDuePaise = '1250000',
  scheme = 'Sec 44ADA (50% deemed)',
  onConfirmSetAside,
}: TaxReserveProps) {
  const [confirmed, setConfirmed] = React.useState(false);
  const reservePaise = BigInt(taxReservePaise || 0);
  const duePaise = BigInt(amountDuePaise || 0);

  const handleConfirm = () => {
    setConfirmed(true);
    if (onConfirmSetAside) onConfirmSetAside();
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" />
            Advance Tax Reserve
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {scheme}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-medium">Recommended Reserve</div>
            <div className="text-2xl font-bold text-foreground mt-0.5">{formatPaise(reservePaise)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground font-medium">Next Due Amount</div>
            <div className="text-lg font-semibold text-amber-600 mt-0.5">{formatPaiseCompact(duePaise)}</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/40 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Next deadline:</span>
          </div>
          <span className="font-semibold text-foreground">{nextDueDate}</span>
        </div>

        <Button
          onClick={handleConfirm}
          disabled={confirmed}
          variant={confirmed ? 'secondary' : 'default'}
          className="w-full text-xs h-9 gap-1.5"
        >
          {confirmed ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Reserved for Advance Tax
            </>
          ) : (
            'Mark ₹' + formatPaiseCompact(reservePaise).replace('₹', '') + ' as Set Aside'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
