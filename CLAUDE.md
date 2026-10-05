# CLAUDE.md — Blindly

<!--
  Built from dev-standards kit/CLAUDE_TEMPLATE.md (CLAUDE-MD-STANDARD v4.5), 2026-10-05, at
  adoption. BINDING METRIC: the unenforceable ratio N of D, held by
  scripts/check-claude-md.mjs against scripts/check-claude-md.ceiling.json. N may only fall.
  Markers: @enforced <ns:id> as an inline comment at the end of the rule line; the
  UNENFORCEABLE word in bold with its reason; MECHANISABLE → M-0NN points into
  docs/MECHANISABLE.md. Harness experiments: docs/EXPERIMENTS.md (inherited from pleks).
  Full contract: E:\dev\dev-standards\standards\CLAUDE-MD-STANDARD.md.
-->

## 1 · START HERE

**Repo location.** `E:\dev\nortier\blindly` on this machine — never inside OneDrive (syncing `.git`
and `node_modules` corrupts both). Canon's register records `C:/dev/nortier/blindly` (the laptop's
spelling); canon resolves it, so leave it.

**`E:\dev\dev-standards` IS READ-ONLY FROM THIS SESSION.** **floor** — no mechanism in this repo can
see a write to a sibling checkout, so this is a claim about the world and it is held by you.

Read it freely: the playbooks, the standards, the kit, `ledgers/LESSONS.md`. Write nothing — not the
kit, not `tools/`, not a MANIFEST version, not `ledgers/projects.json`, not `kitAdopted`. Never run
`apply-kit --write` (the dry run is read-only and is the right way to read the plan), except the
`--carry-only --write` upgrade named below, which writes only this tree.

**A finding about canon is worth more than a fix to canon.** Write it to `docs/CANON-FINDINGS.md`
and let the estate session make the change — OBSERVED · COMMAND · WHY IT IS CANON'S · SMALLEST FIX.
A finding carried only in a chat report goes undelivered.

**First moves, before touching code:**

```bash
git status        # never assume this machine is current
git fetch && git log --oneline HEAD..origin/main
git pull
node scripts/sync-secrets.mjs status   # compare the secrets channel, change nothing
```

**The secrets channel.** Git deliberately does not carry `.env.local` or
`.claude/settings.local.json`. They live in `~/OneDrive/dev-secrets/nortier/blindly/` (override:
`BLINDLY_SECRETS_DIR`) and move with `scripts/sync-secrets.mjs`: `status` · `pull` (after a clone,
or when another machine changed a key) · `push` (after YOU change one).
**A machine that has never had the repo:** clone to `E:\dev\nortier\blindly` → `npm install` (by
you, not an agent shell) → `node scripts/sync-secrets.mjs pull` → `npm run check`. There is no
bootstrap installer in the channel yet.

**Session state:** `brief/CURRENT.md`. Read it before asking; it survives compaction.
**Canon's inbox:** `node E:/dev/dev-standards/tools/inbox.mjs blindly` — handovers, kit drift,
tier 0, spines, open lessons. Answer what you owe in `docs/CANON-FINDINGS.md`. The `canon-inbox`
hook prints the short form at session start; a plain upgrade is taken with
`node E:/dev/dev-standards/tools/apply-kit.mjs blindly --carry-only --write`, then the gate, then a
commit.

---

## 2 · WHAT THIS PROJECT IS, AND HOW TO REACH ITS SYSTEMS

An online made-to-measure blinds shop at `blindly.co.za`: a customer configures a blind, pays by
PayFast, and a paid order is emailed to the supplier (Shademaster) as an order form to manufacture.
Built on the Yoros client template, tier `commerce`: Next 16, Supabase, Resend, PayFast, Vercel. The
blinds shop is its own code (`lib/blinds/`, `lib/pricing/`), not the template's `shop`, and most
template features are off in `config/site.ts` but still in the tree (`brief/EVIDENCE.md`).

| System | Reach it by | Note |
|---|---|---|
| Database | `db-inspector` (PostgREST, service key from `.env.local`) | **the one Supabase project, `duhxsnetntkzzgxenccw`, is production** — there is no staging |
| Deploys | Vercel MCP, when connected | every push to `main` deploys |
| Repo | `gh` / GitHub MCP | `github.com/blinddek/blindly` |

---

## 3 · THE GATES

| Gate | Command |
|---|---|
| Before every commit | `npm run check` |
| Before every push | `npm run check` green, then `/walk` on the range |
| Before every deploy | a deploy IS a push to `main` — the push gate is the deploy gate |

**Push policy: `main` only; announce intent, then push.** `bash-gate` asks on every push to `main`.

