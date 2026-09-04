# Financial Health Copilot for India's Gig/Creator/Solo-Seller Economy
### Full End-to-End Build Specification + AI Coding-Agent Prompts

This document is written so you can hand each **"PROMPT →"** block directly to an AI coding agent (Claude Code, Cursor, etc.) in sequence and get a working product. It also contains the domain logic (tax rules, thresholds, smoothing math) explicitly, so the agent isn't guessing at India-specific compliance rules.

---

## 1. Product Definition

**One-line pitch:** A copilot that watches a solo seller's real payment inflows (Razorpay/UPI) and tells them, in plain language, three things every week: *how much is actually safe to spend, how much to set aside for tax right now, and how close they are to a compliance cliff (GST registration).*

**Primary persona:** Instagram/marketplace seller or freelance creator in India, ₹3L–₹60L annual revenue, no accountant on retainer, files taxes reactively or not at all, doesn't know their real cash runway because income is lumpy (₹0 for 3 weeks, ₹80k in one day).

**Core promise (KPI):** % of users who see a GST/advance-tax threshold warning *before* they cross it, not after a CA tells them they owe a penalty.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 14)                     │
│  Dashboard · Onboarding · Nudge Center · Simulator · Settings    │
└───────────────────────────┬───────────────────────────────────────┘
                             │ REST/tRPC (typed)
┌───────────────────────────▼───────────────────────────────────────┐
│                    BACKEND (Node.js / Express or NestJS)          │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────────────┐   │
│  │ Ingestion Svc │ │ Ledger Engine │ │ Compliance Rule Engine │   │
│  │ (Razorpay,    │ │ (categorize,  │ │ (GST threshold, advance│   │
│  │  CSV, UPI)    │ │  reconcile)   │ │  tax slabs, due dates) │   │
│  └───────────────┘ └───────────────┘ └───────────────────────┘   │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────────────┐   │
│  │ Smoothing/    │ │ Nudge/Notif   │ │ LLM Explainer Layer    │   │
│  │ Forecast Svc  │ │ Scheduler     │ │ (Claude API)           │   │
│  └───────────────┘ └───────────────┘ └───────────────────────┘   │
└───────────────────────────┬───────────────────────────────────────┘
                             │
┌───────────────────────────▼───────────────────────────────────────┐
│  PostgreSQL (ledger, users, rules) · Redis (job queue/cache)       │
│  Razorpay API (test mode) · WhatsApp/Email (nudges) · Claude API   │
└─────────────────────────────────────────────────────────────────┘
```

**Recommended stack (fast to hackathon-demo, credible to scale):**
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui + Recharts
- Backend: Node.js + NestJS (or Express if time-constrained) + TypeScript
- DB: PostgreSQL (Supabase is fine for hackathon speed — gives you auth + DB + storage in one)
- Queue/cron: BullMQ + Redis (for daily/weekly nudge jobs) — or Supabase Edge Functions + cron if minimizing infra
- Payments data: Razorpay API (test mode) — Payments, Settlements, Payouts endpoints
- AI layer: Claude API (Sonnet) for the plain-language explainer and nudge copy — **never** for the actual tax math (that must be deterministic/rule-based; LLM explains, never calculates)
- Auth: Supabase Auth or Clerk
- Notifications: WhatsApp Business Cloud API (highest engagement for this segment) + email fallback (Resend/SendGrid)

**Golden rule for the build:** tax and threshold numbers come from a deterministic rules engine you can unit-test. The LLM's only job is turning `{gst_proximity: 0.82, threshold: 2000000}` into "You're at ₹16.4L of ₹20L — about 3 good months from mandatory GST registration."

---

## 3. Data Model (PostgreSQL schema)

PROMPT → *"Create a PostgreSQL schema using Prisma (or Drizzle) with the following tables. Add appropriate indexes on user_id and date columns, and foreign keys with ON DELETE CASCADE where sensible."*

```sql
-- Users & business profile
users (
  id UUID PK,
  phone TEXT UNIQUE,
  email TEXT,
  full_name TEXT,
  business_type TEXT CHECK (business_type IN ('goods_seller','service_creator','freelancer','mixed')),
  state_code TEXT,               -- for GST state-wise threshold (₹20L vs ₹40L, special category states)
  registered_gst BOOLEAN DEFAULT FALSE,
  gstin TEXT,
  presumptive_scheme TEXT CHECK (presumptive_scheme IN ('44AD','44ADA','none')), -- affects tax estimate
  onboarding_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
)

