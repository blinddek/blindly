# CANON-FINDINGS — what this project owes `dev-standards`

<!-- Kit row `canon-findings`, a TEMPLATE: yours after the copy, and never compared. Modelled on
     pleks's, which opened the first one on 2026-09-10 after a finding carried in a chat report went
     a session undelivered. -->

`dev-standards` is **read-only from this session** (`CLAUDE.md` §1), so anything owed to it is
written here, ready for an estate session to lift **verbatim**. Three things are owed to it, and
each has a section.

**This is an OUTBOX, not a register.** An item leaves when canon files it and drops to **Filed**
with the canon SHA that took it. An empty outbox is the healthy state.

⚠ **Never write "pending" anywhere canon will read.** `LESSONS.md`'s `Applied:` has exactly two
states — a date, or `n/a:` with a reason. A lesson you have not answered is not a value; it is an
open item in this project's queue, and it stays in the `--emit-open` list until it is answered.

---

## 1 · Findings about the method

A defect in canon — a playbook, a standard, a kit file, a check. The portability test decides
whether it belongs here or in this project's own scars: *would it still be true on a repo with a
different stack?*

```
### CF-1 · <the claim, in one line>
OBSERVED   what happened, in one sentence
COMMAND    what you ran, and its output verbatim
WHY IT IS  why it is the method's defect and not this project's
CANON'S
SMALLEST   the narrowest fix, and what it must not break
FIX
```

### CF-1 · Tier 0 asks for four slots but the kit has no way to hold a red tool
OBSERVED   blindly adopted with all four tier-0 tools red (tsc 9, eslint 11, knip 201, madge 7), and
           canon's handover said "whether it passes is your Phase 2 call" — so the project had to
           invent a ratchet, `scripts/check-baseline.mjs` + `scripts/baseline/<tool>.json` (373706a).
COMMAND    node scripts/check-baseline.mjs knip
           🔒 knip: at its baseline (200 owned violations, may only fall)
WHY IT IS  Any repo adopting with legacy debt meets this on day one, whatever its stack; each will
CANON'S    write its own wrapper, differently. And canon's tier-0 detection accepted blindly's slots
           only because the tool names happen to appear in the wrapper's arguments — a match by
           accident, which a renamed wrapper would silently break.
SMALLEST   A kit row carrying a baseline wrapper (fail on growth AND on shrink, so a fix lands with
FIX        its re-emitted baseline; an unparseable tool output fails), and tier-0 detection that
           recognises the wrapper by name rather than by incidental regex. blindly's
           `scripts/check-baseline.mjs` is a candidate. Must not break projects whose tools are green
           and wired directly.

### CF-2 · The Yoros template ships unauthenticated service-role server actions, and three estate projects carry them
OBSERVED   `lib/storage.ts` `uploadFile`/`deleteFile` are `"use server"` exports using the service-role
           client with no caller check — anyone can upload to or delete from any bucket. Fixed in
           nortiercupboards (5d8c906) and blindly (82d5344) on 2026-10-05; **thedecklab still carries
           it**, and its contact form sends email without `after()` (the bug that lost cupboards two
           leads, M-001 there and here).
COMMAND    grep -c ensureAdmin E:/dev/nortier/thedecklab/lib/storage.ts            → 0
           grep -c createAdminClient E:/dev/nortier/thedecklab/lib/storage.ts      → 3
           grep -c "after(" E:/dev/nortier/thedecklab/lib/contact/actions.ts       → 0
WHY IT IS  The defect is in the template every Yoros client project is scaffolded from, so it
CANON'S    recurs per project until it is fixed at the source — and no kit control catches it: a
           "use server" export is a public endpoint whatever its file is called.
SMALLEST   Route a handover to thedecklab (storage guard + contact `after()`), and to yoros for the
FIX        template itself. Then a kit check for Next + Supabase projects: every exported function
           in a `"use server"` file that reaches the service-role client calls an admin/user check
           or sits on an allowlist with its reason (sketched as M-002 in blindly's and cupboards'
           `docs/MECHANISABLE.md`). Must not flag public-by-design actions (contact, password reset).

