# Evidence

> **Every fact available to this project, with its source.** Nothing elsewhere in this tree may
> state a fact this file does not carry. If a claim is not here it is not established — ask; do not
> estimate, round or infer.
>
> Fill this file FIRST. Everything else references it.

Written from the adoption intake survey, 2026-10-05 (commit c31985b). The raw artefacts were the
four survey agents' reports under `.handoff/intake-survey/` (scratch, not kept); every line below
names what was measured and how.

## Stack and gate

- **Next.js 16.1.6, React, TypeScript, Tailwind 4, Supabase (`@supabase/ssr`), Resend, PayFast.** One
  branch, `main`; Vercel deploys every push; one cron, `/api/cron/daily` at 06:00 (`vercel.json`). —
  *source: package.json, vercel.json, git branch -a, 2026-10-05*
- **No tests, no CI, no test runner.** `next.config.ts` sets `ignoreBuildErrors: true`, so type errors
  do not stop a deploy. — *source: grounder survey, 2026-10-05*
- **The tier-0 tools were red at adoption: tsc 9 errors, eslint 11 errors (9 files), knip 201 findings
  (21 unused files, 144 unused exports, 33 unused types, 3 deps), madge 7 cycles.** Recorded as the
  baseline in `scripts/baseline/`. — *source: `node scripts/check-baseline.mjs <tool> --emit`, 2026-10-05*

## The production database

- **One Supabase project, `duhxsnetntkzzgxenccw`, is the only database `.env.local` names; no staging
  project is known.** — *source: .env.local variable names, 2026-10-05*
- **Production matches migrations 026–038:** all 20 blinds/pricing/order tables answer, and columns
  added by 036, 037 and 038 exist (`paystack_*` columns are gone). 035 (a constraint) is unmeasurable.
  — *source: db-inspector, PostgREST GETs with the service key, 2026-10-05*
- **The shop has taken no orders.** `blindly_orders`, `blindly_order_items`, `saved_quotes`,
  `measure_requests`, `swatch_requests` all hold 0 rows. The catalogue is loaded: 4 categories,
  14 types, 39 ranges, 11,501 `price_matrices` rows, 1 supplier, 22 price imports. — *source:
  db-inspector, counts via `Prefer: count=exact`, 2026-10-05*
- **RLS is enforced in production.** Anon is blocked from `markup_config`, `import_mappings`,
  `user_profiles`, `contact_submissions`, and filtered on `site_settings` (5 of 6 rows), matching the
  policies. — *source: db-inspector, anon vs service-role counts, 2026-10-05*
- **`price_matrices` (11,501 raw supplier price rows) is readable by anyone with the public anon key**,
  per 030's `USING (true)` and as observed. — *source: db-inspector, anon count 11,501, 2026-10-05*
- **No migration-tracking table is reachable; 026–038 appear in no runner in the tree**
  (`scripts/setup-db.sh` lists 001–025 only), so they were applied by a route that is not recorded.
  — *source: census + db-inspector, 2026-10-05*
- **`site_settings` keys:** currency, delivery_fee_cents, free_delivery_threshold_cents,
  global_markup_percent, installation_fee_cents, vat_percent. No payment-mode key. — *source:
  db-inspector, 2026-10-05*

## Payments

- **PayFast, not Paystack.** `lib/payfast/`, migration 038 renamed the Paystack columns; the build
  specs, `00-BUILD_INDEX.md` and `project_brief/blindly-tech-sheet.md` still say Paystack. —
  *source: scout + census, 2026-10-05*
- **`PAYFAST_SANDBOX=true` in the local `.env.local`; the production value is not visible from here.**
  In sandbox mode the ITN source-IP allow-list is skipped. — *source: .env.local; lib/payfast/webhooks.ts*
- **A paid ITN emails `SUPPLIER_EMAIL` a Shademaster order form** (`lib/blinds/supplier-order.ts`), and
  the ITN handler always answers 200, even when it throws. — *source: grounder + census, 2026-10-05*
- **The ITN does not check `amount_gross` against the order total.** — *source: census, 2026-10-05*
- **Checkout logs the signature input, including `merchant_key`, to Vercel logs**; the ITN logs the
  supplier address and customer email. The passphrase and service key are not logged. — *source:
  census §4, 2026-10-05*

## Defects found at intake, and their state

- **Price-import server actions had no admin check while writing prices with the service key** —
  fixed in ca5fef1. — *source: census, 2026-10-05*
- **ITN idempotency was select-then-update; two concurrent ITNs could send two supplier orders** —
  fixed in 1437581. — *source: census + grounder, 2026-10-05*
- **The contact form's emails were fire-and-forget and dropped on Vercel** — fixed in 2a962c8.
- **030 let anon read and insert orders, order items and quotes** — migration 039 written (c53246b),
  **not yet applied to production**. — *source: grounder + census, 2026-10-05*
- **`/api/cron/daily` runs unauthenticated if `CRON_SECRET` is unset** (its own fail-open check; the
  shared `lib/cron/auth.ts` is unused). Whether it is set on Vercel is not visible. — *source: grounder*
- **`lib/blinds/actions.ts` (13 unguarded writes) is imported nowhere**, so it is not reachable. —
  *source: knip, 2026-10-05*

## Email

- **Resend first, SMTP fallback** (`lib/email.ts`), from `RESEND_FROM`, admin copies to `ADMIN_EMAIL`
  (falls back to `admin@example.com` if unset). 5 live send sites: 3 awaited in the ITN (customer,
  supplier, admin), 2 in the contact form (now in `after()`). — *source: census, 2026-10-05*

## Template

- **Yoros client template, tier `commerce`.** Live flags: i18n, darkMode, whatsapp, googleMaps,
  billing, legalDocs, blindsImport; PayFast, GA, Resend. Off but present in the tree: blog, portfolio,
  booking, shop, LMS, newsletter, customer auth, portal, campaigns and more. The blinds shop is its
  own code, not the template's `shop`. — *source: config/site.ts, 2026-10-05*

---

## Claims that are interpretation, not fact

- `price_matrices` holds Shademaster **cost** prices, so public read exposes the margin — inferred
  from 030's comment ("markup is applied server-side"); not confirmed with the client. Gate G-03.
