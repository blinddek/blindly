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

### CF-5 · bash-gate v10 loosened three verdicts and declares none of them
OBSERVED   Taking v10 by `--carry-only` (7de853b), the differential against blindly's v9 finds three
           cases that were deny and are now allow, with no entry in v10's LOOSENED table.
COMMAND    git show 7de853b^:.claude/hooks/bash-gate.js > v9.js
           node .claude/hooks/bash-gate.probe.mjs --against v9.js
           ✗ against: LOOSER: "v10: a grep pattern holding `|` is a pattern, not a pipe into a command" was deny and is now allow, and this version does not say why
           ✗ against: LOOSER: "v10: a quoted `;` in an echo is text" was deny and is now allow, and this version does not say why
           ✗ against: LOOSER: "v10: a quoted pattern, then a pipe into a sink" was deny and is now allow, and this version does not say why
           ⇄ … 234 cases through both gates — 3 looser (0 declared), 0 stricter
           (run from a 7de853b checkout of hook, probe and config. At HEAD it reads 239 cases and
           4 stricter. Those 4 are blindly's own DB asks from 824c8ec, not v10's.)
WHY IT IS  The three read as deliberate fixes of false denies, but canon's own differential (CF-9's
CANON'S    shape) says a loosening is declared by the version that makes it; every project taking
           v10 inherits three undeclared loosenings, and a project cannot declare canon's in its
           own `loosened` region, which is for its own.
SMALLEST   Three LOOSENED entries in canon's v10 probe, each with its reason. Must not change a verdict.

### CF-6 · bash-gate matches command names case-sensitively and without `.exe`, so on win32 every canon rule is bypassed by spelling
OBSERVED   On this machine (Windows, Git Bash) `GIT push --force origin main`, `git.exe push --force
           origin main`, `rm.exe -rf /*` and `Git.EXE -c alias.q='!rm -rf /*' q` are all ALLOW
           under v10 and v11. Git Bash resolves `GIT`, `Git.EXE` and `git.exe` to
           /mingw64/bin/git.exe, and `rm.exe` to /usr/bin/rm.exe. The force-push fallback twins
           (`Bash(git push --force *)`) do not match these spellings either, so "force pushes are
           denied" does not hold for them.
COMMAND    printf '%s' '{"tool_name":"Bash","tool_input":{"command":"git.exe push --force origin main"}}' \
             | node .claude/hooks/bash-gate.js      → no deny
           GIT --version                            → git version … (the spelling runs)
WHY IT IS  `atCommand`, `GATED_NAMES` and `isGit` live outside every KIT:CONFIG region. Every
CANON'S    project on win32 (or on any case-insensitive filesystem, such as macOS by default) has the
           hole. A project rule built on `atCommand` inherits it too: blindly's `psql` rule does.
SMALLEST   Normalise the command word once, in `commandWordIndex`'s consumers: take the basename,
FIX        lowercase it, strip a trailing `.exe`. Probe both directions: `git.exe push --force`
           and `GIT push -f` deny; `git.exe status` allows. (Source: .handoff/walk-kit-v11/01-walker.md
           finding 1.)

### CF-7 · v11's "a string git runs is a command" misses three neighbours, and its NOT COVERED list names none of them
OBSERVED   ALLOW under v11 (and v10):
           - `env -i GIT_SSH_COMMAND='rm -rf /*' git fetch` and `sudo GIT_SSH_COMMAND='rm -rf /*' git
             fetch`. `envStrings` reads an assignment only at segment start or after a bare
             `export`/`env`, so a wrapper or an option stops it. The bare form is DENY.
           - `git -c protocol.ext.allow=always fetch 'ext::sh -c rm% -rf% /*'`: the `ext::`
             transport runs its URL as a command. The verdict is reproduced; the execution rests on
             git's docs and was not run.
           - `SSH_ASKPASS=…` (not `GIT_`-prefixed), and `GIT_SSH_COMMAND="$(echo rm -rf /*)"`.
COMMAND    each payload piped to `node .claude/hooks/bash-gate.js` (walker's battery,
           .handoff/walk-kit-v11/01-walker.md findings 2–3)
WHY IT IS  v11's header claims "the environment that sets them". A project reading that believes
CANON'S    the wrapper forms are covered. The fix is in canon's own code.
SMALLEST   Scan assignments after `commandWordIndex`'s wrappers as well as before them; treat an
FIX        `ext::` argument as a command string. Or, at the least, add all three to NOT COVERED.

---

## 2 · Lesson answers

From `node <canon>/tools/check-lessons.mjs --emit-open <project>`. Read the entry before answering.
A date is the day this project's tree came to carry the lesson, with the evidence that shows it; a
reasoned `n/a:` closes an item as surely as a date. "Not yet" is not an answer — leave the lesson
off this table and it stays open.

