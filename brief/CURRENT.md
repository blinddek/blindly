# Current

> **Where the work is, right now.** Read at the start of every session; **written after every
> meaningful step**, before committing. A file that is only ever read goes stale in one session and
> then misleads the next.
>
> **Hard ceiling: 8 KB.** This is a handoff note, not a journal — it is read before every session,
> so its size is a per-session tax. Anything older than the current step is history: finished
> decisions go to `DECISIONS.md`, finished steps to `build/INDEX.md`, the rest nowhere.

**Active** — canon adoption done through Phase 3; next is the go-live push, 2026-10-05.

**Just done** —
- Security fixes ca5fef1, 1437581, 2a962c8, c53246b, 4eeef4d, a163b0c, and `lib/storage.ts` guarded (82d5344).
- Tier-0 gates baselined; `CLAUDE.md`, `docs/MECHANISABLE.md` (M-001..003), `docs/EXPERIMENTS.md`, context-budget (9f89756).

**Next action** — `/walk` the unpushed range, announce, push (deploys live). Then the operator closes
G-01 (apply 039), G-02 and G-04 (read the Vercel production env) — no connector here reaches them.

**Decided mid-build, not yet in DECISIONS.md** — nothing.

**Do not touch** — the operator's uncommitted work: `exceljs` in package.json and the lockfile,
`public/templates/`, `public/images/*.mp4`, the deleted `public/favicon.png` and `public/logo.svg`,
`project_brief/blindly-tech-sheet.md`, `project_brief/customcolor/`, the modified Roller Blind xls (G-06).
