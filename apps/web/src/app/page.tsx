import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-violet-300/30 blur-3xl" />
      <div className="absolute -right-20 bottom-12 h-80 w-80 rounded-full bg-teal-300/25 blur-3xl" />
      <div className="relative max-w-4xl text-center space-y-8">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-violet-200 bg-white/75 px-4 py-2 text-xs font-semibold text-violet-700 shadow-sm backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" /> Your money, made calmer
        </div>
        <div className="space-y-5">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
            Financial clarity,
            <span className="gradient-text block">without the spreadsheet stress.</span>
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            Know what&apos;s safe to spend, what to set aside for tax, and how close
            you are to GST registration — all in plain language.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/onboarding"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-white/80 bg-white/70 px-7 text-sm font-semibold shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white"
          >
            Go to Dashboard
          </Link>
        </div>

        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 pt-3 sm:grid-cols-3">
          {[['Safe runway', ShieldCheck], ['GST visibility', TrendingUp], ['Plain-language AI', Sparkles]].map(([label, Icon]) => { const FeatureIcon = Icon as typeof ShieldCheck; return <div key={label as string} className="glass-card flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-600"><FeatureIcon className="h-4 w-4 text-teal-600" />{label as string}</div>; })}
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Estimates only — not a substitute for a CA or ITR filing.
        </p>
      </div>
    </div>
  );
}
