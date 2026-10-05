# Current

> **Where the work is, right now.** Read at the start of every session; **written after every
> meaningful step**, before committing. A file that is only ever read goes stale in one session and
> then misleads the next.
>
> **Hard ceiling: 8 KB.** This is a handoff note, not a journal — it is read before every session,
> so its size is a per-session tax. Anything older than the current step is history: finished
> decisions go to `DECISIONS.md`, finished steps to `build/INDEX.md`, the rest nowhere.

**Active** — go-live, 2026-10-05: G-03 and G-05 closed in code; payment-path fixes awaiting push.

**Just done** —
- dbaf240 grid off anon + migration 040; 679258e ITN amount check + supplier retry; 9877ca1 ITN
  signature verified on the raw body (it rejected real ITNs) + idempotency key; b1493f3 accessories
  priced on the server.

**Next action** — walk 9877ca1..b1493f3, push. Then, in order: apply 039 (any time) and 040 (after
the push deploys) via the Management API once the operator supplies a token (G-01); one sandbox
payment end to end (G-07); operator reads the Vercel env (G-02, G-04).

**Decided mid-build, not yet in DECISIONS.md** — nothing.

**Do not touch** — the operator's uncommitted work: `exceljs` in package.json and the lockfile,
`public/templates/`, `public/images/*.mp4`, the deleted `public/favicon.png` and `public/logo.svg`,
`project_brief/blindly-tech-sheet.md`, `project_brief/customcolor/`, the modified Roller Blind xls (G-06).
