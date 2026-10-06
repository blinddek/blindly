/**
 * bash-gate.js — PreToolUse gate for Bash. KIT FILE, install at `.claude/hooks/`.
 *
 * @kit bash-gate v10 — tracked OUTSIDE its `KIT:CONFIG` regions. Those regions are yours;
 * everything else is canon's, and `check-kit-drift.mjs` reconciles it.
 *
 * WHY THIS EXISTS, and it is not the reason you would guess. Allow-rules in
 * settings.json cannot cover commands containing `$()` substitution, heredocs,
 * or multiline awk/node bodies — Claude Code's injection analysis decomposes
 * them and prompts regardless of any allow rule, which stalls an unattended
 * session on `ls`. A PreToolUse hook answers BEFORE the permission system, so
 * `allow` skips the prompt. It exists for session friction first and danger
 * second, which is why `0-GREENFIELD.md` phase 0.4 installs it on day ZERO,
 * before there is any code to protect.
 *
 * POSTURE: ALLOW EVERYTHING EXCEPT the named gates. The ALLOW cases matter more
 * than the DENY cases — a gate that over-matches has failed at its job while
 * looking maximally safe. Every rule below is a TOKEN test at COMMAND POSITION
 * inside one shell SEGMENT, never a substring test on the whole string, because
 * every false-deny this file's ancestors recorded came from one of three shapes:
 * a pattern spanning `&&`/`;`/`|` into a neighbouring command, a verb matched
 * inside prose or a quoted argument, or punctuation touching the target
 * (`\rm`, `(rm`, `/"*"`). Segments, normalised tokens and a position check
 * remove all three at once. ONE rule also reads the segments BEFORE its own, and only to learn
 * which branch its segment lands on: the protected-branch ask (v5, below).
 *
 * v2 (2026-09-08) is the harvest of four field copies. Measured before it:
 * canon ALLOWED `git push -f`, `\rm -rf /`, `(rm -rf /*)`, `rm -rf /"*"` and
 * `git commit --no-verify`; false-DENIED `rm -rf .next && du -sh /`; and ASKED
 * on `git fetch origin main && git push origin feature/x` with a reason that
 * named the wrong segment. Each is a probe case now.
 *
 * v5 (2026-09-10) is yoros's measurement of v4: the protected-branch gate asked only when a command
 * NAMED the branch, so the ordinary deploy sequence — `git checkout main && git merge x && git push`
 * — was allowed end to end, and `git push origin +main` force-pushed it. The branch a segment lands
 * on is now resolved (see "WHICH BRANCH" below), and a `+refspec` is a force-push.
 *
 * v6 (2026-09-11) is yoros CF-4: a fallback was declared per FILE, so one `@twin` passed a hook
 * holding nine rules with no floor behind eight. Every rule now carries its own — see "WHAT STANDS
 * BEHIND EACH RULE" below — and `node bash-gate.js --fallbacks` lists them for the checks to read.
 *
 * v7 (2026-09-11) is pleks CF-8, CF-9 and yoros CF-10, and it is the first version measured against
 * the gate it replaces rather than only against its own cases. Run beside pleks's previous gate, v6
 * ALLOWED 15 of 15 payloads that gate denied or asked, and yoros found the same class on its own.
 * Three causes, each a piece of bash read wrongly:
 *   - COMMAND POSITION. The command word was found past a fixed list of BARE wrappers. `timeout 30`,
 *     `bash -c`, `eval`, `xargs`, `sudo -E`, `nice -n 10`, `then` and `!` all moved the real
 *     command off it, and every rule missed. See "WHERE THE COMMAND IS".
 *   - HEREDOC MASKING hid a here-string's following lines (`<<<`), a body piped on to `sh`, and
 *     `$(…)` in an unquoted body, all of which bash runs.
 *   - THE MESSAGE MASK read `\` as an escape inside single quotes, where bash does not, so `-m 'a\'`
 *     never closed and the mask blanked the command after it.
 * Also: `git push -n` is a dry run and is no longer denied as `--no-verify` (yoros CF-10); `git merge
 * main` names its SOURCE and no longer asks on a working branch (pleks CF-8); `--mirror` is denied as
 * the force-push it is; and the abbreviations git accepts (`--no-veri`, `--har`) and
 * `-c core.hooksPath=` read as what they spell.
 *
 * THE PROBE NOW TAKES `--against <previous bash-gate.js>` (pleks CF-10): every case through both
 * gates, failing on any verdict that got LOOSER unless this version declares it. A replacement
 * gate's own cases assert what its author intended, and the previous corpus asserts the old
 * mechanisms, so a regression sits in the gap between the two suites, where neither has a case.
 *
 * v8 (2026-09-11) is yoros CF-11: the message mask read only a standalone `-m`, so `git commit -am
 * "never use --no-verify"` was denied for its own message. Testing that fix found two holes the mask
 * had held since v6, both in the other direction: it blanked a double-quoted message's `$(…)` and
 * backticks, which the shell runs, so `git commit -m "$(git push -f)"` was ALLOWED; and it began a
 * message at a `-m` that was itself inside quotes, so `echo " -m '" && git push -f && echo "'"` was
 * masked from the inner quote onward and allowed. See "THE FLAG IS `-m`". Against v7: 4 verdicts
 * looser, all four the message, and 3 stricter.
 *
 * A REASON IS ALWAYS SET, INCLUDING ON ALLOW. An empty reason makes an allow
 * indistinguishable from a hook that ran and decided nothing.
 *
 * IT FAILS TO A PROMPT, NEVER TO SILENCE. Unparseable input asks, and so does
 * valid JSON that is not an object: `JSON.parse` accepts a bare string, and
 * reading `tool_input` off one yields `undefined` and a silent allow. That hole
 * shipped green in two projects' copies behind probes that never sent one.
 */
// @event PreToolUse
// @matcher Bash
// @rule-fallbacks --fallbacks

/* KIT:CONFIG twins — the settings rules behind the gates below, as `// @twin <rule>` lines, for
 * the reader: the record of what was probed and why lives best beside the pattern. Optional since
 * v6, when each rule came to carry its own fallback (the fallbacks region, and the third element
 * of your own entries). `check-hook-registration.mjs` reconciles every @twin here against settings
 * AND against those fallbacks, so a line that backs none of the rules is a finding. */
/* KIT:CONFIG /twins */

