'use client';

import React from 'react';
import { SimulatorForm } from '@/components/simulator-form';

export default function SimulatePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Compliance & Runway Simulator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Model hypothetical orders, bulk invoices, or seasonal sales spikes to see exactly when
          you'll cross statutory GST thresholds and what advance tax to reserve.
        </p>
      </div>

      <SimulatorForm />
    </div>
  );
}
