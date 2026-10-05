# Project surface — shared notes for every agent

Not an agent file. The facts each agent's surface section draws on, kept once. Written
2026-10-05 at adoption, BEFORE the Phase 1 survey: where a line says "unconfirmed", the survey
(`brief/EVIDENCE.md`) has not measured it yet, and the survey wins when the two disagree.

## The check gate
`npm run check`. **Do not restate the step list anywhere; read `package.json`**, which is the
only copy that cannot go stale. At adoption it runs hook registration and the four hook probes,
then lint — and lint is RED on 11 errors in 9 files that predate adoption (`react-hooks`
set-state-in-effect, unescaped entities, two `prefer-const` in `lib/pricing/lookup.ts`). Ruling on
them is a Phase 2 decision for the operator, so a red gate on exactly those is the known state, not
your regression. Anything else red is.

There is no CI and no test suite.

## What can actually hurt (the danger census, 2026-10-05)

| Danger | Why it is the danger here |
|---|---|
| **Writing to the database** | Supabase `duhxsnetntkzzgxenccw` is the only project `.env.local` names, behind the live site; no staging project is known. `npm run dev`, and any script run with `.env.local`, reads and writes live data. The service-role key in that file bypasses RLS. |
| **Money** | This is a shop: tier `commerce`, PayFast on. Checkout is `app/api/checkout` and `app/api/blinds/checkout`; payment is confirmed by the ITN webhook `app/api/webhooks/payfast`. `PAYFAST_SANDBOX` is `true` in `.env.local`; what production runs with is **unconfirmed**. The checkout signature broke and was re-fixed three times running (84fd8ca, 30548df, 735e607). |
| **A real supplier order** | A paid ITN emails `SUPPLIER_EMAIL` a Shademaster order form (`lib/blinds/supplier-order.ts`), and blinds get made to measure. Replaying or forging an ITN, or marking an order paid, can put a real manufacturing order in motion. |
| **Price is data** | What a customer pays comes from `price_matrices`, `markup_config`, `extra_price_points`, `motorisation_prices` (imported from the supplier's price list via `blindsImport`), computed in `lib/pricing/`. A wrong matrix row is a wrong price on the live site. |
| **Real customer data** | `blindly_orders`, `blindly_order_items`, `saved_quotes`, `measure_requests`, `swatch_requests` hold real customers' names, contact details and addresses. Never copy rows into an artefact beyond what the question needs. |
| **Real email** | Resend first, SMTP fallback (`lib/email.ts`), from `RESEND_FROM`, admin copies to `ADMIN_EMAIL`. Anything that triggers a send reaches a real inbox. A daily Vercel cron (`/api/cron/daily`, 06:00) also sends. On Vercel a send that is neither awaited nor handed to `after()` is dropped when the function returns — nortiercupboards lost two leads this way. Sends here are awaited at adoption; nothing uses `after()`. |
| **A push to `main`** | Vercel deploys every push to `main` to the live site. There is no other branch and no staging step. A merge or push to `main` is the operator's call, and bash-gate asks. |
| **DDL** | 38 files in `supabase/migrations/` and `scripts/setup-db.sh`, which runs `supabase db push`, `db reset` or `psql`. Neither the supabase CLI nor psql is installed here, so how DDL actually reached production is **unconfirmed**. bash-gate asks on all three. |

## The template underneath
Scaffolded from the Yoros client template. `config/site.ts` sets tier `commerce`. On: i18n
(`en`/`af`), dark mode, WhatsApp, Google Maps, billing, legal docs, blinds import; integrations
PayFast, Google Analytics, Resend. Off: blog, portfolio, booking, shop, LMS, newsletter, customer
auth, portal, campaigns, drip emails, coupons, gifts, Microsoft Graph, and the services page.
**Their code, routes, admin pages and migrations are still in the tree.** The blinds commerce is
its own code (`lib/blinds`, `lib/pricing`, `components/configurator`), not the template's `shop`.
Code under a disabled feature is not live behaviour — check `isEnabled()` (`config/features.ts`)
before reasoning about any of it.

## SSOTs

| | |
|---|---|
| `config/site.ts` | Name, domain, tier, brand colours and fonts, locale, every feature flag. |
| `config/features.ts` | `isEnabled()` — the only correct way to ask whether a feature is on. |
| `lib/supabase/` | `server.ts`, `client.ts`, `admin.ts` (service role — bypasses RLS). |
| `lib/pricing/` | Every price computation: grid lookup, extras, motorisation, markup. |
| `lib/payfast/` | Payment client and ITN handling. |
| `lib/email.ts` | Email sending, Resend first and SMTP as the fallback. |
| `lib/cms/queries.ts` | Every read of the site's CMS content. |

## The schema channel
**Narrow.** The only credential is the service-role key (`.env.local`, synced by
`scripts/sync-secrets.mjs` from the OneDrive channel). It reaches PostgREST, so a known
table can be read; it cannot read `information_schema`, so the schema cannot be enumerated from
here. No psql, no `pg` package and no supabase CLI are installed. What `SUPABASE_DB` in `.env.local`
holds is unconfirmed. **Nothing here may run DDL.**

## Where the brief binds
`brief/README.md` first. `project_brief/` is the pre-adoption brief, being filed into `brief/`
role folders during the survey; until a document is filed, `project_brief/` is still its only copy.
`project_brief/client_documentation/` holds the supplier's price list and order form.
