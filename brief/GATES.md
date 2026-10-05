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
| G-03 | Supplier price confidentiality | Are the 11,501 `price_matrices` rows Shademaster cost prices, and should anon stop reading them? (030 makes them public.) | Stéan | 2026-10-05 | A DECISIONS row: keep public, or a migration narrowing the policy |
| G-04 | Fulfilment and the daily cron | Are `SUPPLIER_EMAIL`, `ADMIN_EMAIL`, `RESEND_FROM` and `CRON_SECRET` set on Vercel production? Unset, the supplier order silently does not send, admin mail goes to `admin@example.com`, and the cron runs unauthenticated. | Stéan | 2026-10-05 | All four confirmed set, recorded in `EVIDENCE.md` |
| G-05 | ITN robustness | Should the ITN verify `amount_gross` against the order total, and stop logging `merchant_key` and customer email? And should a failed supplier send be retried? Today it is caught, logged and answered 200, so it is lost (walker N2). | Stéan | 2026-10-05 | A DECISIONS row, and the fix if yes |
| G-06 | Filing the rest of `project_brief/` | Your uncommitted `blindly-tech-sheet.md`, `customcolor/`, the modified Roller Blind price list and the deleted `public/` logo and favicon: commit, file or drop? | Stéan | 2026-10-05 | Each is committed or removed |

## Closed

| id | Closed | Answer |
|---|---|---|