-- Linked payment sources
payment_sources (
  id UUID PK,
  user_id UUID FK -> users,
  provider TEXT CHECK (provider IN ('razorpay','upi_csv','manual')),
  external_account_id TEXT,
  status TEXT CHECK (status IN ('active','revoked','error')),
  last_synced_at TIMESTAMP
)

-- Raw normalized transactions (income + expense)
transactions (
  id UUID PK,
  user_id UUID FK -> users,
  source_id UUID FK -> payment_sources,
  provider_txn_id TEXT,
  type TEXT CHECK (type IN ('income','expense','refund','payout_fee')),
  amount_paise BIGINT,           -- store money as integer paise, never float
  currency TEXT DEFAULT 'INR',
  category TEXT,                 -- auto-categorized: 'sales','ad_spend','platform_fee','personal_transfer', etc.
  counterparty TEXT,
  txn_date DATE,
  raw_payload JSONB,
  created_at TIMESTAMP DEFAULT now()
)

-- Derived financial year rollups (materialized for speed)
fy_rollups (
  id UUID PK,
  user_id UUID FK -> users,
  financial_year TEXT,          -- e.g. '2026-27'
  gross_turnover_paise BIGINT,
  net_income_paise BIGINT,
  updated_at TIMESTAMP
)

-- Advance tax estimate snapshots (quarterly)
tax_estimates (
  id UUID PK,
  user_id UUID FK -> users,
  financial_year TEXT,
  quarter TEXT CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  due_date DATE,
  estimated_income_paise BIGINT,
  estimated_tax_paise BIGINT,
  cumulative_paid_paise BIGINT DEFAULT 0,
  status TEXT CHECK (status IN ('upcoming','due_soon','overdue','paid_marked')),
  computed_at TIMESTAMP DEFAULT now()
)

-- GST threshold tracking
gst_threshold_status (
  id UUID PK,
  user_id UUID FK -> users,
  financial_year TEXT,
  rolling_12m_turnover_paise BIGINT,
  applicable_threshold_paise BIGINT,   -- 2000000 or 4000000 depending on business_type/state
  proximity_pct NUMERIC,
  crossed BOOLEAN DEFAULT FALSE,
  crossed_at TIMESTAMP,
  computed_at TIMESTAMP DEFAULT now()
)

-- Safe-to-spend outputs
safe_to_spend_snapshots (
  id UUID PK,
  user_id UUID FK -> users,
  computed_for_date DATE,
  smoothed_income_paise BIGINT,        -- forecasted/smoothed baseline
  tax_reserve_paise BIGINT,
  gst_reserve_paise BIGINT,
  emergency_buffer_paise BIGINT,
  safe_to_spend_paise BIGINT,
  method TEXT,                         -- 'ewma_v1', etc — for reproducibility
  created_at TIMESTAMP DEFAULT now()
)

