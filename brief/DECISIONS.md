# Decisions

> One row per settled question. Append at the bottom. **A reversed decision is struck through, not
> deleted** — the record of a closed gate is what stops it being re-asked.
>
> **Sweep past 40 rows** — every table row, dated or not. Apply the test to each: does this row still
> govern anything — a file in the tree, or work still queued — with nothing since having superseded
> it? A row fails only on evidence: its subject retired, its work cancelled, or a later row
> superseding it. Unbuilt work and "don't" rulings still bind. Move the rows that fail it to
> `_ARCHIVE/DECISIONS-<YYYY-MM>.md`, then record the sweep as a line (not a table row) below the
> table: `**Swept:** YYYY-MM-DD — N of M rows still bind` — M tested, N kept, and the log then holds
> exactly N. There is no size limit on this file (BRIEF-STANDARD §2.4, §7).

| Date | Decision |
|---|---|
| 2026-10-05 | **blindly adopts dev-standards canon.** Kit installed (5bbee43), seven canon agents (a91b802), tier-0 gates wired and baselined (d52d18b, 373706a). |
| 2026-10-05 | **Push policy: announce-then-push.** A push to `main` deploys the live site; announce it, have `npm run check` green first, and bash-gate asks. |
| 2026-10-05 | **The four live security defects found at intake are fixed on adoption day, ahead of go-live** — an exception to canon's "adoption changes zero application code", made by Stéan because the shop goes live today. Price-import guard, atomic ITN claim, contact emails in `after()`, migration 039 closing public order access. |
| 2026-10-05 | **The red tier-0 gates are baselined, not fixed.** tsc, eslint, knip and madge are held to `scripts/baseline/` and may only shrink; a fix lands with its shrunken baseline. Supersedes nothing. |
| 2026-10-05 | **`project_brief/` is filed into `brief/`, project docs only.** PROJECT_BRIEF, TECHNICAL_DESIGN, the 29 build specs, BUILD_INDEX, the brand design doc and PROJECT_TODO moved under their own names; build specs numbered by build number. The YOROS template docs, binaries (supplier price lists, mockups, logos) and `build plan/migrations/` stay in `project_brief/`. |
| 2026-10-05 | **PayFast is the payment provider; every document saying Paystack is stale.** Code and migration 038 settle it; the build specs and tech sheet are historical and are not rewritten. |
| 2026-10-05 | **`brief/product/10-PROJECT_TODO.md` is a frozen snapshot (2026-02-26), not a live list.** Live status is `brief/CURRENT.md`; open work is in `GATES.md` and `build/INDEX.md`. |
| 2026-10-05 | **Supplier prices are not public (G-03).** `price_matrices` anon read is dropped by migration 040; every public price read goes through the service client and returns customer prices only. |
| 2026-10-05 | **The ITN refuses a payment whose amount is not the order total, and retries a failed supplier send once (G-05).** A mismatch is not claimed or sent and the admin is emailed; the retry carries a Resend idempotency key so it cannot become a second order. |
| 2026-10-05 | **Migrations are applied through the Supabase Management API (G-01, Stéan),** not the SQL editor by hand — with a personal access token the operator supplies; the apply is recorded in `EVIDENCE.md`. |
| 2026-10-06 | **Every route to production SQL asks (G-10, Stéan):** the Supabase CLI under any runner, `migration up` and `migration repair`, the Management API, and `SUPABASE_DB`. A search that only names them does not ask. |
