'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { INDIAN_STATES } from '@fhc/shared';
import {
  Briefcase,
  Store,
  Sparkles,
  MapPin,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form State
  const [businessType, setBusinessType] = useState<'service_creator' | 'goods_seller' | 'freelancer' | 'mixed'>('service_creator');
  const [stateCode, setStateCode] = useState('MH');
  const [registeredGst, setRegisteredGst] = useState(false);
  const [gstin, setGstin] = useState('');
  const [presumptiveScheme, setPresumptiveScheme] = useState<'44ADA' | '44AD' | 'none'>('44ADA');
  const [paymentSource, setPaymentSource] = useState<'csv' | 'manual'>('csv');

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Completed onboarding
      router.push('/dashboard');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-muted-foreground">
          <span>Step {step} of 4</span>
          <span>
            {step === 1 && 'Business Profile'}
            {step === 2 && 'Jurisdiction & GST'}
            {step === 3 && 'Tax Presumptive Scheme'}
            {step === 4 && 'Connect Payments'}
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <Card className="shadow-md border-primary/20">
        <CardHeader>
          {step === 1 && (
            <>
              <CardTitle>What best describes your income?</CardTitle>
              <CardDescription>
                GST thresholds and presumptive profit rules differ by business category.
              </CardDescription>
            </>
          )}
          {step === 2 && (
            <>
              <CardTitle>State & GST Registration</CardTitle>
              <CardDescription>
                State location sets your mandatory GST threshold (₹20L vs ₹40L).
              </CardDescription>
            </>
          )}
          {step === 3 && (
            <>
              <CardTitle>Presumptive Tax Scheme</CardTitle>
              <CardDescription>
                Simplify your tax: Pay flat deemed profit with no accounting audit required.
              </CardDescription>
            </>
          )}
          {step === 4 && (
            <>
              <CardTitle>Connect Payment Inflow</CardTitle>
              <CardDescription>
                We read incoming payments to calculate runway and track tax reserves.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-5">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  id: 'service_creator',
                  title: 'Content Creator / Influencer',
                  desc: 'Instagram/YouTube brand deals, sponsorships, digital courses. (₹20L GST limit)',
                  icon: Sparkles,
                },
                {
                  id: 'freelancer',
                  title: 'Freelance Professional / Consultant',
                  desc: 'Design, software, copywriting, advisory client retainers. (₹20L GST limit)',
                  icon: Briefcase,
                },
                {
                  id: 'goods_seller',
                  title: 'Online / Marketplace Seller',
                  desc: 'Selling apparel, handicrafts, e-commerce physical goods. (₹40L GST limit)',
                  icon: Store,
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = businessType === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setBusinessType(item.id as any)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground">{item.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Your Principal State
                </label>
                <select
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Special category states (Northeast &amp; Hill states) have a lower ₹10L/₹20L threshold.
                </span>
              </div>

              <div className="pt-2 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-foreground block">
                      Already registered for GST?
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Toggle yes if you already have an active 15-digit GSTIN.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={registeredGst}
                    onChange={(e) => setRegisteredGst(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                {registeredGst && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      GSTIN Number
                    </label>
                    <Input
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      className="uppercase text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-3">
              {[
                {
                  id: '44ADA',
                  title: 'Section 44ADA (Creators & Professionals)',
                  desc: 'Flat 50% deemed profit on gross receipts up to ₹75L. Only ONE advance tax instalment due by 15 March!',
                  badge: 'Recommended for Creators',
                },
                {
                  id: '44AD',
                  title: 'Section 44AD (Goods & Trading Businesses)',
                  desc: 'Flat 6% profit on digital turnover (8% cash) up to ₹3 Crore. One single instalment by 15 March.',
                  badge: 'For Physical Goods',
                },
                {
                  id: 'none',
                  title: 'Standard Normal Taxation (None)',
                  desc: 'File taxes on actual net accounting profit after deducting all expenses. Standard quarterly advance tax applies.',
                  badge: 'Normal Books',
                },
              ].map((scheme) => (
                <div
                  key={scheme.id}
                  onClick={() => setPresumptiveScheme(scheme.id as any)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    presumptiveScheme === scheme.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-foreground">{scheme.title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {scheme.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{scheme.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setPaymentSource('manual')}
                  className={`p-3.5 rounded-lg border-2 text-center cursor-pointer ${
                    paymentSource === 'manual'
                      ? 'border-primary bg-primary/5 font-semibold'
                      : 'border-muted'
                  }`}
                >
                  <Briefcase className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <span className="text-xs">Manual income entry</span>
                </div>
                <div
                  onClick={() => setPaymentSource('csv')}
                  className={`p-3.5 rounded-lg border-2 text-center cursor-pointer ${
                    paymentSource === 'csv'
                      ? 'border-primary bg-primary/5 font-semibold'
                      : 'border-muted'
                  }`}
                >
                  <FileSpreadsheet className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <span className="text-xs">UPI Statement CSV</span>
                </div>
              </div>

              {paymentSource === 'csv' ? (
                <div className="p-6 border-2 border-dashed rounded-lg text-center space-y-2">
                  <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground" />
                  <div className="text-xs font-medium text-foreground">
                    Upload PhonePe / GooglePay / Bank CSV
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    Drag and drop file or use pre-loaded demo statements.
                  </span>
                </div>
              ) : <div className="p-6 border-2 border-dashed rounded-lg text-center space-y-2"><Briefcase className="h-8 w-8 mx-auto text-muted-foreground" /><div className="text-xs font-medium text-foreground">Start with your current numbers</div><span className="text-[11px] text-muted-foreground block">You can add income and expenses manually; no payment-provider API key needed.</span></div>}
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            {step > 1 ? (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : (
              <div />
            )}
            <Button size="sm" onClick={handleNext} className="gap-1.5 px-5">
              <span>{step === 4 ? 'Launch Copilot' : 'Continue'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