// THE BRANCH CONFIG IS A MODULE, NOT A REGION HERE, and the reason is the probe.
//
// Until 2026-09-09 `PROTECTED_BRANCH` was declared in a KIT:CONFIG region of THIS file and again
// in one of `bash-gate.probe.mjs`, bound only by a sentence in the probe's region asking a human to
// keep them equal. Set the probe to `master` and leave this at `main` and the probe fails — loud
// and safe. Set THIS to `master` and leave the probe at `main` and the probe PASSES, exercising a
// branch nothing protects while the branch that is protected is never tested. M-KIT-07.
//
// This hook consumes stdin at top level and exports nothing, so the probe cannot import it. A value
// two artefacts must agree on therefore lives in a module they BOTH import — the shape
// `agent-write-scope` reached first (M-KIT-06).
//
// ⚠ PORTING NOTE. This makes the file ESM. If YOUR project has no `"type": "module"`, a `.js` here
// is CommonJS and `import` is a syntax error — Node ≥22.7 reparses it as ESM and prints a
// MODULE_TYPELESS_PACKAGE_JSON warning to stderr on EVERY hook invocation, which is a compensation,
// not a fix, and it is version-dependent. Set `"type": "module"`, or convert this file. Do not
// assume either way. → M-KIT-17.
import { PROTECTED_BRANCH, PROTECTED_REASON } from "./bash-gate.config.mjs";
import { readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/* KIT:CONFIG seams — shell variables that, set as a leading assignment, bypass this
 * project's git hooks (a `.githooks` probe seam: `X_HOOK_PROBE=1 git commit …`). An
 * ungated `--no-verify` by another name. Empty means the rule is inert. Setting them
 * through a spawn's `env` object is invisible to this rule by design; only the shell
 * spelling is denied, and the legitimate driver never spells it. */
const SEAM_VARS = [];
/* KIT:CONFIG /seams */

/* KIT:CONFIG deny — this project's own irreversible acts, beyond the canonical set.
 * Each entry is `[rule, reason, fallback]`. A RegExp is tested against ONE SEGMENT's text, so
 * it cannot span `&&`, `;` or `|` into a neighbouring command; a function receives
 * `(tokens, segmentText, command)` for a segment. Prefer `atCommand(tokens, "name")`.
 * The fallback is what stands behind the rule when this hook is not running, in the shape the
 * fallbacks region below describes. An entry without one is a check-hook-registration finding. */
const PROJECT_DENY = [
  [(t) => atCommand(t, "npm") && t.includes("publish"),
    "this is a website, not a package — npm publish is never correct here",
    { twins: ["Bash(npm publish *)"] }],
];
/* KIT:CONFIG /deny */

/* KIT:CONFIG ask — acts that are legitimate but must not happen unattended. Same
 * shape as deny. Severity is yours: a project that wants `git reset --hard` DENIED
 * rather than asked lists it here with its reason and the canon ask never fires. */
// THE ONLY DATABASE IS PRODUCTION (checked 2026-10-05): .env.local holds one Supabase project, with
// its service-role key and a SUPABASE_DB connection string, and there is no staging. DDL reaches it
// through scripts/setup-db.sh, which runs `supabase db push`, `supabase db reset` or `psql
// "$DATABASE_URL"`. Each of the three asks, whether run directly or through the script.
const PROJECT_ASK = [
  // Matched on the subcommand wherever it sits, not on `supabase db` being adjacent: a version
  // (`npx supabase@latest`) or a global flag with a value (`--workdir . db reset`) walked past the
  // adjacent-words form (canon L-14, probed 2026-10-06).
  [(t) => {
    const a = (atCommand(t, "npx") ? argsOf(t) : atCommand(t, "supabase") ? ["supabase", ...argsOf(t)] : [])
      .filter((x) => !x.startsWith("-"));
    if (!/^supabase(@.*)?$/.test(a[0] ?? "")) return false;
    const db = a.indexOf("db");
    return db > 0 && (a[db + 1] === "push" || a[db + 1] === "reset");
  },
    "supabase db push/reset writes DDL to the production database — there is no staging database",
    { twins: ["Bash(supabase db push*)", "Bash(supabase db reset*)", "Bash(npx supabase db *)", "Bash(npx supabase@*)", "Bash(supabase --*)"] }],
  // The Management API runs arbitrary SQL, DDL included, against the production project. The token
  // is read by reference, so the gate matches the endpoint or the token's name wherever either appears.
  [(t) => t.some((x) => x.includes("api.supabase.com") || x.includes("SUPABASE_ACCESS_TOKEN")),
    "the Supabase Management API runs SQL, DDL included, against the production database — there is no staging database",
    { twins: ["Bash(*api.supabase.com*)", "Bash(*SUPABASE_ACCESS_TOKEN*)"] }],
  [(t) => atCommand(t, "setup-db.sh"),
    "scripts/setup-db.sh runs migrations (or --reset) against the production database — there is no staging database",
    { twins: ["Bash(./scripts/setup-db.sh*)", "Bash(scripts/setup-db.sh*)", "Bash(bash scripts/setup-db.sh*)", "Bash(bash ./scripts/setup-db.sh*)"] }],
  [(t) => atCommand(t, "psql"),
    "psql here reaches the production database — there is no staging database",
    { twins: ["Bash(psql *)"] }],
];
/* KIT:CONFIG /ask */

/* KIT:CONFIG fallbacks — what stands behind each of CANON's rules if this hook stops running.
 *
 * One entry per canon rule, keyed by its function's name, in one of two shapes:
 *   { twins: ["Bash(git push *main*)", …] } — rules in settings `permissions.deny` or `.ask`
 *   { noTwin: "why a settings rule cannot say it" } — a reason, never a placeholder
 * Canon ships every entry UNFILLED, because which floor a rule deserves is this project's call,
 * and `check-hook-registration` fails an entry until it is answered. It also fails a twin that is
 * not in settings, and a key naming no rule — a canon rename leaves its fallback behind.
 *
 * WRITE A TWIN IN THE SHAPE SETTINGS READS. `:*` is a wildcard only at the END of a pattern; in
 * `Bash(git merge:*main*)` the colon is literal and the rule matches no command. Write
 * `Bash(git merge *main*)`. The space before a `*` is a word boundary: `Bash(git push --force *)`
 * does not match `--force-with-lease`.
 *
 * A TWIN IS LIVE WHILE THIS HOOK RUNS. Measured on Claude Code 2.1.235 (yoros and life-therapy,
 * 2026-09-11): a matching settings ask still prompts when this hook returns allow, and a deny still
 * blocks, as the permissions page says. So a twin wider than its rule costs a prompt, in normal
 * work, on every command the rule allows. That cost is a reason to narrow the twin. It is never a
 * reason to delete it. L-15 records the August reading that said otherwise, and why it no longer
 * holds. The harness also strips most wrappers (`timeout`, `nice -n`, `env -i`, `sudo -u`) before
 * matching, so a twin already covers most wrapped spellings of its command. */
// Answered 2026-10-05, at adoption, after yoros's M-013 answers. WHERE THE FLOOR MATTERS ON THIS
// MACHINE: with this hook dead, a command no allow rule covers still prompts. The user settings allow
// `git push *`, `git add *`, `git commit -m ' *` and `npm run *`, so the push twins carry the weight.
const CANON_FALLBACKS = {
  isDestructiveRm: {
    noTwin: "LETHAL_TARGET reads one normalised token and catches /*, C:\\, $HOME and ~/, which no glob can spell: a literal * cannot be written, so Bash(rm -rf /*) also matches every absolute path and would refuse ordinary cleanup. No allow rule at project or user scope names rm, so with this hook dead it prompts through the normal flow",
  },
  // DENY, as in the hook. The spaces keep `--force-with-lease` and a branch like `fix-f` out.
  isForcePush: {
    twins: [
      "Bash(git push --force *)", "Bash(git push * --force *)", "Bash(git push * --force)",
      "Bash(git push -f *)", "Bash(git push * -f *)", "Bash(git push * -f)",
      "Bash(git push *--mirror*)",
    ],
  },
  // ASK under a deny rule: the one glob that sees a leading `+` also sees a push option like
  // `-o 'note +1'`, which the rule allows. The user-level `git push *` allow makes this one matter.
  isForceRefspec: { twins: ["Bash(git push * +*)"] },
  isNoVerify: {
    noTwin: "No git hook is installed in this clone (.git/hooks holds samples only, core.hooksPath unset, no .husky or .githooks — checked 2026-10-05), so --no-verify skips nothing and a twin would guard nothing. The glob that finds the flag anywhere also matches a -m message naming it. Revisit the day a git hook lands",
  },
  isSeamAssignment: {
    noTwin: "inert: SEAM_VARS is empty, because there is no git hook to carry a probe seam. If one is added, measure first: deny and ask rules match PAST a leading assignment, so a rule may never see the assignment this one is about",
  },
  // `*main*` also prompts on a branch like `maintenance`. A bare push while on main reaches the branch
  // by reference, which no glob resolves — and this is a single-branch repo, so every bare push does.
  targetsProtectedBranch: { twins: ["Bash(git merge *main*)", "Bash(git push *main*)", "Bash(git push *--all*)"] },
  isPrMerge: { twins: ["Bash(gh pr merge *)"] },
  isHardReset: { twins: ["Bash(git reset *--hard*)"] },
  // Wider than the rule: it also prompts on `git clean -n`, which the rule allows.
  isForceClean: { twins: ["Bash(git clean *)"] },
};
/* KIT:CONFIG /fallbacks */

// ── Canon machinery. Every rule is a token test at command position in one segment. ──

/**
 * Strip the shell punctuation that carries no meaning for these rules, so one token
 * compares as one word: `/"*"` and `'/'*` are both `/*` to the shell, `(rm` hides a
 * command in a subshell, `\rm` is the standard alias-bypass idiom. Quotes come out
 * ANYWHERE, because mid-token is exactly where they were used to hide.
 * A character loop, not a regex: an anchored greedy class backtracks across a run of
 * the same character, and this runs in front of every Bash call.
 */
function normToken(t) {
  const s = t.replace(/["'`]/g, "");
  let i = 0;
  let j = s.length;
  while (i < j && "\\({[".includes(s[i])) i++;
  while (j > i && ")}]".includes(s[j - 1])) j--;
  return s.slice(i, j);
}

/**
 * Commands whose stdin is DATA, never code. A heredoc feeding one of these is prose
 * and its body is masked before any rule runs — so `git commit -F - <<'MSG'` may
 * discuss `rm -rf /` without tripping the gate, which is the workaround this file's
 * v1 advertised and could not honour. An UNLISTED receiver keeps its body (`bash
 * <<EOF`, `python -`, `psql`, `ssh host`): unknown fails toward deny, so a heredoc
 * is never a universal envelope. Extend the list, do not invert it.
 */
const HEREDOC_SINKS = new Set([
  "cat", "tee", "git", "gh", "grep", "egrep", "fgrep", "rg", "sed", "awk", "head", "tail",
  "wc", "sort", "uniq", "cut", "tr", "diff", "less", "more", "jq", "yq", "base64", "md5sum",
  "sha256sum", "curl", "wget", "dd", "od", "xxd", "hexdump", "column", "fold", "paste",
]);

// ── WHERE THE COMMAND IS (v7, pleks CF-9 ①, yoros CF-10 (a)) ──
//
// Every rule is a test at COMMAND POSITION, so the whole gate is only as good as the reader that
// finds that position. v6 stepped over `VAR=x` and eight bare words. Measured in both projects, it
// then read `timeout` in `timeout 30 git push -f`, and `-E` in `sudo -E rm -rf /*`, as the command.
// So the reader now steps over three things, in a loop:
//   - a leading assignment, and the shell keywords that open a command (`then`, `do`, `!`, …);
//   - a WRAPPER, with its options: the table says which options take the next token as a value,
//     and how many positionals come before the command (timeout's DURATION);
//   - a RUNNER (`bash -c`, `sh -c`, `eval`, `xargs`). The string it runs is split on whitespace
//     with its quotes stripped, like every token here, so its first word is the command word. A
//     script path (`bash deploy.sh --force`) matches no rule, so `-c` needs no special case.
// `command -v git` names git and runs nothing, so it stops there.
//
// The table is not closed, and no table can be: the set of runners is open. So the DENY and ASK
// lists also look past the command word — see "THE BACKSTOP" at `decide`.
const KEYWORDS = new Set(["if", "then", "else", "elif", "do", "while", "until", "!"]);
const SH_OPTS = { value: ["-o", "-O", "--rcfile", "--init-file"] };
const WRAPPERS = new Map([
  ["sudo", { value: ["-u", "-g", "-h", "-p", "-C", "-D", "-R", "-T", "-U", "-r", "-t", "--user", "--group", "--host", "--prompt", "--close-from", "--chdir", "--chroot", "--command-timeout", "--other-user", "--role", "--type"] }],
  ["doas", { value: ["-u", "-C"] }],
  // Not `-S`: `env -S "git push -f"` splits its value into the command, so the value IS the command.
  ["env", { value: ["-u", "--unset", "-C", "--chdir"] }],
  ["command", { query: ["-v", "-V"] }],
  ["exec", { value: ["-a"] }],
  ["nohup", {}], ["builtin", {}], ["noglob", {}], ["time", {}], ["winpty", {}], ["eval", {}],
  ["nice", { value: ["-n", "--adjustment"] }],
  ["ionice", { value: ["-c", "-n", "-p", "-P", "-u", "--class", "--classdata"] }],
  ["timeout", { value: ["-s", "--signal", "-k", "--kill-after"], positional: 1 }],
  ["stdbuf", { value: ["-i", "-o", "-e", "--input", "--output", "--error"] }],
  ["xargs", { value: ["-a", "-d", "-E", "-I", "-L", "-n", "-P", "-s", "--arg-file", "--delimiter", "--eof", "--replace", "--max-lines", "--max-args", "--max-procs", "--max-chars", "--process-slot-var"] }],
  ["bash", SH_OPTS], ["sh", SH_OPTS], ["zsh", SH_OPTS], ["dash", SH_OPTS], ["ksh", SH_OPTS],
]);

/** The index just past one wrapper's options and positionals, starting at its first argument. */
function pastWrapper(tokens, i, w) {
  let positional = w.positional ?? 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === "--") return i + 1 + positional;
    if (t.startsWith("-")) {
      i += w.value?.includes(t) ? 2 : 1;
    } else if (positional > 0) {
      positional--;
      i++;
    } else {
      return i;
    }
  }
  return i;
}

/** Index of the command word in a segment: past assignments, keywords, wrappers and runners. */
function commandWordIndex(tokens) {
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (KEYWORDS.has(t) || /^[A-Za-z_]\w*=/.test(t)) {
      i++;
      continue;
    }
    const w = WRAPPERS.get(t.slice(t.lastIndexOf("/") + 1));
    if (!w || w.query?.includes(tokens[i + 1])) break;
    i = pastWrapper(tokens, i + 1, w);
  }
  return i < tokens.length ? i : -1;
}

