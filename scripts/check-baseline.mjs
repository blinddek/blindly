/**
 * scripts/check-baseline.mjs — run a tier-0 tool and hold it to a recorded baseline.
 *
 * @kit check-baseline v1 — tracked OUTSIDE its `KIT:CONFIG` region. The region is yours; everything
 * else is canon's, and `check-kit-drift.mjs` says so if it changes here.
 *
 *   node scripts/check-baseline.mjs <tsc|eslint|knip|madge>          check against the baseline
 *   node scripts/check-baseline.mjs <tool> --emit > scripts/baseline/<tool>.json   re-seed it
 *   node scripts/check-baseline.mjs --slots       which tier-0 slot each tool fills (check-tier0 reads it)
 *   node scripts/check-baseline.mjs --selftest    drives fake tool binaries through every verdict
 *
 * Gate it as the slot's own script — `"check:lint": "node scripts/check-baseline.mjs eslint"` — and
 * canon's check-tier0 reports that slot as held by a ratchet rather than green. A tool that is
 * already clean needs none of this: wire it directly.
 *
 * WHY. blindly adopted (2026-10-05) with every tier-0 tool red on code that predates it: tsc 9
 * errors, eslint 11, knip 201, madge 7. Canon's Phase 4 rule (1-NEW-PROJECT) is to baseline from
 * ground truth with defect-ratchet semantics — the recorded violators are owned debt, anything NEW
 * fails the gate, and the list may only shrink — and canon shipped nothing to hold it, so blindly
 * wrote this (373706a, 661c87a). v1 (2026-10-08, blindly CF-1) is those bytes plus: madge's source
 * roots as the project's region, the binary path quoted so a checkout under a folder with a space
 * still runs, `--slots`, and `--selftest`.
 *
 * THE RATCHET FAILS IN BOTH DIRECTIONS, like check-claude-md's. A violation that is not in the
 * baseline fails. A baseline entry that no longer occurs ALSO fails, so a fix lands together with
 * the shrunken baseline — otherwise the slack it frees would silently admit a new violation later.
 *
 * Keys carry no line numbers, so editing a file does not churn its entries: tsc and eslint are
 * counted per file + rule, knip per category + file + name, madge per cycle.
 *
 * It PRINTS rather than writes on --emit. Seeding a ratchet is a deliberate act with a diff.
 */
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = process.cwd()
const rel = (p) => relative(ROOT, p).replaceAll("\\", "/")

/* KIT:CONFIG madge — the extensions and source roots madge reads. These are blindly's (Next.js). */
const MADGE_SOURCES = ["--extensions", "ts,tsx", "app", "components", "lib"]
/* KIT:CONFIG /madge */

const TOOLS = {
  tsc: {
    slot: "types",
    args: ["--noEmit", "--pretty", "false"],
    // tsc has no machine format, so its exit status is the cross-check on the regex: a failing run
    // with nothing parsed (a crash, a config error, a changed format) is unreadable, not clean.
    keys: (out, status) => {
      const found = [...out.matchAll(/^(.+?)\(\d+,\d+\): error (TS\d+):/gm)].map((m) => `${m[1].replaceAll("\\", "/")} ${m[2]}`)
      if (status !== 0 && found.length === 0) throw new Error(`tsc exited ${status} but no error line parsed:\n${out.slice(0, 2000)}`)
      if (status === 0 && found.length > 0) throw new Error(`tsc exited 0 yet ${found.length} error line(s) parsed`)
      return found
    },
  },
  eslint: {
    slot: "lint",
    args: ["-f", "json"],
    keys: (out) =>
      JSON.parse(out).flatMap((f) =>
        f.messages.filter((m) => m.severity === 2).map((m) => `${rel(f.filePath)} ${m.ruleId ?? "parse"}`),
      ),
  },
  knip: {
    slot: "dead-code",
    args: ["--reporter", "json", "--no-progress"],
    keys: (out) =>
      JSON.parse(out).issues.flatMap((issue) =>
        Object.entries(issue).flatMap(([category, items]) =>
          Array.isArray(items) ? items.map((i) => `${category} ${issue.file} ${i.name ?? ""}`.trim()) : [],
        ),
      ),
  },
  madge: {
    slot: "cycles",
    args: ["--circular", "--json", ...MADGE_SOURCES],
    keys: (out) => JSON.parse(out.slice(out.indexOf("["))).map((cycle) => cycle.join(" > ")),
  },
}

