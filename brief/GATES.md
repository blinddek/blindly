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
| G-04 | Fulfilment and the daily cron | Are `SUPPLIER_EMAIL`, `ADMIN_EMAIL`, `RESEND_FROM` and `CRON_SECRET` set on Vercel production? Unset, the supplier order silently does not send, admin mail goes to `admin@example.com`, and the cron runs unauthenticated. | Stéan | 2026-10-05 | All four confirmed set, recorded in `EVIDENCE.md` |
| G-06 | Filing `project_brief/customcolor/` | Four "customcolor" logo PNGs, never committed and referenced nowhere: this client's, or another's? The rest of G-06 was settled 2026-10-05 (exceljs, the xls, the public icons restored; duplicate videos and the order-form copy deleted; tech sheet committed). | Stéan | 2026-10-05 | Committed or removed |
| G-07 | Trusting the PayFast fix | Does a real sandbox ITN now verify? 9877ca1 was probed against a body signed the way PayFast documents, not a captured one. Run one sandbox payment end to end (`SUPPLIER_EMAIL` pointed at yourself) before the first live order. | Stéan | 2026-10-05 | A sandbox order reaches `paid` and its emails arrive; recorded in `EVIDENCE.md` |
| G-08 | Transport fee | Checkout takes `distance_km` from the browser and charges no transport fee when it is null, so a professional-install order can skip the fee. Compute distance on the server, or accept the leak? | Stéan | 2026-10-05 | A DECISIONS row, and the fix if yes |
| G-09 | Log hygiene (the unanswered half of G-05) | Should checkout stop logging the signature input, which includes `merchant_key`, and the ITN stop logging customer email and the supplier address to Vercel logs? | Stéan | 2026-10-05 | A DECISIONS row, and the fix if yes |

## Closed

| id | Closed | Answer |
|---|---|---|
| G-03 | 2026-10-05 | Supplier prices are not public: migration 040 drops anon read; the configurator grid reads with the service client (dbaf240). Apply 040 after that deploys. |
| G-05 | 2026-10-05 | Yes: the ITN checks `amount_gross` against `total_cents` (679258e), and a failed supplier send is retried once with an idempotency key, then logged as before (679258e, 9877ca1). |