**Hook-denied** (bash-gate): force pushes and `+refspec`, `npm publish`, agent commits/pushes.
**Hook-asked:** push or merge to `main`, `supabase db push|reset`, `setup-db.sh`, `psql`, hard
reset, `git clean -f`, PR merge.
**Settings-ask twins:** the same patterns in `.claude/settings.json`, dormant while the hook lives.

Approval-gated actions sequence to the **end** of a task. Run the check after each logical change.

---

## 4 · WHERE THE RULES LIVE

| Family | Where |
|---|---|
| ESLint rules | `eslint.config.mjs` (next core-web-vitals + typescript; no custom rules) |
| Audit checks | `npm run check` — `check:hooks`, `check:agents`, `check:brief`, `check:claude-md`, and the four tier-0 tools through `scripts/check-baseline.mjs` |
| Hooks + twins | `.claude/hooks/` + `.claude/settings.json` (`ask` twins) |
| Tests | none — there is no test runner |
| Commands | `/walk` (adversarial pre-push review; does not push) · `/wrap` (end-of-session registers; does not push unasked) |
| Rule files | none |

**The tier-0 tools are baselined, not green.** tsc, eslint, knip and madge run through
`scripts/check-baseline.mjs` against `scripts/baseline/<tool>.json`: a new violation fails, and so
does a fixed one until its baseline is re-emitted (`--emit`) in the same commit. A baseline entry
is owned debt — never fix one inside unrelated work.

**Where a new rule goes — what does it cost the day the model ignores it once?** Annoyance →
prose here. Incident → a hook and/or a check, plus a settings twin at `ask`, plus probes —
**probe first, both directions: a planted violation must fail AND a known-good case must pass.**
If it concerns one file, it goes in that file as a comment.

**Precedence:** mechanisms enforce, they don't assert. Prose contradicting a green check is stale
prose — report it, don't act on it.

### Enforced

- **A push or merge to `main` is a deployment to the live shop and asks first; force pushes are denied.** <!-- @enforced hook:bash-gate:shared -->
- **Nothing runs `supabase db push|reset`, `setup-db.sh` or `psql` without asking — the only database is production.** <!-- @enforced hook:bash-gate:shared -->
- **A subagent writes only its artefact under `.handoff/`, and never commits or pushes.** <!-- @enforced hook:agent-write-scope -->
- **Every spawn names its artefact and asks for nothing inline; `Explore` and `general-purpose` are refused.** <!-- @enforced hook:agent-brief-gate -->
- **A new type error fails the gate** — `next.config.ts` sets `ignoreBuildErrors`, so the build will not catch it. <!-- @enforced check:types -->
- **A new lint error, unused file/export/dependency, or import cycle fails the gate.** <!-- @enforced check:lint check:deadcode check:cycles -->
- **`brief/` stays conformant: every document filed in a role folder and indexed.** <!-- @enforced check:brief -->
- **The context size is in view every turn.** <!-- @enforced hook:context-budget -->

---

## 5 · DOCTRINE THE MACHINE CANNOT HOLD

- **A paid order is a real manufacturing order: the PayFast ITN emails `SUPPLIER_EMAIL` a Shademaster order form.** Never send a test ITN, replay one, or point `SUPPLIER_EMAIL` at the supplier from a non-production environment. **UNENFORCEABLE** — the cost is an email to a third party, which no code artefact in this tree observes.
- **The ITN claims an order atomically (`update … neq paid … select`) before any send, and answers 500 on a failed claim so PayFast retries.** **UNENFORCEABLE** — MECHANISABLE → M-003.
- **Every email send on a request path is awaited or inside `after()` — Vercel drops an un-awaited promise when the response returns.** **UNENFORCEABLE** — MECHANISABLE → M-001.
- **Every `"use server"` export that uses `createAdminClient` checks its caller with `ensureAdmin`, unless it is public by design (contact form, password reset).** A feature flag does not disable a server action. **UNENFORCEABLE** — MECHANISABLE → M-002.
- **A migration in `supabase/migrations/` is not applied until someone applies it by hand in the Supabase SQL editor; nothing in this tree runs DDL.** Record the apply in `brief/EVIDENCE.md`. **UNENFORCEABLE** — the production database is outside the tree.
- **Price matrices are supplier data loaded by the admin import, not code.** Never edit prices in a migration or a seed. **UNENFORCEABLE** — the rows are in the database, which no check reads.
- **`config/site.ts` decides what is live; a brief describing a feature does not.** **UNENFORCEABLE** — a judgement about which document to believe.

---

## 6 · SCARS