if (process.argv.includes("--slots")) {
  console.log(JSON.stringify(Object.fromEntries(Object.entries(TOOLS).map(([t, s]) => [t, s.slot]))))
  process.exit(0)
}

/* ── selftest ─────────────────────────────────────────────────────────────────────────────────
 * Spawns THIS file, as the gate does, in a fixture whose node_modules/.bin holds fake tools that
 * print a canned output and exit with a canned status. Asserted on exit code AND a line, because a
 * ratchet that exits 0 on every path prints a plausible line on every path too. The fixture folder
 * has a space in its name: the gate runs the binary through a shell, and an unquoted path splits. */
if (process.argv.includes("--selftest")) {
  const SELF = fileURLToPath(import.meta.url)
  const dir = mkdtempSync(join(tmpdir(), "check baseline-"))
  const bin = join(dir, "node_modules", ".bin")
  mkdirSync(bin, { recursive: true })
  mkdirSync(join(dir, "scripts", "baseline"), { recursive: true })
  writeFileSync(
    join(bin, "fake.mjs"),
    'import { readFileSync } from "node:fs"\n' +
      'process.stdout.write(readFileSync("fake-out.txt", "utf8"))\n' +
      'process.exit(Number(readFileSync("fake-status.txt", "utf8")))\n',
  )
  for (const t of ["tsc", "eslint"]) {
    writeFileSync(join(bin, t), '#!/bin/sh\nexec node "$(dirname "$0")/fake.mjs" "$@"\n', { mode: 0o755 })
    writeFileSync(join(bin, `${t}.cmd`), '@node "%~dp0fake.mjs" %*\r\n')
  }

  const eslintOut = (...rules) =>
    JSON.stringify([{ filePath: join(dir, "a.ts"), messages: [...rules.map((ruleId) => ({ severity: 2, ruleId })), { severity: 1, ruleId: "warn-only" }] }])
  const run = ({ tool, out, status = 0, baseline, args = [] }) => {
    writeFileSync(join(dir, "fake-out.txt"), out ?? "")
    writeFileSync(join(dir, "fake-status.txt"), String(status))
    const path = join(dir, "scripts", "baseline", `${tool}.json`)
    rmSync(path, { force: true })
    if (baseline) writeFileSync(path, JSON.stringify({ tool, seeded: "2026-10-08", violations: baseline }))
    return spawnSync(process.execPath, [SELF, tool, ...args], { cwd: dir, encoding: "utf8" })
  }

  const CASES = [
    ["KNOWN-GOOD: at its baseline (a warning is not counted)", { tool: "eslint", out: eslintOut("no-x"), status: 1, baseline: { "a.ts no-x": 1 } }, 0, /at its baseline \(1 owned violation,/],
    ["KNOWN-GOOD: tsc clean against an empty baseline", { tool: "tsc", out: "", baseline: {} }, 0, /at its baseline \(0 owned/],
    ["a violation not in the baseline", { tool: "eslint", out: eslintOut("no-x", "no-y"), status: 1, baseline: { "a.ts no-x": 1 } }, 1, /1 violation\(s\) not in the baseline/],
    ["a known key occurring MORE often than recorded", { tool: "eslint", out: eslintOut("no-x", "no-x"), status: 1, baseline: { "a.ts no-x": 1 } }, 1, /a\.ts no-x {2}\(1 → 2\)/],
    ["a baseline entry that no longer occurs — the slack must not stay open", { tool: "eslint", out: eslintOut("no-x"), status: 1, baseline: { "a.ts no-x": 1, "b.ts no-z": 1 } }, 1, /no longer occur/],
    ["output that does not parse is not a clean tree", { tool: "eslint", out: "Oops! Something went wrong", status: 2, baseline: {} }, 1, /did not parse/],
    ["tsc failing with no error line parsed (a config error, a crash)", { tool: "tsc", out: "error TS5083: Cannot read file 'tsconfig.json'.", status: 2, baseline: {} }, 1, /exited 2 but no error line parsed/],
    ["tsc exiting 0 with error lines parsed", { tool: "tsc", out: "a.ts(1,1): error TS2322: x", status: 0, baseline: {} }, 1, /exited 0 yet 1 error line/],
    ["no baseline recorded", { tool: "eslint", out: eslintOut(), status: 0 }, 1, /no baseline at scripts\/baseline\/eslint\.json/],
    ["a tool that is not installed (no fake knip)", { tool: "knip", baseline: {} }, 1, /knip: (could not run|output did not parse)/],
    ["a tool the wrapper does not know", { tool: "prettier" }, 2, /usage:/],
  ]
  let failed = 0
  try {
    for (const [label, input, wantStatus, wantLine] of CASES) {
      const r = run(input)
      const ok = r.status === wantStatus && wantLine.test(r.stdout + r.stderr)
      if (!ok) failed++
      console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `\n      exit ${r.status}, wanted ${wantStatus}: ${(r.stdout + r.stderr).trim().slice(0, 400)}`}`)
    }
    // --emit is how the baseline is seeded, so what it prints must be what the check reads back.
    const e = run({ tool: "eslint", out: eslintOut("no-x", "no-x", "no-y"), status: 1, args: ["--emit"] })
    let emitted = null
    try {
      emitted = JSON.parse(e.stdout).violations
    } catch {
      /* stays null and fails below */
    }
    const seeded = e.status === 0 && JSON.stringify(emitted) === JSON.stringify({ "a.ts no-x": 2, "a.ts no-y": 1 })
    if (!seeded) failed++
    console.log(`  ${seeded ? "✓" : "✗"} --emit prints the counts the check reads back${seeded ? "" : ` — exit ${e.status}: ${e.stdout.slice(0, 300)}`}`)
    const reread = run({ tool: "eslint", out: eslintOut("no-x", "no-x", "no-y"), status: 1, baseline: emitted ?? {} })
    const roundTrip = reread.status === 0
    if (!roundTrip) failed++
    console.log(`  ${roundTrip ? "✓" : "✗"} …and a baseline seeded from it is at its baseline on the same tree`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
  console.log(failed ? `\n❌ ${failed} case(s) wrong` : "\n✅ check-baseline: holds in both directions, and fails on what it cannot read")
  process.exit(failed ? 1 : 0)
}

const tool = process.argv[2]
const spec = TOOLS[tool]
if (!spec) {
  console.error(`usage: node scripts/check-baseline.mjs <${Object.keys(TOOLS).join("|")}> [--emit]`)
  process.exit(2)
}

const bin = join(ROOT, "node_modules", ".bin", tool)
const run = spawnSync(`"${bin}"`, spec.args, { cwd: ROOT, encoding: "utf8", shell: true, maxBuffer: 64 * 1024 * 1024 })
if (run.error) {
  console.error(`❌ ${tool}: could not run — ${run.error.message}`)
  process.exit(1)
}

let found
try {
  found = spec.keys(run.stdout, run.status)
} catch (err) {
  // An output we cannot parse is a failure, never an empty list: zero findings parsed from garbage
  // reads exactly like a clean tree.
  console.error(`❌ ${tool}: output did not parse (${err.message}). stderr:\n${run.stderr}`)
  process.exit(1)
}

const counts = {}
for (const k of found) counts[k] = (counts[k] ?? 0) + 1

if (process.argv.includes("--emit")) {
  const sorted = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)))
  console.log(JSON.stringify({ tool, seeded: new Date().toISOString().slice(0, 10), violations: sorted }, null, 2))
  process.exit(0)
}

const path = join(ROOT, "scripts", "baseline", `${tool}.json`)
if (!existsSync(path)) {
  console.error(`❌ ${tool}: no baseline at ${rel(path)}. Seed it: node scripts/check-baseline.mjs ${tool} --emit > ${rel(path)}`)
  process.exit(1)
}
const baseline = JSON.parse(readFileSync(path, "utf8")).violations

const grown = []
const shrunk = []
for (const k of new Set([...Object.keys(counts), ...Object.keys(baseline)])) {
  const now = counts[k] ?? 0
  const was = baseline[k] ?? 0
  if (now > was) grown.push(`  + ${k}  (${was} → ${now})`)
  if (now < was) shrunk.push(`  - ${k}  (${was} → ${now})`)
}

const total = Object.values(baseline).reduce((a, b) => a + b, 0)
if (grown.length) {
  console.error(`❌ ${tool}: ${grown.length} violation(s) not in the baseline — new debt is not admitted:\n${grown.join("\n")}`)
}
if (shrunk.length) {
  console.error(
    `❌ ${tool}: ${shrunk.length} baseline entr${shrunk.length === 1 ? "y" : "ies"} no longer occur — good; now shrink the baseline in the same commit:\n` +
      `${shrunk.join("\n")}\n  node scripts/check-baseline.mjs ${tool} --emit > ${rel(path)}`,
  )
}
if (grown.length || shrunk.length) process.exit(1)
console.log(`🔒 ${tool}: at its baseline (${total} owned violation${total === 1 ? "" : "s"}, may only fall)`)