| Lesson | Answer — `YYYY-MM-DD` or `n/a: <reason>` | Evidence — SHA, path or command |
|---|---|---|
| L-03 | 2026-10-05 | scripts/check-claude-md.mjs:973 "Extend to the END of the bullet, not a fixed 3-line window"; fixture :1017; Grep `slice(i, i+N)`/`[i+N]` over scripts + hooks → only argv/token lookahead, no line window (9f89756) |
| L-04 | 2026-10-05 | check-claude-md.mjs:863 "must parse or fail LOUDLY", :872 `unparseable @enforced tag (registers no claim)`, fixture :1012 plants `<!-- @enforced eslint -->`; `npm run check:claude-md` exit 0 |
| L-05 | 2026-10-05 | `node scripts/a-paths.mjs`: 9 occurrences of `@enforced`, 8 marker lines; check-claude-md prints `7 of 15 rules UNENFORCEABLE (8 @enforced)`: rules, not strings |
| L-06 | 2026-10-05 | check-claude-md.mjs:1051-1054 comment + `mkdtempSync` fixtures written to disk and run through real discovery (:1600-1610); hook probes send JSON on the hook's real stdin (bash-gate.probe.mjs:80-96) |
| L-07 | 2026-10-05 | check-claude-md.mjs:1917 "every marker resolves"; resolver fixtures :1172-1200 plant an orphan check/hook that must NOT resolve; check-hook-registration.mjs:511 "registration pointing at a MISSING file fires"; M-pointers resolve against tracked docs/MECHANISABLE.md; a-paths.mjs: 25 CLAUDE.md paths resolve, the 10 that do not are canon-side, the secrets channel, or bare filenames inside a named dir |
| L-08 | 2026-10-05 | CLAUDE.md:131-137 every §5 bullet ends `**UNENFORCEABLE**` + reason; check-claude-md exit-path fixture "the same tree with one untagged bullet fails" ✓; ratchet `N at its ceiling (7)` (scripts/check-claude-md.ceiling.json). See L-15 for the one inverted claim at :86 |
| L-09 | 2026-10-05 | `ls .claude/rules` → no such directory; CLAUDE.md:101 `Rule files \| none`; :107-110 placement rule (incident → hook/check + twin + probes); docs/EXPERIMENTS.md:15 E1b |
| L-11 | 2026-10-05 | Populations derived from disk, none hand-listed: check-hook-registration.mjs:313 `readdirSync(hookDir)`, check-commands.mjs:271, check-handoff-contract.mjs:126, check-brief.mjs:155, agent-distribution.mjs:140 (5bbee43, a91b802) |
| L-12 | 2026-10-05 | `git status --ignored --porcelain` → only `.claude/.context-budget.state.json`, `.env.local`, `.handoff/`, `tsconfig.tsbuildinfo` ignored (each a generated file or the secrets channel, `git check-ignore -v` names the rule) and untracked `project_brief/customcolor/`, which no tool reads (G-06, brief/GATES.md:17); `docs/MECHANISABLE.md`, hooks, scripts, baselines all in `git ls-files` |
| L-13 | 2026-10-05 | CLAUDE.md:185 "Anchor grounding claims to the SHA read"; every agent artefact opens with an anchor line; check-handoff-contract.mjs:43-47 reads the anchor commit; `npm run check:agents` → "10 artefact(s) carry a well-formed contract block" |
| L-16 | 2026-10-05 | Plant/known-good on a copied tree (a-l16.mjs): intact → `exit=0 … every rule has its fallback`; `Bash(psql *)` removed from settings → `exit=1 … PROJECT_ASK[2] is backed by Bash(psql *), which is in neither permissions.deny nor permissions.ask` (check-hook-registration.mjs:175; 5bbee43) |
| L-19 | 2026-10-05 | `node E:/dev/dev-standards/tools/check-agent-spines.mjs` → `7 spine(s) × 7 project(s) — 42 verified, 0 pinned, 0 not verified` (blindly resolved); `grep SPINE: .claude/agents/*.md` shows contract v1 + one role spine per agent; project evidence in .claude/agents/_SURFACE.md (a91b802) |
| L-20 | n/a: no step of the gate skips work | `grep -e --cache -e "git diff" -e --cached -e only-changed package.json eslint.config.mjs` → 0 hits (one comment word in check-baseline.mjs:33); `ls -a \| grep eslintcache` → none; no .github, .husky or non-sample .git/hooks, core.hooksPath unset; package.json:10 `check` runs every step; only cache is tsconfig.json:15 `incremental` under `tsc --noEmit` (compiler's own graph) |
| L-21 | 2026-10-05 | .claude/agents/walker.md:116-121 step 3 "The other sites … find every other place that answers the same question … Verify both ends of a deliberate asymmetry" (a91b802); mechanisation is sketched, unbuilt (M-002) |
| L-23 | 2026-10-05 | Reasons sit where the decision lives: knip.jsonc `ignoreDependencies` each name their route (e.g. `"madge" // run from node_modules/.bin by scripts/check-baseline.mjs`); bash-gate.config.mjs:48-49 explains `develop`; check-hook-registration.mjs:130-133 rejects a placeholder `noTwin` reason; brief/DECISIONS.md rows (09cf1f9) |
| L-24 | 2026-10-05 | bash-gate.probe.mjs:300-322 checks PROTECTED_BRANCH against `refs/remotes/origin/HEAD`, which the config did not write; planted `master` in a copied tree (a-l24.mjs) → `✗ PROTECTED_BRANCH is "master" but the remote default is "main"` exit 1; intact → `234 probes pass`; `git symbolic-ref refs/remotes/origin/HEAD` → origin/main (5bbee43) |
| L-28 | n/a: no gate is conditional on a diff or lifecycle stage | `grep -rnE "git (diff\|ls-files\|status\|log)\|--cached" scripts .claude/hooks` → only `ls-files`/`log`/`show` reads (whole tree, not a stage window) + probe payload strings; `ls -a .git/hooks` → samples only; `git config core.hooksPath` → unset; no `.github`, no `.husky` |
| L-32 | 2026-10-05 | `scripts/sync-secrets.mjs:43` (459dfc3); probe from a dir named `OneDrive-probe` → `REFUSED: this checkout is inside OneDrive.` exit 1; real cwd `/e/dev/nortier/blindly` → exit 0 |
| L-33 | n/a: no project-authored instrument pre-processes its input by stripping comments or literals | `grep -nE "replace\(\|stripComments\|blank" scripts/check-baseline.mjs scripts/check-context-budget.mjs scripts/sync-secrets.mjs .claude/hooks/context-budget.js` → 3 hits, none strip comments or literals (a BOM, a `.jsonl` suffix, a date format). Kit-owned normalisers (e.g. `check-claude-md.mjs` `blankFences`) are canon's |
| L-34 | n/a: no probe invokes anything that reaches the gate | `grep -rnE '"npm"\|npm run\|npx' scripts/*.mjs .claude/hooks/*` → only strings inside payloads/fixtures. Every `spawnSync` call (full list in worksheet) spawns a hook with a synthetic payload, a check's own file on a temp root, git in a temp repo, or a tier-0 binary |
| L-35 | n/a: no name-grep classifier of symbol use exists; the dead-code gate is the analyser itself | `scripts/check-baseline.mjs:49-56` builds the knip baseline from `knip --reporter json`; `grep -nE "unused\|orphan\|referenced" scripts/check-baseline.mjs scripts/check-context-budget.mjs` → only a header sentence. The burn-down of the knip baseline has not started |
| L-36 | 2026-10-05 | spines carry per-role budgets (`census.md:100` 150, `db-inspector.md:101` 40 "n=1, a first value", `grounder.md:101` 150, `implementer.md:102` 250, `scout.md:101` 80, `walker.md:98-101` 150); `node scripts/agent-distribution.mjs` → per-type table, "no budget overruns", "re-measure trigger at 20 TOP-LEVEL runs … 14/20"; script added a91b802 |
| L-38 | 2026-10-05 | `node .claude/hooks/agent-write-scope.probe.mjs` → `✅ 145 agent-write-scope probes pass (31 derived from your 7 agent(s) … subagent denied, subagent allowed, main session untouched)`; registered at `.claude/settings.json:110` (5bbee43); `CLAUDE.md` §7 "`tools:` is a grant, not a fence (E8)" |
| L-40 | 2026-10-05 | `npx eslint scripts .claude/hooks -f json` → 23 files, 0 errors, 0 warnings, and `eslint.config.mjs` ignores neither; `knip.jsonc` `project` includes `scripts/**/*.mjs` and `.claude/hooks/**`; `node scripts/check-claude-md.mjs` → "every marker resolves" on the doctrine file itself. Boundary: tsc reads `.ts/.tsx` only and madge reads `app components lib`, so `.mjs` instruments sit outside those two gates; no whole-tree survey of every control was run |
| L-41 | 2026-10-05 | `scripts/check-handoff-contract.mjs:339-372` `tell()` (5bbee43); `node scripts/check-handoff-contract.mjs` → `L-41 · 10 artefact(s) measured, 215 citation(s) resolved, 3 edited during their run` with three `⚑ QUARANTINED` lines; selftest "a cited file edited INSIDE the run is QUARANTINED" passes; wired through `check:agents` |
| L-45 | 2026-10-05 | `.claude/hooks/context-budget.js:198-221` (9f89756) records the cardinality rule where it reads `permissionMode`; rerun here: `grep -rho '"permissionMode":"[A-Za-z]*"' --include=*.jsonl ~/.claude/projects \| sort \| uniq -c` → `593 acceptEdits`, `3 auto` (2 values, 10 transcripts); `agent_type` was observed live (this run was bounded by it) |
| L-49 | 2026-10-06 | `scripts/check-baseline.mjs` tsc branch cross-checks the parse against the exit status (661c87a). Probe: a `tsc` that prints garbage and exits 2 → before `at its baseline (0)`, exit 0; after `❌ tsc: output did not parse`, exit 1; real tree still `9 owned violations` |
| L-50 | 2026-10-05 | `grep -rnE "\b(ok\|assert)\(.*\|\|" scripts .claude/hooks` → 1 hit, `check-context-budget.mjs:237`, an OR over fixture output with the exact count pinned on the next line; empty `catch {}` → 0; single-line `for … ok(` → 0; `ok(<live>.length … ‖/&&)` → 8 hits, all `&&` joining two fixture results. Known-good: the same pattern fires on a planted `ok(Object.keys(ALLOW).length === 0 \|\| …)` |
| L-52 | n/a: no exemption predicate exists to key on text | `grep -rn "getText(" scripts .claude/hooks eslint.config.mjs` → 0; `ls eslint-rules` → absent; `eslint.config.mjs` sets one stock rule's options. M-002's sketch ("calls `ensureAdmin`/`requireAdmin`/`getUser`") is text-keyed and unbuilt: resolve the binding when it is built |
| L-53 | n/a: no control reads another control's baseline | baselines are `scripts/baseline/<tool>.json`, read only at `check-baseline.mjs:~108`; `grep -rnE "baseline/\|ceiling\.json" scripts .claude/hooks` outside that file with a read call → 0 |
| L-56 | 2026-10-05 | `.claude/commands/walk.md:15,22` (5bbee43): "Spawn the walker in the background", "While it runs, send the claims out — all in ONE message… one `db-inspector` per live-data claim, one `census` per pattern claim". `git grep -i -E "while you\|should be\|is expected\|ideally\|in parallel" -- CLAUDE.md` → 0 |
| L-57 | 2026-10-05 | `.claude/hooks/bash-gate.js:72-75,1099-1107`; run: `echo '"x"' \| node .claude/hooks/bash-gate.js` and `echo 'not json' \|…` → both `permissionDecision":"ask"… failing to a prompt, not to silence`; `scripts/check-baseline.mjs:63-69` unparseable output exits 1, never empty |
| L-58 | n/a | no tree-rebuild-from-recorded-writes tool: `git grep -n -i -E "GIT_INDEX_FILE\|rewind\|tree-snapshot\|reconstruct\|replay" -- scripts .claude .githooks CLAUDE.md` → 7 hits, none a reconstruction (bash-gate prefix replay, context-budget cost tail) |
| L-59 | n/a | blindly runs no experiment arms or blind probes: `docs/EXPERIMENTS.md:3-4` "This project runs none of its own yet"; `git grep -n -i -E "blind probe\|tell count\|\barms?\b.{0,20}(experiment\|probe)" -- scripts .claude docs brief CLAUDE.md` → 0 |
| L-60 | 2026-10-05 | `.claude/agents/walker.md:137-148` (a91b802): step 9 "Reproduce before you report", `REPRODUCED`/`UNREPRODUCED`, "Mark, never drop" |
| L-61 | n/a | no before/after quality comparison of an intervention: `git grep -n -i -E "pre-?regist\|before.{0,15}after" -- docs brief scripts .claude CLAUDE.md` minus prose "before every/the…" → 4 hits (a UI toggle in a build spec, a kit comment, a fixture, delivery-report id diff), none a quality measure |
| L-62 | 2026-10-05 | `.claude/hooks/agent-write-scope.config.mjs:93` `"crawler-doctrine": []` (header :40-47 names L-62); `:83` "NOT A WORKTREE"; `CLAUDE.md:168` never `isolation: "worktree"`; `ls .claude/crawlers` → absent |
| L-63 | 2026-10-05 | the readers ship with the formats: `package.json:16` (`check-handoff-contract.mjs` + `--selftest`), `:17` (`check-hook-registration.mjs`), both from `git log -S` → a91b802 / 5bbee43; depth cap `.claude/settings.json` `env.CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH: "2"` landed 5bbee43, before the census `Agent` grant (a91b802); `check-handoff-contract` → `10 artefact(s) carry a well-formed contract block` |
| L-65 | n/a | blindly was not greenfield, no control deferred for want of code: `git log --reverse` first commit e1d2d42 2026-02-26 scaffold; 225 files under `app lib` at 459dfc3, before kit 5bbee43 (2026-10-05); `git grep -n -i -E "nothing to govern\|no codebase" -- CLAUDE.md docs brief .claude` → 0 |
| L-66 | 2026-10-05 | agents existed before registration: blindly a91b802 `2026-10-05T17:12+02` vs canon 2ed5909 "register blindly" `20:24+02`; `node tools/check-agent-spines.mjs` (canon) → `7 spine(s) × 7 project(s) — 42 verified, 0 pinned, 0 not verified`; `grep -i blindly` on its not-visible lines → 0 |
| L-67 | 2026-10-05 | no second copy of the contract vocabulary: `git grep -n -E "✅ proceed\|⚠️ decision\|⛔ stop\|Verdict +[✅⚠⛔]\|Proceed ·\|Decision needed" -- CLAUDE.md docs brief .claude/commands .claude/agents/_SURFACE.md` → 0; `CLAUDE.md:170` five labels = `scripts/check-handoff-contract.mjs:86` `LABELS`; glyph set read off spines (`:29-33,93`) |
| L-69 | 2026-10-05 | `CLAUDE.md:19` "`E:\dev\dev-standards` IS READ-ONLY FROM THIS SESSION", findings to `docs/CANON-FINDINGS.md` (added 5bbee43); landed 9f89756 via `git log -S` |
| L-70 | 2026-10-05 | `package.json:10,12,13,18,19` all four slots in `check`; `node scripts/check-baseline.mjs {tsc,knip,madge,eslint}` → `at its baseline (9/200/7/11 owned violations)`; canon `check-tier0` → `4 slots × 7 project(s) gated, 0 not visible`; wired d52d18b, baselined 373706a |
| L-71 | 2026-10-05 | PowerShell tool denied: `.claude/settings.json` `permissions.deny[0]="PowerShell"` (5bbee43); `git grep -l -e 'â€' -e 'Â§' -e 'âš' -e 'Ã©'` → 0 files; `git ls-files '*.ps1'` → 0; `scripts/sync-secrets.mjs:111` moves bytes (`copyFileSync`). Caveat: the editor-tool-only rule is not stated in `CLAUDE.md` §8 |
| L-73 | n/a | no check derives its population from build output: `git grep -n -E "\.next/\|prerender-manifest\|app-path-routes-manifest\|dist/\|build-manifest" -- scripts package.json .githooks .claude` → 2 hits, both agent "skip `.next/`" lists (`census.md:196`, `scout.md:169`) |
| L-74 | n/a | blindly has no test suite for a defence-vs-precedence pair to live in: `git ls-files \| grep -c -E '\.(test\|spec)\.\|__tests__'` → 0; no vitest/jest/playwright in `package.json`; `CLAUDE.md` §4 "Tests: none". The underlying bug class in non-test code was not audited |
| L-75 | 2026-10-05 | `@kit bash-gate v9` at 5bbee43 (token-at-position; now v10, 7de853b). Run today (`scratch/c-probe-l75.mjs`): `\rm -rf /` deny · `rm -rf /"*"` deny · `git push -f` deny · `git -C dir push --force` deny · `rm -rf .next && du -sh /` allow · `fetch … && push origin feature/x` allow · `--force-with-lease` allow · commit message quoting `rm -rf /` allow · `awk 'BEGIN{print "rm -rf /"}'` allow · `push origin main` ask |
| L-76 | 2026-10-05 | `scripts/check-claude-md.mjs:454` `blankFences`, applied `:827,:831` and on the metric path; `--selftest` → `METRIC — a fenced @enforced EXAMPLE does not inflate D (got 1, want 1)`, `METRIC — an @enforced rule OUTSIDE the rules sections still counts toward D`; wired 9f89756 |
| L-77 | 2026-10-05 | blindly holds no kit pins; its value-carrying exemptions are the tier-0 baselines (373706a). Probe (`scratch/c-probe-l77.mjs`): baseline entry `gone.ts TS1:1` with the tool reporting nothing → `exit=1 … no longer occur`; empty baseline, same tool → `exit=0` |
| L-79 | 2026-10-05 | bash-gate adopted with its regions marked: `git show 5bbee43:.claude/hooks/bash-gate.js \| grep -c KIT:CONFIG` → 12; `node E:/dev/dev-standards/tools/apply-kit.mjs blindly --carry-only` (dry, from blindly) → 21 `= identical`, 0 `review`, `0 file(s) would be written` |
| L-80 | 2026-10-05 | `package.json:10` `check` opens with `node scripts/check-install-platform.mjs`; run → `install-platform: node_modules matches this platform (win32, 122 .cmd/.ps1 shim(s))`; wired c31985b |
| L-81 | 2026-10-05 | `scripts/check-claude-md.mjs:467-480` chain follower (v17); blindly's gate is two-level (`check` → `check:brief` → `node scripts/check-brief.mjs`) and `node scripts/check-claude-md.mjs` → `every marker resolves`; selftest `RESOLVER — KNOWN-GOOD: a check script reachable from npm run check resolves` |
| L-83 | 2026-10-05 | `node scripts/check-brief.mjs --selftest` → `✓ --status writes a STATUS.md that does not assert its own absence`, `✓ …placeholder never survives`. Spawn probe at `scripts/check-brief.mjs:904-913`, v9, adopted 5bbee43. |
| L-84 | 2026-10-05 | Every routing destination exists (`brief/DECISIONS.md`, `brief/CURRENT.md`, `docs/MECHANISABLE.md`, `docs/CANON-FINDINGS.md`). `node scripts/check-brief.mjs .` → `B-9 6 spine files … nothing unfiled`. `node scripts/check-claude-md.mjs` → `every marker resolves`. |
| L-86 | 2026-10-05 | `agent-write-scope.probe.mjs:30` and `.js:102` import `agent-write-scope.config.mjs`. `node .claude/hooks/agent-write-scope.probe.mjs` → `145 probes pass (31 derived from your 7 agent(s)…)`. `SAMPLE_IDS` at `check-claude-md.mjs:107`. |
| L-89 | 2026-10-05 | `agent-write-scope.probe.mjs:46` `const CWD = "/synthetic-root/project"` is canon's default. Region-diff script: 16 of 20 regions code-identical to canon's default, the other 4 carry project values. |
| L-90 | 2026-10-05 | `check-claude-md.mjs:176-177` `CANON_NAMESPACES`/`KNOWN_NAMESPACES` are declared outside the `resolvers` region. v17 ≥ v13. The region diff against canon shows no declaration in it. `--selftest` passes. |
| L-91 | 2026-10-05 | `check-claude-md.mjs:90` `/^### (M-(?:KIT-)?\d{2,3}[a-z]?)/gm` and `:91` `POINTER` carry the suffix, the standard's form. |
| L-93 | n/a: no adopted optional row | `ls lib/dates* .claude/commands` → no `lib/dates*`, only `walk.md` `wrap.md`. `node tools/apply-kit.mjs blindly` → `? optional` for `build`, `verify-spec`, `dates`, `dates-test`, none `= identical`. |
| L-94 | 2026-10-05 | `.claude/package.json` `"type":"module"`, tracked in 5bbee43. `grep '"type"' package.json` → none. `echo '{}' \| node .claude/hooks/agent-write-scope.js 2>&1` → JSON only, no `MODULE_TYPELESS_PACKAGE_JSON`. |
| L-96 | 2026-10-05 | `for f in scripts/*.mjs .claude/hooks/*.probe.mjs; grep -q $f package.json` → 14 WIRED, 1 UNWIRED (`sync-secrets.mjs`, a tool, not a check). Wired at 5bbee43. `node scripts/check-hook-registration.mjs` → `every hook is registered`. |
| L-97 | 2026-10-05 | Module kind declared on day zero: `.claude/package.json` (5bbee43), `check-context-budget.mjs` imports the hook by `await import`. Hooks load clean (L-94 run). |
| L-98 | 2026-10-05 | `git check-ignore --no-index -v $(git ls-files .claude scripts brief docs)` → no output, rc=1 (none ignored). `.claude/package.json` tracked, 5bbee43. `.gitignore:52-56` ignores only local state. |
| L-99 | 2026-10-05 | The printed remedy was run: `node scripts/check-baseline.mjs <tool> --emit` for tsc, eslint, knip, madge → each `emit==baseline: true`. `lib/supabase/types.ts` and `brief/STATUS.md` (`README.md:20`: never hand-edited) are named by no text as hand-editable. |
| L-103 | n/a: no test runner | `grep -n "vitest\|jest\|node --test\|mocha\|\"test\"" package.json` → none. `find . -name "*.test.*"` (outside node_modules) → none. |
| L-104 | 2026-10-05 | `node .handoff/canon-lessons/scratch/d/l104.mjs` (the five payloads through `bash-gate.js`) → deny, deny, deny, deny, allow (the known-good). 5bbee43 held v9 ≥ v8, where the fix landed. 7de853b is v10. |
| L-105 | n/a: no gate stamp | `git config core.hooksPath` → empty. No `.githooks`/`.husky`. `grep -rin "gate-ok"` over scripts, .claude, CLAUDE.md, package.json → none (only `spine=` anchor stamps in `check-handoff-contract.mjs`). |
| L-107 | 2026-10-05 | `scout.md:112,123` (spellings tried, `Not found`). `census.md:107` (known positive). `grounder.md:127`. `walker.md:134`. Installed a91b802. |

Measured 2026-10-06 at 661c87a/824c8ec: every ledger entry read whole, each answer measured in this tree; 68 answered (52 dated, 16 n/a). Probes named `scratch/…` lived under the gitignored `.handoff/canon-lessons/` and are not kept; every other command reruns from a clean checkout.

**Still open — deliberately not answered** (39), each with what is missing:

- **L-01** — CLAUDE.md:110 carries probe-first; the entry's absolute rule (no path/glob/regex through a shell string) is nowhere: Grep `shell string\|node -e\|backslash\|heredoc` over CLAUDE.md, .claude/agents, .claude/commands, docs, brief → 0 hits
- **L-02** — docs/EXPERIMENTS.md:8-16 maps premises to dependents, but the one premise that fell here (twins "dormant") is still stated at CLAUDE.md:86 against settings.json:34 and bash-gate.js:170; no sweep recorded
- **L-10** — Enumerations carry zero-guards only (check-hook-registration.mjs:315 "empty … not a pass"; check-claude-md.mjs:968), no realistic floor against `git ls-files`; the only real floors are incidental (non-empty tier-0 baselines fail when a tool finds nothing)
- **L-14** — 824c8ec gates `supabase@<ver>`, flags before `db`, and any command naming `api.supabase.com` or `SUPABASE_ACCESS_TOKEN`; a script that reads the token from `.env.local` itself is still not gated at the point the statement is written
- **L-15** — CLAUDE.md:86 "Settings-ask twins … dormant while the hook lives" is the inverted model canon corrected 2026-09-11; bash-gate.js:170 and .claude/settings.json:34 in the same tree say twins are live
- **L-17** — Only the second rule is carried: "Never report a signal you cannot observe" (walker.md:44, census.md:44, in the contract block). "Ask for transcription, never a report" is nowhere: grep `transcri` in CLAUDE.md, .claude/agents, docs → only unrelated `transcript` (db-inspector.md:176, context-budget.js)
- **L-18** — No refused mechanisation carries its measurement: the four non-MECHANISABLE §5 reasons (CLAUDE.md:131, 135-137) are one-clause judgements with no count; docs/MECHANISABLE.md holds sketches (M-001..003), not measured refusals
- **L-22** — `sendEmail` returns `{success:false,error}` and never throws (lib/email.ts:104,141); grep of call sites: 16 of 22 discard the result, e.g. app/api/webhooks/payfast/route.ts:98 customer confirmation, :355 admin notice; only 6 read it (payfast:339, campaign-process:329/590, drip-emails:356, campaigns/actions:360, email-template-actions:84)
- **L-25** — scripts/setup-db.sh is a tracked 360-line bash runner of production migrations (`git ls-files '*.sh'`), so the subject exists; the don't-edit-while-running rule is not stated in the tree. Nothing automated runs it (hook commands are all `node`, no git hooks installed), so the exposure is low
- **L-26** — .claude/commands/walk.md:14-22 runs a `walker` in the background beside `db-inspector`/`census` in one checkout; `grep -i serialis` over CLAUDE.md, .claude, docs, brief → 0 hits, so nothing says the toolchain is occupied while a gate runs
- **L-27** — scripts/baseline/ was seeded from the first run unclassified (373706a: "Seeded from the tree at adoption: tsc 9, eslint 11, knip 201, madge 7"); brief/EVIDENCE.md:20 records the count; no entry carries a verdict; scripts/baseline/knip.json has 144 export entries with no reason
- **L-29** — `CLAUDE.md:223` and `:225` state tree observations in the present tense ("lists migrations 001–025 only", "has 13 unguarded writes and is imported nowhere")
- **L-30** — `grep -niE "hypothesis\|diverg\|vantage" docs/MECHANISABLE.md CLAUDE.md` → 0 hits; the header says an entry "holds the sketch", with no divergence rule
- **L-31** — writer/reader pairs exist and share nothing: `lib/payfast/client.ts:65` `generateSignature` vs `lib/payfast/webhooks.ts:74` `verifyRawSignature` (reader hardened in 9877ca1); `app/api/track/click/route.ts` is a forwarder with no writer; no round-trip test (`git ls-files \| grep -E "\.test\.\|\.spec\."` → none)
- **L-37** — the only reconciliation control is `scripts/check-baseline.mjs` (baseline JSON vs live tool run); nothing in the tree records what its two sides share, and the lesson's mutation was not run (see worksheet)
- **L-39** — `grep -rniE "turn boundary\|next turn\|nonce\|takes effect" CLAUDE.md docs .claude/agents brief` → 0 hits; the E-table in `docs/EXPERIMENTS.md` inherits E1b/E2/E3/E7/E8/E10 and omits E9
- **L-42** — `grep -rn "L-42" CLAUDE.md .claude brief/*.md docs` → 0; nothing says a spec's "does" is intent or that a ruling asserting code behaviour cites its site. Nearest: `CLAUDE.md` §5 last bullet (feature flags only) and §8 "spec-vs-code conflict: flag and stop"
- **L-43** — `CLAUDE.md:186-187` "a zero-hit grep is the check" has no change-the-method or absence-claim clause; `walker.md:137-141` "Reproduce before you report" re-runs the original instruments
- **L-44** — `grep -rniE "mutat" CLAUDE.md docs/*.md .claude/agents .claude/commands` → 1 hit (`db-inspector.md:106`, DB writes, other sense); `CLAUDE.md` §4 has probe-both-directions and no "then mutate the guard"
- **L-46** — `eslint.config.mjs:20,21,24,25` ignore `out/**`, `build/**`, `temp_folder_*/**`, `todo/**`: `ls -d out build temp_folder_* todo` → none exist, `git ls-files` under them → 0; no check re-reads ignores. Measured the other way: nothing under `.claude/` or `scripts/` is ignored
- **L-47** — `CLAUDE.md:145` "migration 039, apply pending, gate G-01" is open-work in the present tense; G-01 is open today (`brief/GATES.md:14`), and its closing act (a Management API apply, recorded in `EVIDENCE.md`) is a diff that touches no CLAUDE.md. Scars carry no "→ narrative at <site>"
- **L-48** — `grep -rlE createAdminClient app lib components` → 44 files hold the service-role client; M-002 (`docs/MECHANISABLE.md:26`) is a door-policing sketch with no only-path assumption named and no "make it unavailable" option. Partial carry: kit `agent-write-scope` v6 parity (probe line above: "38 Write-vs-Bash parity")
- **L-51** — `grep -rn "check-baseline" scripts .claude package.json` → only the four `package.json` entries; the script has no selftest and nothing spawns it, so its `exit(1)` paths are on no probe
- **L-54** — `grep -rniE "mutant\|mutation" CLAUDE.md docs/*.md .claude/agents` → nothing on diff-derived mutants; no mutation record exists for any gate here
- **L-55** — `check-baseline.mjs` had no planted probe and read a tsc crash as clean (L-49): a green result went uninterrogated. Fixed for that one case; no standing probe (L-51, L-82)
- **L-64** — only a kit `_comment` at `.claude/settings.json:30` says "Restart (L-64)"; `git grep -n -i -E "session start\|restart\|mid-session\|launch" -- CLAUDE.md docs brief` → nothing about hooks loading at session start or the launch folder
- **L-68** — `git grep -n -i -E "standing authoris\|authoriz\|AgentTool\|deep-research\|unless the user requested" -- CLAUDE.md brief docs .claude/agents/_SURFACE.md .claude/settings.json` → only an unrelated `Authorization: Bearer` line in a Paystack build spec
- **L-72** — credential-minting on session alone: `lib/auth/actions.ts:222-244` `updatePassword` calls `supabase.auth.updateUser({password})` with no `getUser`, no current-password or recent-auth check; reachable from `components/admin/admin-account-form.tsx:127` and `components/portal/account-form.tsx:345`. Not in `CLAUDE.md` §5 or `docs/MECHANISABLE.md`
- **L-78** — two shipped selftests exist, pass by hand, and nothing runs them: `node scripts/check-hook-registration.mjs --selftest` → `probes green`, `node scripts/check-install-platform.mjs --selftest` → `probes green`; `package.json:10-19` invokes neither with `--selftest`; no `.github/`, no `.githooks/`
- **L-82** — `grep -c "selftest\|KNOWN-GOOD" scripts/check-baseline.mjs` → 0. blindly's only own check has no known-good fixtures.
- **L-85** — No blindly-authored rule has a narrowed grain or a recorded narrowing. `scripts/check-baseline.mjs` has no selftest (count 0).
- **L-87** — `scripts/check-context-budget.mjs:30` `HOOK=".claude/hooks/context-budget.js"` is resolved from the cwd (`:32`, `:76`, `:169` `process.cwd()`). Not co-located.
- **L-88** — `grep -n "r.error" scripts/check-context-budget.mjs` → 0 hits. Its `run()` returns `{error}` but no assertion checks it first. `ok(!/run \/compact/i.test(r.ctx ?? ""))` and `ok(!/batch\|compact\|billable/i.test(r.ctx))` are refusal-direction.
- **L-92** — `grep -n "file you took\|dry run" CLAUDE.md` → 0. No rule is written. The labels do match (a91b802 names `walker v10`, file has `SPINE:walker v10`; 7de853b `v10`, file `@kit bash-gate v10`).
- **L-95** — Same as L-82: `check-baseline.mjs` was run over the real tree only, and has no fixture. 661c87a's garbage-tsc false green is not kept as a probe.
- **L-100** — `grep -in "recompute\|distinct output" .claude/agents/*.md .claude/commands/*.md CLAUDE.md` → 0 hits, so `walker`/`implementer` carry no such step.
- **L-101** — `git show 7de853b^:.claude/hooks/bash-gate.js` (v9) `--against` through `bash-gate.probe.mjs` → `3 looser (0 declared)`. The 7de853b message records no differential.
- **L-102** — `lib/storage.ts:35` `file.name.split(".").pop()` goes into the key. `:32-33` `bucket`/`folder` come raw from `formData`. Admin-guarded, create-only.
- **L-106** — `.claude/commands/walk.md:53` `surfaces` region is empty, with no "like X" rule anywhere. 030's `USING (true)` shape on orders and price_matrices needed 039/040 (G-01, G-03).

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
