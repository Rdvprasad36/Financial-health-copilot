'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const acknowledged = localStorage.getItem('fhc_disclaimer_ack');
    if (!acknowledged) {
      setOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('fhc_disclaimer_ack', 'true');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-background rounded-xl border p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-amber-500/15 p-2 text-amber-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Compliance & Legal Disclaimer</h3>
            <p className="text-xs text-muted-foreground">Please review before proceeding</p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-2 leading-relaxed bg-muted/30 p-3 rounded-lg border">
          <p>
            <strong>Financial Health Copilot</strong> provides algorithmic estimates and educational
            insights based strictly on income routed through your connected accounts.
          </p>
          <p>
            This service does <strong>not</strong> constitute legal, tax, or accounting advice. Statutory
            GST compliance applies to your PAN aggregate turnover across all channels.
          </p>
          <p>
            Always confirm with a certified Chartered Accountant (CA) before paying advance tax or
            submitting statutory returns.
          </p>
        </div>

        <Button onClick={handleDismiss} className="w-full text-xs h-9">
          I Understand & Agree
        </Button>
      </div>
    </div>
  );
}