### CF-3 · An adoption handover named a line that did not exist in this project
OBSERVED   The Session B message told blindly to remove `brief/` from `.gitignore` "(line 45)";
           blindly's `.gitignore` never ignored `brief/`. Nothing broke, but the instruction could not
           be followed as written, and a session following it literally edits the wrong line.
COMMAND    grep -n "brief" .gitignore   → (no output)
WHY IT IS  The handover was written once for several projects (it named blindly and thedecklab
CANON'S    together) and carried one project's line number to the others.
SMALLEST   Derive per-project facts in a handover from that project's tree, or state them as a
FIX        condition ("if .gitignore ignores brief/, remove it").

### CF-4 · `git mv` stages immediately, and a later bare `git commit` sweeps it into an unrelated commit
OBSERVED   34 staged `git mv` renames (the brief filing) went into a one-file security fix, because
           `git commit` takes the whole index. Recovered before any push: soft reset, then commits
           with a pathspec (4eeef4d, a163b0c, a32ca74).
COMMAND    git show --stat 7944d25   (pre-recovery)  → "35 files changed" for a 1-file fix (still reachable by sha)
WHY IT IS  CLAUDE_TEMPLATE §8 says "unrelated concerns split", but nothing says a staged index is
CANON'S    swept, and an agent session that runs `git mv` (or `git rm`) mid-task leaves exactly that
           state. True on any repo.
SMALLEST   One line in CLAUDE_TEMPLATE §8: commit with a pathspec (`git commit -- <paths>`) whenever
FIX        the index may hold anything else; or bash-gate asks on a bare `git commit` whose index
           holds paths outside the files the session edited. Must not block a deliberate full commit.

---

## 2 · Lesson answers

From `node <canon>/tools/check-lessons.mjs --emit-open <project>`. Read the entry before answering.
A date is the day this project's tree came to carry the lesson, with the evidence that shows it; a
reasoned `n/a:` closes an item as surely as a date. "Not yet" is not an answer — leave the lesson
off this table and it stays open.

| Lesson | Answer — `YYYY-MM-DD` or `n/a: <reason>` | Evidence — SHA, path or command |
|---|---|---|

---

## 3 · Kit reports

Adoptions canon has to record in `kitAdopted`, and pins: a row deliberately behind canon, with the
row id, the version held, the reason, and a review date. A pin means *read and deliberately behind*,
never *exempt*, so the reason has to argue it.

**Adopted** (for `kitAdopted`): the full kit at 5bbee43 (2026-10-05); the seven agents a91b802; tier-0
slots d52d18b, baselined 373706a (see CF-1); CLAUDE.md, `check-claude-md` with its ceiling, and
`docs/MECHANISABLE.md` 9f89756; `bash-gate` v10 by `--carry-only` from canon 2ed5909 (7de853b).

**Not a kit row, adopted from a sibling:** `.claude/hooks/context-budget.js` and
`scripts/check-context-budget.mjs`, copied unchanged from nortiercupboards (9f89756), registered on
`UserPromptSubmit` and probed in `check:hooks`. If canon has a row for these, record it; if not,
this is a second project carrying them outside the kit.

**Optional rows declined** (not pins — not taken, with the reason):
- `build`, `verify-spec` — blindly's build specs (`brief/build/01..29`) are a filed historical record of
  a shop already built, frozen 2026-02-26; nothing is built from them now. Review 2026-11-05.
- `dates`, `dates-test` — blindly's only calendar value is the order date printed on the supplier form;
  booking, which would need it, is off. Revisit if booking is turned on.

---

## Filed

A pointer, not a restatement — the canon entry is the record.

| # | Item | Filed as | Canon SHA |
|---|---|---|---|
