# Gates

> Everything that cannot move without a decision from a person. **Nothing else lives here** — not
> the plan, not progress, not what was built.
>
> The **open since** column is the point: a gate nobody is chasing has quietly become a decision to
> do nothing.
>
> The row below is the shape, not a gate — `G-nn` is deliberately not a number, so the checker does
> not read it as one. Real rows start at `G-01`.

| id | Blocked | The question | Owner | Open since | Closes when |
|---|---|---|---|---|---|
| G-01 | Taking the first real order safely | Has migration 039 been applied to production? Nothing in this tree can run DDL; apply it in the Supabase SQL editor. | Stéan | 2026-10-05 | An anon GET on `blindly_orders` returns 401/empty with a row present, or `pg_policies` shows the three policies gone |
| G-02 | Taking real money | Is `PAYFAST_SANDBOX` `false` on Vercel production, with a passphrase set? In sandbox mode the ITN IP allow-list is off. | Stéan | 2026-10-05 | The Vercel production env is read and recorded in `EVIDENCE.md` |
| G-04 | Fulfilment and the daily cron | Are `SUPPLIER_EMAIL`, `ADMIN_EMAIL`, `RESEND_FROM` and `CRON_SECRET` set on Vercel production? Unset, the supplier order silently does not send, admin mail goes to `admin@example.com`, and (since 2026-10-11) the daily cron refuses to run, so unpaid orders are not expired and the env report is not sent. | Stéan | 2026-10-05 | All four confirmed set, recorded in `EVIDENCE.md` |
| G-06 | Filing `project_brief/customcolor/` | Four "customcolor" logo PNGs, never committed and referenced nowhere: this client's, or another's? The rest of G-06 was settled 2026-10-05 (exceljs, the xls, the public icons restored; duplicate videos and the order-form copy deleted; tech sheet committed). | Stéan | 2026-10-05 | Committed or removed |
| G-07 | Trusting the PayFast fix | Does a real sandbox ITN now verify? 9877ca1 was probed against a body signed the way PayFast documents, not a captured one. Run one sandbox payment end to end (`SUPPLIER_EMAIL` pointed at yourself) before the first live order. | Stéan | 2026-10-05 | A sandbox order reaches `paid` and its emails arrive; recorded in `EVIDENCE.md` |
| G-11 | Colour on an order | Checkout accepts any colour string up to 100 characters and sends it to the supplier; it is not checked against the range's colours (walk F5). Validate on the server, or rely on the configurator? | Stéan | 2026-10-11 | A DECISIONS row, and the fix if yes |
| G-12 | Admin pages behind the layout alone | 45 of 48 `app/admin/**/page.tsx` read with the service key and rely on `app/admin/layout.tsx`'s role redirect alone (walk round 3 F4; the dashboard was given its own check). A layout's redirect does not stop its pages' reads, and a request for a page segment alone may not run it. Guard every page (or a `proxy.ts` rule on `/admin`), and the admin queries themselves? | Stéan | 2026-10-11 | Each admin page, or the route, checks the role before its reads; a check holds it |
| G-13 | Two VAT rates | The blind's VAT comes from `site_settings.vat_percent` (`lib/pricing/lookup.ts`); extras, delivery and installation use a hard-coded `VAT_RATE = 0.15` (`lib/blinds/order-totals.ts`). Changing the setting would price one order at two rates (walk round 3 F7). One source: which? | Stéan | 2026-10-11 | A DECISIONS row, and the code reading one rate |
| G-09 | Log hygiene (the unanswered half of G-05) | Should checkout stop logging the signature input, which includes `merchant_key`, and the ITN stop logging customer email and the supplier address to Vercel logs? | Stéan | 2026-10-05 | A DECISIONS row, and the fix if yes |

## Closed

| id | Closed | Answer |
|---|---|---|
| G-03 | 2026-10-05 | Supplier prices are not public: migration 040 drops anon read; the configurator grid reads with the service client (dbaf240). Apply 040 after that deploys. |
| G-05 | 2026-10-05 | Yes: the ITN checks `amount_gross` against `total_cents` (679258e), and a failed supplier send is retried once with an idempotency key, then logged as before (679258e, 9877ca1). |
| G-08 | 2026-10-11 | Server computes it (Stéan): checkout and `/api/blinds/quote` route the delivery address through `lib/distance.ts` and price transport from that; the browser's distance is ignored (DECISIONS 2026-10-11). |
| G-10 | 2026-10-06 | Widened (Stéan): the CLI ask finds `supabase` under any runner and also catches `migration up` and `migration repair`; the credential ask adds `SUPABASE_DB` and ignores case; searches (`grep`, `rg`, `git`) pass. 19 new probes, both directions; the differential against 8a1e4be gives 12 stricter and 1 declared looser. |