- **2026-10-05 · public order data and unguarded service-role writers, found at adoption.** Cost:
  none known — the shop had taken 0 orders. 030 let anon read and insert orders and quotes
  (migration 039, apply pending, gate G-01); the price-import actions and `lib/storage.ts` wrote
  with the service key and no admin check (ca5fef1, a163b0c, 82d5344). Un-mechanised → M-002.
- **2026-10-05 · double-send race in the PayFast ITN.** Cost: none — 0 orders. Select-then-update
  idempotency could send the supplier two order forms for one payment (1437581, 4eeef4d).
  Un-mechanised → M-003.
- **2026-10-02 and 2026-10-04 (nortiercupboards, same template) · dropped email on Vercel.** Cost:
  two real leads there; blindly's contact form had the same code (fixed 2a962c8). → M-001.

---

## 7 · AGENTS

| Agent | For | Access |
|---|---|---|
| `grounder` | Before writing code: map the machinery a task touches | one artefact, hook-scoped |
| `census` | Repo-wide counts / find-all-usages, returned **classified** | one artefact, hook-scoped |
| `db-inspector` | Live-data claims; every answer carries its query | one artefact + GET-only PostgREST against **production** |
| `implementer` | Pre-scoped mechanical transform | declared scope, **main checkout**, never commits |
| `walker` | Adversarial pre-push review — tries to **refute** | one artefact, hook-scoped |
| `scout` | "Go find out X" when no pipeline step fits — replaces `Explore` and `general-purpose` | one artefact, hook-scoped |
| `crawler-doctrine` | Drift between the brief and the build | one artefact |

**"Read-only" is not a thing an agent can be** (E8): `tools:` is a grant, not a fence. What bounds
them is `agent-write-scope`. **Never spawn the implementer with `isolation: "worktree"`** (E10).

Every agent's reply ends with the fixed block — `Agent / Verdict / Summary / Artefact / Promote` —
and the brief names the artefact:

```
pipeline: P3 · step 1 of 1 · artefact: .handoff/<task-slug>/01-scout.md
<the question, and any input artefact to read first>
```

Relay the block; open the artefact only at the section it names. Shared facts the agents use are in
`.claude/agents/_SURFACE.md`. **Classify per site, never sweep.**

---

## 8 · SESSION HYGIENE

**Read the actual source files before writing code.** **Anchor grounding claims** to the SHA read.
**Verify before you tick** — a commit message proves attempt, not landing. **Citations verified,
not plausible** — a zero-hit grep is the check. **Commit ≠ push**: one coherent revertable change
per commit, committed with a pathspec when the operator has work in progress; here a push is also a
deploy. **Ambiguous spec or spec-vs-code conflict:** flag and stop.

---

## 9 · PROJECT SLOTS

**SSOTs — never restate values here:**

| What | File |
|---|---|
| Live features, brand, locales, currency | `config/site.ts` (read flags through `isEnabled`, `config/features.ts`) |
| Blind prices | `price_matrices` rows, read through `lib/pricing/` (`lookup.ts`, `grid.ts`, `markup.ts`) |
| Delivery, VAT, markup settings | `site_settings` rows |
| Payment | `lib/payfast/` (signature, ITN validation); ITN handler `app/api/webhooks/payfast/route.ts` |
| Supplier order form | `lib/blinds/supplier-order.ts` |
| Email | `lib/email.ts` |
| Admin check | `lib/admin/auth.ts` `ensureAdmin` |
| Facts about the live system | `brief/EVIDENCE.md` |

**What does not live in code:**
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS on the production database — every use is a production
  write path.
- `PAYFAST_SANDBOX=true` turns off the ITN source-IP allow-list. Production must be `false` with a
  passphrase (gate G-02).
- `SUPPLIER_EMAIL` unset → a paid order silently does not reach the supplier. `RESEND_FROM` /
  `ADMIN_EMAIL` unset → mail from `noreply@example.com`, admin copies to `admin@example.com`.
- `CRON_SECRET` unset → `/api/cron/daily` is open to any GET.
- `SUPABASE_DB` in the secrets channel is a direct connection string; nothing in the repo reads it.

**Naming:** kebab-case files; `lib/<domain>/{actions,queries}.ts`; public pages are a server
`page.tsx` passing data to a client component.

**Gotchas:**
1. The build specs and the tech sheet say Paystack; the code is PayFast (migration 038).
2. `scripts/setup-db.sh` lists migrations 001–025 only; 026 onward were applied by an unrecorded
   route, and there is no migration-tracking table.
3. `lib/blinds/actions.ts` has 13 unguarded writes and is imported nowhere; do not import it.
4. The booking and portal server actions (`updateClientNotes`, `cancelBookingByCustomer`) trust a
   client-supplied `userId` with the service key. Booking is off here; fix before turning it on.