-- Nudges sent (for KPI tracking: did user act before threshold breach)
nudges (
  id UUID PK,
  user_id UUID FK -> users,
  type TEXT CHECK (type IN ('gst_proximity','advance_tax_due','safe_to_spend_update','low_buffer_warning')),
  payload JSONB,
  channel TEXT CHECK (channel IN ('whatsapp','email','in_app')),
  sent_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  action_taken TEXT                    -- 'set_aside_confirmed','dismissed','registered_gst', etc.
)
```

---

## 4. Domain Logic — India-Specific Rules (deterministic, testable)

This is the part that must **not** be left to an LLM. Encode it as pure functions with unit tests.

### 4.1 GST Registration Threshold Rules
PROMPT → *"Implement `getGstThreshold(businessType, stateCode): number` and `computeGstProximity(rolling12mTurnoverPaise, threshold): {proximityPct, projectedCrossDate}` as pure, unit-tested TypeScript functions in `/services/compliance/gst.ts`."*

Rules to encode:
- **Goods sellers:** ₹40L threshold in most states; ₹20L in "special category states" (the Northeast + hill states list — Manipur, Mizoram, Nagaland, Tripura, Arunachal Pradesh, etc.) unless the seller opts otherwise.
- **Service providers (including most creators/freelancers):** ₹20L threshold nationally; ₹10L in special category states.
- **Aggregate turnover** = *all-India* turnover under the same PAN, not just what runs through this one payment source — flag this limitation explicitly to the user (a v1 caveat: "based on income routed through connected accounts").
- Threshold is checked on a **financial-year rolling basis**, not calendar year.
- Compulsory registration also triggers regardless of turnover for inter-state supply of goods, or selling via e-commerce operators in some cases — flag this as a "check with a CA" case rather than silently ignoring it.
- `proximityPct = rolling12mTurnover / threshold`. Trigger nudge tiers at 60%, 80%, 95%, and 100%+ (crossed).

### 4.2 Advance Tax Estimation
PROMPT → *"Implement `estimateAdvanceTax(annualizedIncomePaise, presumptiveScheme, regime): {quarterlyBreakdown, totalTaxPaise}` in `/services/compliance/advanceTax.ts`, matching the quarterly cumulative percentages and presumptive-scheme rules below. Write unit tests against at least 5 income levels."*

Rules to encode:
- Advance tax applies if estimated total tax liability for the year exceeds ₹10,000.
- Standard due-date/cumulative schedule for individuals: **15 Jun (15%), 15 Sep (45%), 15 Dec (75%), 15 Mar (100%)** of the year's estimated tax liability.
- For presumptive taxation:
  - **Section 44ADA** (professionals/creators, gross receipts ≤ ₹75L with mostly digital receipts): profit deemed = 50% of gross receipts. These taxpayers only need **one instalment by 15 Mar (100%)** instead of quarterly — encode this branch distinctly.
  - **Section 44AD** (goods/trading business, turnover ≤ ₹3Cr mostly digital): profit deemed = 6% of digital turnover (8% for non-digital). Same single-instalment-by-15-Mar treatment applies if opting in.
- Apply the **new tax regime slab rates** as default (since it's default for most taxpayers now), but let the user toggle old regime in settings — keep both slab tables as versioned config, not hardcoded magic numbers, since rates change every Budget (Feb).
- Include a `configVersion` and `assessmentYear` field on every estimate so past estimates remain reproducible even after you update rates next Budget.
- **Always render a disclaimer:** "Estimate only — not a substitute for a CA or ITR filing. Confirm before paying."

### 4.3 Income Smoothing / "Safe to Spend"
PROMPT → *"Implement an EWMA-based income smoothing function `computeSafeToSpend(transactions, userProfile): SafeToSpendResult` in `/services/forecast/smoothing.ts`."*

Algorithm (simple, explainable — resist the urge to over-engineer with LSTMs for a hackathon; explainability matters more than marginal accuracy here):

1. Bucket net income (income − refunds − platform fees) into weekly totals for the trailing 16 weeks.
2. Compute an **exponentially weighted moving average** (e.g. `alpha = 0.25`) of weekly income → `smoothedWeeklyIncome`. This dampens single big spikes (a ₹2L order) without ignoring genuine trend growth.
3. Compute weekly volatility (std dev of weekly income over trailing 16 weeks) → used to size the **emergency buffer** (e.g. `buffer = 0.5 × stdDev`, capped at some multiple of average expenses).
4. Reserve calculations, subtracted from smoothed income before "safe to spend" is shown:
   - `taxReserve = smoothedWeeklyIncome × effectiveTaxRate` (effectiveTaxRate derived from the current advance-tax estimate ÷ annualized income)
   - `gstReserve` = 0 unless registered; once registered, reserve estimated output GST liability net of estimated input credit (v1: keep this simple — flat % based on category, clearly labeled "rough estimate")
   - `platformFeeBuffer` = trailing average % taken by marketplace/payment gateway
5. `safeToSpend = smoothedWeeklyIncome − taxReserve − gstReserve − platformFeeBuffer − emergencyBufferContribution`
6. Never let `safeToSpend` go negative in the UI — floor at 0 and instead surface a "you're spending into your tax reserve" warning.

Unit-test this against three synthetic patterns: (a) steady income, (b) highly lumpy/spiky income, (c) a seller with a sudden step-change in scale (went viral) — the smoothing constant should recover within ~4–6 weeks, not lag for months.

---

## 5. AI/LLM Layer — What Claude Actually Does Here

**Explicit boundary:** the LLM never computes a number. It receives structured JSON from the rules engine above and produces (a) plain-language explanation, (b) prioritized action nudge copy, (c) answers to free-text user questions *grounded only in that user's own computed data*, never invented figures.

PROMPT → *"Build `/services/ai/explainer.ts` that calls the Claude API with a system prompt that (1) receives only the structured JSON below, (2) is instructed to never invent numbers not present in the JSON, (3) always includes the disclaimer that this is not tax/legal advice, (4) responds in plain conversational Hindi-English mix ('Hinglish-lite') if the user's locale preference is set that way, else plain English."*

Example system prompt to embed:
```
You are a financial copilot for Indian solo sellers and creators. You will be given
a JSON object with the user's computed financial figures. Your job:
1. Explain the numbers in one short, warm paragraph — no jargon.
2. If a threshold proximity_pct >= 0.6, clearly state how many "average weeks" of
   income remain before crossing, using only the numbers provided.