/** Is `name` this segment's command (as `name`, `/usr/bin/name`, `\name`, or after `sudo`)? */
function atCommand(tokens, name) {
  const i = commandWordIndex(tokens);
  if (i === -1) return false;
  const t = tokens[i];
  return t === name || t.endsWith("/" + name);
}

/** Everything after the command word — the arguments, as tokens. */
function argsOf(tokens) {
  const i = commandWordIndex(tokens);
  return i === -1 ? [] : tokens.slice(i + 1);
}

/**
 * Mask heredoc BODIES whose receiver is a sink. Opener `<<-?['"]?ID['"]?`; terminator
 * is the bare ID on its own line. No terminator → nothing masked (keep the body,
 * fail toward deny). The receiver is the command word of the last segment on the
 * opener's line before `<<`.
 *
 * THREE WAYS A BODY IS NOT DATA, all measured by pleks as allowed by v6 (CF-9 ②), and each keeps
 * the body now:
 *   - `<<<` is a HERE-STRING. It feeds one word, and the lines after it are commands. The opener
 *     regex matched the last two of its three `<`.
 *   - `cat <<'EOF' | sh` pipes the body on. The receiver before `<<` is a sink, but the command after
 *     `|` runs the body, so every stage of the pipeline must be a sink.
 *   - An UNQUOTED delimiter's body is expanded, so `$(…)` and backticks in it run. Such a line is
 *     kept, and splitting makes the substitution a command position. A quoted body is literal.
 *
 * ONE PASS. Bare-identifier lines are indexed first, then each opener binary-searches
 * for its terminator — a scan-to-end per opener measured QUADRATIC (20k unterminated
 * openers: 4 s), and a hook that can be made to hang has failed at the one job it has.
 */
