'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Shield, Globe, Bell, FileSpreadsheet } from 'lucide-react';

export default function SettingsPage() {
  const [taxRegime, setTaxRegime] = useState<'new' | 'old'>('new');
  const [language, setLanguage] = useState<'en' | 'hinglish'>('en');
  const [channels, setChannels] = useState({ inApp: true });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings & Compliance Preferences</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure tax regime rules, plain-language tone, and notification delivery.
        </p>
      </div>

      <div className="space-y-4">
        {/* Tax Regime Toggle */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Income Tax Regime (Budget 2025 Slabs)
            </CardTitle>
            <CardDescription className="text-xs">
              Determines slab calculations and Section 87A rebate thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setTaxRegime('new')}
                className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                  taxRegime === 'new'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground">New Tax Regime</span>
                  <Badge variant="success" className="text-[10px]">
                    Default
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  ₹75,000 standard deduction + zero tax up to ₹12 Lakhs income under Section 87A.
                </p>
              </div>

              <div
                onClick={() => setTaxRegime('old')}
                className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                  taxRegime === 'old'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground">Old Tax Regime</span>
                  <Badge variant="outline" className="text-[10px]">
                    Optional
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Allows 80C, 80D deductions, HRA, and home loan interest exemptions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Preference */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              AI Explainer Language
            </CardTitle>
            <CardDescription className="text-xs">
              Tone and vocabulary used for weekly runway explanations and WhatsApp nudges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                size="sm"
                variant={language === 'en' ? 'default' : 'outline'}
                onClick={() => setLanguage('en')}
                className="text-xs h-9 flex-1"
              >
                Plain English
              </Button>
              <Button
                size="sm"
                variant={language === 'hinglish' ? 'default' : 'outline'}
                onClick={() => setLanguage('hinglish')}
                className="text-xs h-9 flex-1"
              >
                Hinglish-Lite ("Apka safe-to-spend...")
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Delivery Channels */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Nudge Notification Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                id: 'inApp',
                label: 'In-App Nudge Center',
                desc: 'Persistent alerts and timeline actions on the web dashboard.',
                checked: channels.inApp,
                onChange: (val: boolean) => setChannels({ ...channels, inApp: val }),
              },
            ].map((ch) => (
              <div key={ch.id} className="flex items-start justify-between p-2.5 rounded-lg border bg-muted/20">
                <div>
                  <span className="text-xs font-semibold text-foreground block">{ch.label}</span>
                  <span className="text-[11px] text-muted-foreground">{ch.desc}</span>
                </div>
                <input
                  type="checkbox"
                  checked={ch.checked}
                  onChange={(e) => ch.onChange(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer mt-1"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Connected Sources */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Data Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <div>
                  <div className="text-xs font-semibold text-foreground">CSV import & manual entry</div>
                  <div className="text-[11px] text-muted-foreground">No third-party payment API key required</div>
                </div>
              </div>
              <Badge variant="success" className="text-[10px]">
                Ready
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-1.5 text-xs h-9 px-6">
            {saved ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Saved Preferences</span>
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