3. Suggest ONE concrete next action (e.g. "set aside ₹X before Friday").
4. Never state a tax rate, threshold, or amount that is not present in the input JSON.
5. End with: "This is an estimate to help you plan — please confirm with a CA before filing."
Respond in under 120 words.
```

Also build:
- **Nudge copy generator** — same pattern, shorter (WhatsApp-length, <300 chars), used by the notification scheduler.
- **Free-text Q&A endpoint** (`/api/ask`) — RAG-lite: inject the user's last 90 days of rollups + current estimates as context, let them ask "why did my safe-to-spend drop this week?" Keep temperature low; refuse if the question requires data not in context ("I don't have that — try syncing your latest transactions").

---

## 6. Ingestion Layer

PROMPT → *"Build `/services/ingestion/razorpay.ts` implementing OAuth-less API-key based sync against Razorpay's test-mode Payments and Settlements APIs, normalizing results into the `transactions` table. Include a categorization step using simple heuristics (merchant description keywords) before falling back to an LLM categorizer for ambiguous rows."*

- Use Razorpay **test mode** keys for the hackathon demo — call `/v1/payments` and `/v1/settlements`.
- Also build a **CSV importer** for UPI statement exports (PhonePe/GPay/bank statement CSVs) since many real sellers won't have Razorpay — this is actually your broader addressable path.
- Categorization heuristics first (regex/keyword match: "razorpay settlement", "meta ads", "shiprocket", "self transfer"), LLM categorizer only for the residual ambiguous set, cached by counterparty string so you don't re-classify the same merchant twice.
- Idempotent sync: dedupe on `provider_txn_id`.

---

## 7. Nudge Engine (the "agent" part)

PROMPT → *"Build a BullMQ scheduled job `nudgeScheduler.ts` that runs daily, recomputes gst_threshold_status and safe_to_spend_snapshots per user, and enqueues a nudge if any of the trigger conditions below fire. Deduplicate so a user doesn't get the same nudge tier twice in 7 days."*

Trigger conditions:
| Event | Condition | Channel | Copy tone |
|---|---|---|---|
| GST proximity | crosses 60% / 80% / 95% / 100% | WhatsApp + in-app | Urgent but calm |
| Advance tax due soon | 14 days / 3 days before quarterly due date | WhatsApp + email | Reminder + amount to set aside per week until due |
| Safe-to-spend dropped >20% week-on-week | rule-based diff | in-app | Informational |
| Emergency buffer depleted | buffer < 1 week of avg expenses | in-app + WhatsApp | Supportive, not alarming |

Autonomous vs human-approval boundary (per your spec):
- **Autonomous:** computing estimates, generating nudge text, sending reminders.
- **Human-approval required, hard gate in code (not just UI convention):** any action that would call Razorpay Payouts, mark a tax payment as filed, or submit anything to a government portal. These must be represented as `status: 'suggested'` and require an explicit `POST /confirm` from the user before any external side-effect fires. Build this as a genuine state-machine gate, not a checkbox that's easy to skip.

---

## 8. Frontend — Screens & Components

PROMPT → *"Build the Next.js app with the following routes and components, using Tailwind + shadcn/ui. Each screen should be responsive-first (this user segment is majority mobile)."*

1. **Onboarding wizard** (`/onboarding`)
   - Business type, state, presumptive scheme selection (with a plain-language "which one am I?" helper)
   - Connect Razorpay (test mode) or upload UPI CSV
   - GST-registered? Y/N + GSTIN if yes
2. **Dashboard** (`/dashboard`) — the core screen
   - Big number: **"Safe to spend this week: ₹X"** with a one-line "why" (LLM explainer)
   - Secondary cards: Tax reserve set aside, GST threshold proximity bar (visual: filled bar toward ₹20L/40L), next advance-tax due date countdown
   - Weekly income chart (raw bars + smoothed line overlay) — Recharts
3. **Threshold Simulator** (`/simulate`) — "If I make ₹X more this month, when do I hit GST threshold?" — pure client-side call to the same rules engine, good demo moment
4. **Nudge Center** (`/nudges`) — history of all nudges + action taken, this is your KPI dashboard for the hackathon judges too
5. **Settings** (`/settings`) — tax regime toggle, notification channel preference, language preference

---

## 9. API Surface (for the backend, tRPC or REST)

```
POST /api/sync/razorpay              -> pull latest transactions
POST /api/sync/csv                   -> upload+parse UPI/bank CSV
GET  /api/dashboard/safe-to-spend    -> current snapshot + explainer text
GET  /api/compliance/gst-status      -> proximity, threshold, projected cross date
GET  /api/compliance/tax-estimate    -> current quarter + full-year breakdown
POST /api/simulate                   -> {extraIncomePaise, months} -> projected outcomes
GET  /api/nudges                     -> nudge history
POST /api/nudges/:id/ack             -> mark acknowledged / action taken
POST /api/actions/confirm-gst-registration   -> human-approval gate, logs intent only
POST /api/ask                        -> free-text Q&A grounded in user data
```

---

## 10. Build Order (phase-by-phase prompts for the coding agent)

Run these roughly in order; each is scoped to be a single agent session.

1. **PROMPT →** *"Scaffold a Next.js 14 + TypeScript + Tailwind + shadcn/ui project with a NestJS backend in a monorepo (Turborepo). Set up Prisma with the schema from Section 3. Add Docker Compose for local Postgres + Redis."*
2. **PROMPT →** *"Implement the GST threshold and advance tax rule engines from Section 4.1 and 4.2 as pure functions with full unit test coverage using Vitest/Jest, including the config-versioning pattern for tax rates."*
3. **PROMPT →** *"Implement the income smoothing engine from Section 4.3, and write a synthetic data generator that produces three test personas: steady-income creator, spiky-income seller, and a viral-growth seller, each with 12 months of daily transactions."*
4. **PROMPT →** *"Build the Razorpay test-mode ingestion service and the CSV UPI importer, normalizing both into the transactions table with the categorization heuristics described in Section 6."*
5. **PROMPT →** *"Build the BullMQ nudge scheduler from Section 7, including the human-approval gate state machine for any external-facing action."*
6. **PROMPT →** *"Build the Claude API explainer service from Section 5, with the strict system prompt guarding against invented numbers. Add a test that asserts the LLM output never contains a number not present in the input JSON (regex-extract numbers from both and diff)."*
7. **PROMPT →** *"Build the frontend screens in Section 8, wiring them to the API surface in Section 9. Prioritize the Dashboard and Simulator screens first since they're the demo centerpiece."*
8. **PROMPT →** *"Seed the database with the three synthetic personas from step 3 and write a demo script/seed command `npm run demo:seed` that puts the app into a state ready for a 3-minute live walkthrough."*
9. **PROMPT →** *"Add basic auth (Supabase Auth or Clerk), rate limiting on /api/ask, and a disclaimer footer/modal on first load: 'Estimates only, not tax/legal advice.'"*

---

## 11. Hackathon Demo Script (3 minutes)

1. **Hook (20s):** "Meet Priya, an Instagram seller. She has no idea she's 3 months from a GST compliance surprise." Show her real problem, not the tech.
2. **Live sync (30s):** Trigger `demo:seed` persona → Razorpay test-mode payments stream in live on screen → dashboard updates in real time.
3. **Core value (60s):** Point at "Safe to spend: ₹X" and the plain-language explainer. Show the GST proximity bar filling. Open Nudge Center, show a WhatsApp-style nudge that would've fired *before* the threshold breach.
4. **Simulator (40s):** Type in "what if I get a ₹3L order next week" → show projected threshold-cross date move up — this is the "wow" moment for judges.
5. **Close (30s):** State the KPI — "% of users who see the warning before the breach" — and the market size (creator/gig economy user base + zero dedicated incumbent).

---

## 12. Things to Get Right (and common failure modes to avoid)

- **Never let the LLM touch arithmetic.** All money math is deterministic and unit-tested; LLM only narrates. This is both a correctness requirement and a trust/liability one.
- **Store money as integer paise**, never floats — avoids silent rounding bugs in tax math.
- **Aggregate turnover caveat:** be explicit in-product that GST threshold tracking is based only on income routed through connected accounts, since real aggregate turnover is PAN-wide. Don't imply false precision.
- **Rates change every Union Budget (Feb):** version your tax-slab and threshold config so old estimates stay reproducible and updates don't require a code deploy — put slabs in a config table, not hardcoded constants.
- **Human-approval gate must be a real backend state machine**, not just a frontend confirmation dialog, for anything touching filing/registration/payouts.
- **Data sensitivity:** payment history is sensitive financial data — encrypt at rest, scope API keys tightly, and don't log raw transaction payloads in plaintext application logs.

---

This spec gives you: the architecture, the exact India-specific rules to encode, the schema, the algorithm, the LLM boundary, the API surface, the screens, and a phased prompt sequence to feed an AI coding agent end-to-end, plus a demo script tuned for judges.