function isSink(segmentText) {
  const tokens = segmentText.split(/\s+/).map(normToken).filter(Boolean);
  const cw = commandWordIndex(tokens);
  return cw !== -1 && HEREDOC_SINKS.has(tokens[cw].replace(/^.*\//, ""));
}

function maskSinkHeredocs(command) {
  const lines = command.split("\n");
  const bare = new Map(); // ID → ascending line numbers where the line is exactly that ID
  for (let j = 0; j < lines.length; j++) {
    const m = /^[ \t]*([A-Za-z_]\w*)[ \t]*$/.exec(lines[j]);
    if (m) (bare.get(m[1]) ?? bare.set(m[1], []).get(m[1])).push(j);
  }
  const firstAfter = (list, i) => {
    let lo = 0;
    let hi = list.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (list[mid] > i) hi = mid;
      else lo = mid + 1;
    }
    return lo < list.length ? list[lo] : -1;
  };
  const out = [];
  // Emits line i, and a sink heredoc's masked body if one opens there. Returns the last line
  // consumed — the terminator, or i itself — so the loop never reassigns its own counter.
  const consume = (i) => {
    const line = lines[i];
    out.push(line);
    const m = /(?<!<)<<(?!<)-?\s*(['"]?)([A-Za-z_]\w*)\1/.exec(line);
    if (!m) return i;
    const before = line.slice(0, m.index);
    if (!isSink(before.split(/[;&|]+/).pop() ?? "")) return i;
    // The rest of the opener's pipeline: every stage after `|` must be a sink too, and a process
    // substitution runs a command of its own.
    const rest = line.slice(m.index + m[0].length);
    const pipeline = rest.split(/;|&&|\|\|/)[0];
    if (/[<>]\(/.test(rest) || pipeline.split(/\|&?/).slice(1).some((stage) => !isSink(stage))) return i;
    const j = firstAfter(bare.get(m[2]) ?? [], i);
    if (j === -1) return i; // unterminated: keep the body
    const literal = m[1] !== "";
    for (let k = i + 1; k < j; k++) out.push(literal || !/\$\(|`/.test(lines[k]) ? "" : lines[k]);
    out.push(lines[j]);
    return j;
  };
  let i = 0;
  while (i < lines.length) i = consume(i) + 1;
  return out.join("\n");
}

/**
 * A command string as SEGMENTS of normalised tokens — one per shell command. Line
 * continuations are joined first, or `\`+newline tears a command in half at exactly
 * the point an attacker would choose. `$(`, backticks and the process substitutions
 * `<(` / `>(` open a segment too, so a substitution is a command position and not a
 * hiding place.
 *
 * `bare` says, per token, whether it stood OUTSIDE quotes. Only the backstop reads it: a
 * quoted word is an argument (`--body "never rm -rf /"`), and a bare one may be a command.
 */
function segments(command) {
  const src = maskSinkHeredocs(command).replace(/\\\r?\n/g, " ");
  const quoted = quoteMap(src);
  const out = [];
  const piece = (from, to) => {
    const tokens = [];
    const bare = [];
    for (const m of src.slice(from, to).matchAll(/\S+/g)) {
      const t = normToken(m[0]);
      if (!t) continue;
      tokens.push(t);
      bare.push(quoted[from + m.index] === 0);
    }
    if (tokens.length > 0) out.push({ text: src.slice(from, to).trim(), tokens, bare });
  };
  const plain = plainQuoting(src, quoted);
  let from = 0;
  for (const sep of src.matchAll(/[;&|\n]+|\$\(|[<>]\(|`/g)) {
    if (plain && quoted[sep.index] !== 0 && leadsData(src.slice(from, sep.index))) continue;
    piece(from, sep.index);
    from = sep.index + sep[0].length;
  }
  piece(from, src.length);
  return out;
}

/**
 * A QUOTED SEPARATOR IS TEXT — BUT ONLY WHERE THAT IS PROVABLE (v10).
 *
 * Until v10 every `;`, `&`, `|` and newline split a segment, quoted or not, so
 * `grep -E "x|npm install|y" f` read as a command `npm install` and was denied: a gate that refuses
 * a search for the rule it enforces. Measured in dev-standards, three refusals in one session.
 *
 * Splitting blindly was not only a bug, though: it is what catches a SECOND command inside a
 * runner's string. `bash -c "echo hi; rm -rf /*"` reads its command word as `echo`, and the
 * `rm` is denied only because the quoted `;` splits it off. The same holds for `ssh host "…"`,
 * `watch "…"`, and every command that runs a string — an open set. So a quoted separator stays a
 * split everywhere EXCEPT both of:
 *   - the segment is led, as its very first word, by a command whose arguments are data and never
 *     run (`DATA_ARGS`): no wrapper, no runner, no assignment in front of it;
 *   - this file's quote map pairs the command exactly as bash does. It cannot when a substitution
 *     opens a fresh quoting context (`"$(echo "a" ; rm …)"` re-pairs every quote after it), inside
 *     `$'…'`, across a heredoc, when a quote never closes, or when a quoted span holds a newline —
 *     which is also the only way an apostrophe in a `# comment` can mis-pair, since a comment ends
 *     at its newline. Any of those, and the whole command splits exactly as v9 did.
 * Wrong in either direction, the cost differs: a split too many is a false deny, one too few is a
 * hidden command. So the list is short and closed, and unsure means v9.
 *
 * WHAT IT DOES NOT FIX. `gh pr create --title "a; npm i b" --body "$(cat <<'EOF' … )"` still splits
 * at the title's `;` — the command holds a substitution, and `gh` runs strings (`gh codespace ssh`),
 * so neither condition holds. Write such a body with `--body-file` and the title without a
 * separator, or commit with `-F <file>`. Proving a masked substitution inert is a larger change.
 */
const DATA_ARGS = new Set(["grep", "egrep", "fgrep", "rg", "echo", "printf"]);

function plainQuoting(src, q) {
  if (q.open || /\$\(|`|<<|\$'/.test(src)) return false;
  for (let i = 0; i < src.length; i++) {
    if (q[i] !== 0 && src[i] === "\n") return false;
    // Data piped on is data only if what receives it reads stdin as data: `echo "a; rm -rf /" | sh`.
    if (q[i] === 0 && src[i] === "|" && src[i - 1] !== "|") {
      if (src[i + 1] === "|") continue;
      const stage = /^&?\s*(\S+)/.exec(src.slice(i + 1))?.[1] ?? "";
      if (!HEREDOC_SINKS.has(stage)) return false;
    }
  }
  return true;
}

function leadsData(text) {
  const first = /\S+/.exec(text)?.[0] ?? "";
  return !/["'\\]/.test(first) && DATA_ARGS.has(first);
}

/**
 * For each character inside quotes (or a quote itself) 1 if single, 2 if double, else 0. Bash's
 * rules: nothing escapes in single quotes; in double quotes `\` escapes the next character; outside,
 * `\` quotes one. `.open` is true when the string ends inside a quote.
 */
function quoteMap(s) {
  const q = new Uint8Array(s.length);
  let state = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const mark = c === '"' || state === '"' ? 2 : 1;
    if (state === "") {
      if (c === "\\") i++;
      else if (c === "'" || c === '"') {
        state = c;
        q[i] = mark;
      }
    } else {
      q[i] = mark;
      if (state === '"' && c === "\\" && i + 1 < s.length) q[++i] = mark;
      else if (c === state) state = "";
    }
  }
  q.open = state !== "";
  return q;
}

/**
 * Blank the TEXT of a `-m`/`--message` value, quotes left in place, before scanning
 * for FLAGS. The message is git's argument, not a switch — denying `git commit -m
 * "we ban --no-verify"` means the gate forbids writing down the rule it enforces.
 * NOT "strip quotes": `git commit "--no-verify"` IS the flag once the shell strips
 * the quotes, and `normToken` treats it so. Only the value of `-m` is inert.
 *
 * A backslash escapes only inside DOUBLE quotes. v6 honoured it inside single quotes too, so
 * `echo -m 'a\' && rm -rf /* && echo 'b'` masked everything up to the last `'` (pleks CF-9 ③).
 *
 * THE FLAG IS `-m` WHEREVER GIT READS ONE (v8, yoros CF-11). Until v8 only a standalone `-m` counted,
 * so `git commit -am "never use --no-verify"`, the commonest way a commit is typed, was denied for
 * its own message. Now a short cluster whose LAST letter is `m` counts too (`-am`, `-qm`), and so
 * does a value attached by a quote (`-m"…"`, `--message="…"`). Not when a letter before the `m`
 * takes a value: in `-Fm` the `m` is F's file, so a quoted `"--no-verify"` after it is the flag.
 */
const isSpace = (c) => c === " " || c === "\t" || c === "\r" || c === "\n";

/** The length of a message flag starting at `i` (`-m`, `-am`, `--message`), or 0. */
function messageFlagAt(command, i) {
  if (command[i] !== "-" || (i > 0 && !isSpace(command[i - 1]))) return 0;
  if (command.startsWith("--message", i)) return 9;
  let j = i + 1;
  while (j < command.length && /[A-Za-z]/.test(command[j])) j++;
  const cluster = command.slice(i + 1, j);
  if (!cluster.endsWith("m") || [...cluster.slice(0, -1)].some((c) => "mFcCtuS".includes(c))) return 0;
  return j - i;
}

function maskMessageText(command) {
  const quoted = quoteMap(command);
  // A double-quoted message still runs its `$(…)` and backticks, and where a substitution inside
  // quotes ends is the shell's to say, not this scan's. So where one is double-quoted, nothing is
  // masked, and every flag rule reads the whole command. Until v8 `git commit -m "$(git push -f)"`
  // passed. In single quotes it is text, and `-m '$(…)'` is masked as before.
  for (let p = 0; p < command.length; p++) {
    if (quoted[p] === 2 && (command[p] === "`" || (command[p] === "$" && command[p + 1] === "("))) return command;
  }
  const out = command.split("");
  let i = 0;
  while (i < command.length) {
    // Only an UNQUOTED `-m` is a flag: in `echo " -m '" && …` it is text, and v7 masked from its
    // quote to the next one, over the command between.
    const flagLen = quoted[i] ? 0 : messageFlagAt(command, i);
    const after = command[i + flagLen];
    const spaced = after === undefined || isSpace(after);
    const attached = after === '"' || after === "'" || (after === "=" && command[i + 1] === "-");
    if (flagLen === 0 || !(spaced || attached)) {
      i++;
      continue;
    }
    let k = i + flagLen + (after === "=" ? 1 : 0);
    while (spaced && k < command.length && isSpace(command[k])) k++;
    const quote = command[k];
    if (quote !== '"' && quote !== "'") {
      i = k > i ? k : i + 1;
      continue;
    }
    let end = k + 1;
    while (end < command.length && command[end] !== quote) {
      if (quote === '"' && command[end] === "\\") end++;
      end++;
    }
    for (let p = k + 1; p < Math.min(end, command.length); p++) out[p] = " ";
    i = end + 1;
  }
  return out.join("");
}

// A root, a bare home, a drive root, or any of those followed only by more `/` and `*`.
// `/tmp/scratch` and `~/projects` fail because a NAMED segment follows — the two cases
// that separate a gate from a wall.
const LETHAL_TARGET = /^(?:[/~][/*]*|[A-Za-z]:[/\\]?[/*]*|\$\{?HOME\}?[/*]*)$/;
const FORCE_LONG = /^--force(?:=.*)?$/;
// Everything before the FIRST `f` is a letter other than `f`, so there is one way to match and
// nothing to backtrack over. `[A-Za-z]*f` accepted the same strings in quadratic time.
const SHORT_CLUSTER_WITH_F = /^-[A-Za-eg-z]*f[A-Za-z]*$/;

function isDestructiveRm(tokens) {
  return atCommand(tokens, "rm") && argsOf(tokens).some((t) => LETHAL_TARGET.test(t));
}

/**
 * Git accepts any unambiguous prefix of a long option, so `--no-veri` IS `--no-verify` and `--har` IS
 * `--hard` (pleks CF-9, observed). `min` is the shortest prefix that names only `full` for the verbs
 * it is used with; a shorter one is ambiguous, and git refuses it.
 */
const spells = (t, full, min) => t.length >= min.length && t.startsWith(min) && full.startsWith(t);

/**
 * `git … push … --force|-f|-xf`, or `--mirror`, which force-updates and deletes every remote ref to
 * match the local ones. `--force-with-lease` and `--force-if-includes` are the SAFE forms and pass.
 */
function isForcePush(tokens) {
  if (!atCommand(tokens, "git")) return false;
  const args = argsOf(tokens);
  if (!args.includes("push")) return false;
  return args.some((t) => FORCE_LONG.test(t) || SHORT_CLUSTER_WITH_F.test(t) || spells(t, "--mirror", "--mi"));
}

/**
 * `-n` inside a short cluster, read the way git reads one: letters until one that takes a value, whose
 * value is the rest (`-am x` is all + message; `-mn` is the message "n"; `-an` is all + no-verify).
 */
function clusterHasN(t) {
  if (!/^-[A-Za-z]+$/.test(t)) return false;
  for (const c of t.slice(1)) {
    if (c === "n") return true;
    if ("mFcCtuS".includes(c)) return false;
  }
  return false;
}

/**
 * `--no-verify` on the hooked verbs, `-c core.hooksPath=…` (which points every hook elsewhere), and
 * `-n` only on COMMIT. On push `-n` is `--dry-run`, and push's --no-verify has no short form (git
 * 2.55 `push -h`): v6 denied a dry-run push as if it skipped the gate (yoros CF-10 (b)).
 */
function isNoVerify(tokens) {
  if (!atCommand(tokens, "git")) return false;
  const args = argsOf(tokens);
  const verb = args.find((t) => ["commit", "push", "merge", "revert", "cherry-pick"].includes(t));
  if (!verb) return false;
  if (args.some((t) => spells(t, "--no-verify", "--no-veri"))) return true;
  if (args.some((t, i) => t === "-c" && /^core\.hookspath=/i.test(args[i + 1] ?? ""))) return true;
  return verb === "commit" && args.some(clusterHasN);
}

/** A leading `SEAM_VAR=…` assignment — the only spelling of the seam the Bash tool can reach. */
function isSeamAssignment(tokens) {
  if (SEAM_VARS.length === 0) return false;
  let i = 0;
  if (tokens[0] === "export" || tokens[0] === "env") i = 1;
  for (; i < tokens.length; i++) {
    const eq = tokens[i].indexOf("=");
    if (eq <= 0) break;
    if (SEAM_VARS.includes(tokens[i].slice(0, eq))) return true;
  }
  return false;
}

// ── WHICH BRANCH A GIT ACT LANDS ON, WHEN THE COMMAND DOES NOT SAY (v5, yoros CF-3 and CF-5) ──
//
// v4 asked only when a merge or push NAMED the protected branch. Measured by yoros on the real hook:
//
//   git checkout main && git merge rebuild && git push     allow   ← the ordinary deploy sequence
//   git push  ·  git push origin HEAD  ·  git merge rebuild  allow   (while main is checked out)
//   git push origin rebuild:refs/heads/main                  allow
//   git push --all origin  ·  git push --mirror origin       allow
//   git push origin +main                                    allow   ← a force-push to the deploy branch
//
// L-14's general form, in canon's own hook: a gate that matches how a target APPEARS misses it when
// it is supplied BY REFERENCE. So the target is resolved: the branch a checkout or switch EARLIER IN
// THE SAME COMMAND moved to, else the one `.git/HEAD` names, else UNKNOWN, which asks. What follows is
// yoros's stopgap (`bash-gate.refs.mjs`, mutation-tested 6 of 6), lifted with its reasoning.
//
// ⚠ `.git/HEAD` IS READ ONLY WHEN `CLAUDE_PROJECT_DIR` IS SET, and that is sound rather than
// convenient. Every project registers this hook as `node "$CLAUDE_PROJECT_DIR/.claude/hooks/…"`, so
// a hook running under the harness has it. Unset means a probe or a hand run, and reading the
// probe's own checkout there would make its bare-push cases pass or fail by which branch is out.
// Unset is NOT_READ, which asserts nothing; set and unreadable is UNKNOWN, which asks.
//
// `gh pr merge` merges into the PR's base, which lives on the server and not in the command, so it is
// UNKNOWN and asks, whatever the base turns out to be.
//
// NOT COVERED, stated so it is not mistaken for cover: a push through an alias or a script, and
// `git rebase`/`reset` onto the protected branch, which move the local branch and deploy nothing
// until a push this does see.

/** Outside the harness: no HEAD was read, and nothing is known either way. */
const NOT_READ = undefined;
/** Inside it, and still unknown: detached, unreadable, or another repository. This ASKS. */
const UNKNOWN = null;

/** The branch `.git/HEAD` names, following a `.git` FILE (a worktree or submodule) to its gitdir. */
function readHeadBranch(root) {
  if (!root) return NOT_READ;
  try {
    let gitDir = join(root, ".git");
    if (statSync(gitDir).isFile()) {
      const line = readFileSync(gitDir, "utf8").split(/\r?\n/).find((l) => l.startsWith("gitdir:"));
      if (!line) return UNKNOWN;
      gitDir = resolve(root, line.slice("gitdir:".length).trim());
    }
    const head = readFileSync(join(gitDir, "HEAD"), "utf8").trim();
    const REF = "ref: refs/heads/";
    return head.startsWith(REF) ? head.slice(REF.length).trim() || UNKNOWN : UNKNOWN;
  } catch {
    return UNKNOWN;
  }
}

let headMemo = null;
function headBranch() {
  if (headMemo === null) headMemo = { v: readHeadBranch(process.env.CLAUDE_PROJECT_DIR || null) };
  return headMemo.v;
}

/**
 * Drop shell redirections, which the tokens keep: `git push > "$LOG" 2>&1` is a probe case, and read
 * as arguments it would make `>` a remote and `$LOG` a refspec, which is an explicit destination and
 * allows. `>` / `2>>` / `&>` take the next token; `>out` / `2>/dev/null` carry theirs.
 */
function dropRedirections(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const t = args[i];
    if (/^(?:\d*|&)[<>]{1,2}&?$/.test(t)) {
      i++;
      continue;
    }
    if (/^(?:\d*|&)[<>]/.test(t)) continue;
    out.push(t);
  }
  return out;
}

/** git's global options that take a value as the NEXT token, and those that point it elsewhere. */
const GLOBAL_WITH_VALUE = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path"]);
const ELSEWHERE = /^(?:-C|--git-dir(?:=.*)?|--work-tree(?:=.*)?)$/;

/** `{ verb, rest, elsewhere }` for a git segment's arguments (the tokens after `git`). */
function gitVerb(args) {
  const a = dropRedirections(args);
  let elsewhere = false;
  let i = 0;
  while (i < a.length && a[i].startsWith("-")) {
    if (ELSEWHERE.test(a[i])) elsewhere = true;
    i += GLOBAL_WITH_VALUE.has(a[i]) ? 2 : 1;
  }
  return { verb: a[i] ?? "", rest: a.slice(i + 1), elsewhere };
}

/** A token that names a PATH rather than a branch: a file checkout leaves the branch alone. */
const looksLikePath = (t) => t.includes(".") || t.includes("\\") || t.startsWith("/");

/**
 * The branch after a `git checkout` / `git switch` segment, given the one before it. A path checkout
 * (`--`, or a file) leaves it alone. `-` and `--detach` make it UNKNOWN: the previous branch is not
 * in the command.
 */
function branchAfter(args, current) {
  const { verb, rest, elsewhere } = gitVerb(args);
  if (elsewhere || (verb !== "checkout" && verb !== "switch")) return current;
  if (rest.includes("--")) return current;
  const create = verb === "checkout" ? ["-b", "-B", "--orphan"] : ["-c", "-C", "--create", "--force-create", "--orphan"];
  for (let i = 0; i < rest.length; i++) {
    if (create.includes(rest[i])) return rest[i + 1] ?? UNKNOWN;
    if (rest[i] === "--detach" || (rest[i] === "-d" && verb === "switch")) return UNKNOWN;
  }
  const positional = rest.filter((t) => !t.startsWith("-") || t === "-");
  if (positional.length === 0) return current;
  if (positional[0] === "-") return UNKNOWN;
  // `--track origin/main` creates and checks out a LOCAL `main`, so the remote prefix comes off.
  const tracks = rest.some((t) => t === "-t" || t === "--track" || t.startsWith("--track="));
  if (tracks && positional.length === 1 && positional[0].includes("/")) return positional[0].slice(positional[0].indexOf("/") + 1);
  if (positional.length > 1 || looksLikePath(positional[0])) return current;
  return positional[0];
}

/** A path for comparison: forward slashes, `/c/` as `c:/`, lower case, no trailing slash. */
function normPath(p) {
  let s = p.replace(/\\/g, "/").replace(/^\/([a-z])\//i, "$1:/").toLowerCase();
  while (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
  return s;
}

/** The branch after a `cd` / `pushd`: the same one if it stays in this repository, else UNKNOWN. */
function branchAfterCd(target, current, root) {
  if (target === undefined || target === "-" || target === "~" || target.startsWith("~/")) return UNKNOWN;
  const absolute = /^(?:\/|[A-Za-z]:[\\/])/.test(target);
  if (!absolute) return target.split(/[\\/]/).includes("..") ? UNKNOWN : current;
  if (!root) return UNKNOWN;
  const t = normPath(target);
  const r = normPath(root);
  return t === r || t.startsWith(r + "/") ? current : UNKNOWN;
}

/** `git push` options that take a value as the NEXT token; those that push every branch. */
const PUSH_WITH_VALUE = new Set(["-o", "--push-option", "--repo", "--receive-pack", "--exec"]);
const PUSH_ALL = new Set(["--all", "--mirror", "--branches"]);
/** The current-branch aliases a refspec may use. */
const SELF_REF = new Set(["HEAD", "@"]);

/**
 * What a `git push`'s arguments land on: `{ all, current, branches, forced }`. `all` is --all /
 * --mirror. `current` is a push of the checked-out branch (no refspec, or `HEAD`). `branches` are the
 * destination BRANCH names, with `+` and `refs/heads/` taken off. `forced` is any `+refspec`.
 */
function pushTargets(rest) {
  const flags = [];
  const positional = [];
  for (let i = 0; i < rest.length; i++) {
    const t = rest[i];
    if (t.startsWith("-")) {
      flags.push(t);
      if (PUSH_WITH_VALUE.has(t)) i++;
    } else positional.push(t);
  }
  const refspecs = positional.slice(1);
  const all = flags.some((f) => PUSH_ALL.has(f));
  const tagsOnly = refspecs.length === 0 && flags.includes("--tags");
  const out = { all, current: false, branches: [], forced: false };
  if (refspecs.length === 0) {
    out.current = !all && !tagsOnly;
    return out;
  }
  for (const spec of refspecs) {
    if (spec.startsWith("+")) out.forced = true;
    const s = spec.startsWith("+") ? spec.slice(1) : spec;
    const colon = s.lastIndexOf(":");
    const src = colon === -1 ? s : s.slice(0, colon);
    const dst = colon === -1 ? s : s.slice(colon + 1) || src;
    if (SELF_REF.has(dst) || (colon === -1 && SELF_REF.has(src))) out.current = true;
    else out.branches.push(dst.startsWith("refs/heads/") ? dst.slice("refs/heads/".length) : dst);
  }
  return out;
}

/** The branch checked out when segment `index` runs: `head`, moved by every segment before it. */
function branchBefore(plan, index, head, root) {
  let current = head;
  for (let i = 0; i < index; i++) current = branchStep(plan[i], current, root);
  return current;
}

function branchStep(s, current, root) {
  if (s.kind === "git") return branchAfter(s.args, current);
  if (s.kind === "cd") return branchAfterCd(s.args.find((t) => !t.startsWith("-")), current, root);
  if (s.kind === "popd") return UNKNOWN;
  return current;
}

/**
 * Does segment `index` merge, pull or push into the protected branch? `plan` is every segment as
 * `{ kind: "git" | "cd" | "popd" | "other", args }`; the segments before `index` say which branch is
 * checked out when this one runs.
 */
function reachesProtected(plan, index, { protectedBranch, head, root, before }) {
  // `before`, when given, is the branch checked out before each segment, computed once per command
  // (v9, pleks CF-17): replaying the prefix per git segment was quadratic in the segment count.
  const current = before ? before(index) : branchBefore(plan, index, head, root);
  const s = plan[index];
  if (s.kind !== "git") return false;
  const { verb, rest, elsewhere } = gitVerb(s.args);
  const here = elsewhere ? UNKNOWN : current;
  // NOT_READ (outside the harness) is not UNKNOWN: nothing was read, so nothing is asserted.
  const onProtected = here === protectedBranch || here === UNKNOWN;
  if (verb === "merge") {
    if (rest.some((t) => ["--abort", "--quit", "--continue"].includes(t))) return false;
    return onProtected;
  }
  if (verb === "pull") {
    // A bare pull syncs the branch with its own upstream. Naming ANOTHER branch merges it in.
    const positional = rest.filter((t) => !t.startsWith("-"));
    const merged = positional.slice(1).map((t) => (t.startsWith("+") ? t.slice(1) : t).split(":")[0]);
    return merged.some((b) => b !== here) && onProtected;
  }
  if (verb === "push") {
    const t = pushTargets(rest);
    if (t.all) return true;
    if (t.branches.includes(protectedBranch)) return true;
    return t.current && onProtected;
  }
  return false;
}

const planOf = (segs) =>
  segs.map((s) => ({
    kind: atCommand(s.tokens, "git") ? "git"
      : atCommand(s.tokens, "cd") || atCommand(s.tokens, "pushd") ? "cd"
      : atCommand(s.tokens, "popd") ? "popd" : "other",
    args: argsOf(s.tokens),
  }));

function targetsProtectedBranch(tokens, _text, _command, ctx) {
  if (!atCommand(tokens, "git")) return false;
  const args = argsOf(tokens);
  const b = PROTECTED_BRANCH;
  // NAMED: a PUSH naming the branch as its destination. Until v7 a merge naming it asked too, but a
  // merge's argument is its SOURCE: `git merge main` brings main into the branch you are on, and
  // whether THAT is the protected branch is the BY REFERENCE question below (pleks CF-8).
  if (args.includes("push") &&
    args.some((t) => t === b || t === `origin/${b}` || t === `refs/heads/${b}` || t.endsWith(`:${b}`))) return true;
  // BY REFERENCE: everything else that lands there.
  if (!ctx) return false;
  return reachesProtected(ctx.plan, ctx.index, { protectedBranch: b, head: headBranch(), root: process.env.CLAUDE_PROJECT_DIR || null, before: ctx.before });
}

/**
 * `git push origin +main`: a `+` on a refspec IS `--force` for that ref. v4 read it as a branch name
 * that did not equal `main`, and allowed it (yoros CF-5). Denied with or without a lease flag beside
 * it: what `+` does alongside `--force-with-lease` is not something this file should have to know.
 */
function isForceRefspec(tokens) {
  if (!atCommand(tokens, "git")) return false;
  const { verb, rest } = gitVerb(argsOf(tokens));
  return verb === "push" && pushTargets(rest).forced;
}

/** `gh pr merge`: the base branch is on the server, so the command cannot say where this lands. */
function isPrMerge(tokens) {
  if (!atCommand(tokens, "gh")) return false;
  const args = argsOf(tokens);
  const i = args.indexOf("pr");
  return i !== -1 && args[i + 1] === "merge";
}

function isHardReset(tokens) {
  if (!atCommand(tokens, "git")) return false;
  const args = argsOf(tokens);
  return args.includes("reset") && args.some((t) => spells(t, "--hard", "--ha"));
}

function isForceClean(tokens) {
  if (!atCommand(tokens, "git")) return false;
  const args = argsOf(tokens);
  return args.includes("clean") && args.some((t) => spells(t, "--force", "--f") || SHORT_CLUSTER_WITH_F.test(t));
}

const CANON_DENY = [
  [isDestructiveRm, "rm aimed at a filesystem root or home directory"],
  [isForcePush, "force-push without --force-with-lease (--mirror is one)"],
  [isForceRefspec, "a +refspec force-pushes that ref — push without the +, or use --force-with-lease"],
  [isNoVerify, "--no-verify (or -n on commit, or core.hooksPath) skips the project's own gate"],
  [isSeamAssignment, "sets a hook probe seam — the gate would report PASSED without running"],
];
const CANON_ASK = [
  [targetsProtectedBranch, PROTECTED_REASON],
  [isPrMerge, "gh pr merge merges into the PR's base branch, which is on the server and not in this command — if it is the protected branch, this is the deploy"],
  [isHardReset, "git reset --hard discards uncommitted work with no undo"],
  [isForceClean, "git clean -f deletes untracked files permanently — drafts are untracked until committed"],
];

// A function rule also receives `{ plan, index }`: every segment's kind and arguments, and which one
// this is. Only the protected-branch rule reads it — which branch a segment lands on is decided by
// the segments before it — and a project rule may ignore it.
const fires = (rule, seg, command, ctx) =>
  typeof rule === "function" ? rule(seg.tokens, seg.text, command, ctx) : rule.test(seg.text);

// ── THE BACKSTOP (v7, pleks CF-9 ①) ──
//
// The wrapper table cannot be complete, because the set of commands that run another command is
// open: `winpty git push -f`, `find / -exec rm -rf / \;`, and the next runner nobody has listed.
// pleks's argument, and canon takes it: a gate must fail toward the gate. So after the command word,
// every BARE token naming a command canon's rules key on (`git`, `rm`, `gh`) is tried as a command
// word too, by every deny and ask rule.
//
// Three limits keep the gate from being a wall, which is v2's harvest and still the posture:
//   - A QUOTED token is an argument, never a command: `gh pr create --body "never rm -rf /"`.
//     A runner's quoted string is reached by the wrapper table (`bash -c "…"`), not by this.
//   - A PROSE command's words are text, never run: `echo git push -f`, `grep -rn "rm -rf /" .`.
//   - A bare `#` starts a comment, and nothing after it runs.
// NOT COVERED: a project rule keyed on some other command gets the wrapper table, not this; and a
// command a runner sends elsewhere in quotes (`ssh host "rm -rf /"`), which runs on another machine.
const GATED_NAMES = new Set(["git", "rm", "gh"]);
const PROSE = new Set(["echo", "printf", "grep", "egrep", "fgrep", "rg", "ag", "man", "help", "info", "whatis", "apropos", "which", "type", "whereis", ":", "true", "false"]);

/**
 * Each later command position the backstop tries in one segment, as that position's segment, and the
 * tokens they span. Stops copying once the span passes `budget`, and says so with `over` — a copy per
 * position is the O(n·k) that exhausted v8's heap.
 */
function laterPositions(seg, budget) {
  const cw = commandWordIndex(seg.tokens);
  const out = { positions: [], span: 0, over: false };
  if (cw === -1 || PROSE.has(seg.tokens[cw].replace(/^.*\//, ""))) return out;
  for (let i = cw + 1; i < seg.tokens.length; i++) {
    if (!seg.bare[i]) continue;
    if (seg.tokens[i].startsWith("#")) break;
    if (!GATED_NAMES.has(seg.tokens[i].replace(/^.*\//, ""))) continue;
    out.span += seg.tokens.length - i;
    if (out.span > budget) {
      out.over = true;
      break;
    }
    out.positions.push({ ...seg, tokens: seg.tokens.slice(i), bare: seg.bare.slice(i) });
  }
  return out;
}

// ── BOUNDED WORK (v9, pleks CF-17) ──
//
// A hook that can be made to crash has failed open: Claude Code reads an exit other than 0 or 2 as a
// non-blocking error. v8 ran out of heap on 100 KB of `rm x rm x …` (exit 134, no decision), because
// the backstop copied the rest of the segment once per later `rm`, which is O(n·k), and every rule
// sliced each copy again. Two quadratics in the segment count went with it: the branch replay per
// git segment, and a copy of the whole plan per later position.
//
// Those two are now linear. The backstop's work cannot be, because every rule reads a later position
// as a token array, so it has a BUDGET instead: the tokens all its later positions span. Past it, the
// deny rules still run at every command word, and anything they do not deny is ASKED, never allowed.
// No verdict loosens; only a command too long to read in full is stopped for a human.
const LATER_BUDGET = 100_000;
const OVER_BUDGET = "too long to read past each command word (bash-gate's work budget) — failing to a prompt, not to silence";

/** `plan` with segment `index` read as `self` — a view, so building one per later position is O(1). */
const withSelf = (plan, index, self) =>
  new Proxy(plan, { get: (t, k, r) => (k === String(index) ? self : Reflect.get(t, k, r)) });

function decide(command) {
  // Flag scans run on the message-masked text; the rm rule on the unmasked text, so
  // `-m "rm -rf /"` is prose either way (rm is not at command position there).
  const segs = segments(maskMessageText(command));
  const plan = planOf(segs);
  let span = 0;
  let overBudget = false;
  const later = segs.map((s) => {
    if (overBudget) return [];
    const l = laterPositions(s, LATER_BUDGET - span);
    span += l.span;
    overBudget = l.over;
    return l.positions;
  });
  // The branch checked out before each segment, computed once and only if a rule asks.
  let states = null;
  const before = (i) => {
    if (states === null) {
      const root = process.env.CLAUDE_PROJECT_DIR || null;
      states = [headBranch()];
      for (let k = 0; k < plan.length; k++) states.push(branchStep(plan[k], states[k], root));
    }
    return states[i];
  };
  const hit = (rule) =>
    segs.some((s, index) =>
      fires(rule, s, command, { plan, index, before }) ||
      (!overBudget && later[index].some((l) => fires(rule, l, command, { plan: withSelf(plan, index, planOf([l])[0]), index, before }))));
  for (const [rule, why] of [...CANON_DENY, ...PROJECT_DENY]) {
    if (hit(rule)) return ["deny", why];
  }
  if (overBudget) return ["ask", OVER_BUDGET];
  for (const [rule, why] of [...CANON_ASK, ...PROJECT_ASK]) {
    if (hit(rule)) return ["ask", why];
  }
  return ["allow", "allowed — no gate matched"];
}

// ── v6: WHAT STANDS BEHIND EACH RULE IF THIS HOOK STOPS RUNNING (yoros CF-4) ──
//
// L-16: a rule held at the hook layer alone needs a fallback, reconciled as a set difference. Until
// v6 the fallback was declared per FILE — one `@twin` line anywhere passed — so the difference taken
// was twins against settings, and rules against twins was never taken: two twins backed one rule of
// nine and the check was green. The fallback now sits ON the rule, and this lists every rule with
// its fallback, so a count can see a rule that has none. Canon's rules take theirs from the
// fallbacks region by function name; a project's carry theirs as the third element of the entry.
//
// `node bash-gate.js --fallbacks` prints the list as JSON and reads no stdin. Claude Code never
// passes an argument, so a gating run cannot reach it. `inert` marks the one rule that cannot fire:
// the seam rule, with no seams configured, needs no floor until it has something to hold.
function inventory() {
  const canonRule = (severity) => ([rule, reason]) => ({
    severity,
    owner: "canon",
    rule: rule.name,
    reason,
    fallback: Object.hasOwn(CANON_FALLBACKS, rule.name) ? CANON_FALLBACKS[rule.name] : null,
    inert: rule === isSeamAssignment && SEAM_VARS.length === 0,
  });
  const projectRule = (severity, table) => ([, reason, fallback], i) => ({
    severity,
    owner: "project",
    rule: `${table}[${i}]`,
    reason,
    fallback: fallback ?? null,
    inert: false,
  });
  const names = new Set([...CANON_DENY, ...CANON_ASK].map(([rule]) => rule.name));
  return {
    rules: [
      ...CANON_DENY.map(canonRule("deny")),
      ...PROJECT_DENY.map(projectRule("deny", "PROJECT_DENY")),
      ...CANON_ASK.map(canonRule("ask")),
      ...PROJECT_ASK.map(projectRule("ask", "PROJECT_ASK")),
    ],
    strays: Object.keys(CANON_FALLBACKS).filter((k) => !names.has(k)),
  };
}

/** The gating run: one hook payload on stdin, one decision on stdout. */
function gate() {
  const chunks = [];
  process.stdin.on("data", (d) => chunks.push(d));
  process.stdin.on("end", () => {
    let decision = "allow";
    let reason = "bash-gate: allowed — no gate matched";
    try {
      // Buffers, not string concatenation: a multibyte character split across chunks
      // would corrupt the JSON. A leading BOM (Windows) is stripped — written as the
      // escape so it survives a diff, an editor and a control-byte assertion.
      const raw = Buffer.concat(chunks).toString("utf8").replace(/^\uFEFF/, "");
      const input = JSON.parse(raw);
      if (input === null || typeof input !== "object" || Array.isArray(input)) {
        throw new TypeError("hook input is not an object");
      }
      const command = String(input.tool_input?.command ?? "");
      const [d, why] = decide(command);
      decision = d;
      reason = "bash-gate: " + why;
    } catch {
      decision = "ask";
      reason = "bash-gate: could not parse hook input — failing to a prompt, not to silence";
    }
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: decision, permissionDecisionReason: reason },
      }),
    );
  });
}

if (process.argv.includes("--fallbacks")) {
  process.stdout.write(JSON.stringify(inventory()));
} else {
  gate();
}
