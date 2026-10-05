/**
 * scripts/check-baseline.mjs — run a tier-0 tool and hold it to a recorded baseline.
 *
 *   node scripts/check-baseline.mjs <tsc|eslint|knip|madge>          check against the baseline
 *   node scripts/check-baseline.mjs <tool> --emit > scripts/baseline/<tool>.json   re-seed it
 *
 * WHY. Adoption (2026-10-05) found every tier-0 tool red on code that predates it: tsc 9 errors,
 * eslint 11, knip 21 unused files and 144 unused exports, madge circular imports. Canon's Phase 4
 * rule is to baseline from ground truth with defect-ratchet semantics — the recorded violators are
 * owned debt, anything NEW fails the gate, and the list may only shrink. Adoption fixes none of
 * them; that is a decision for later work (brief/DECISIONS.md).
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
import { existsSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"

const ROOT = process.cwd()
const rel = (p) => relative(ROOT, p).replaceAll("\\", "/")

const TOOLS = {
  tsc: {
    args: ["--noEmit", "--pretty", "false"],
    keys: (out) =>
      [...out.matchAll(/^(.+?)\(\d+,\d+\): error (TS\d+):/gm)].map((m) => `${m[1].replaceAll("\\", "/")} ${m[2]}`),
  },
  eslint: {
    args: ["-f", "json"],
    keys: (out) =>
      JSON.parse(out).flatMap((f) =>
        f.messages.filter((m) => m.severity === 2).map((m) => `${rel(f.filePath)} ${m.ruleId ?? "parse"}`),
      ),
  },
  knip: {
    args: ["--reporter", "json", "--no-progress"],
    keys: (out) =>
      JSON.parse(out).issues.flatMap((issue) =>
        Object.entries(issue).flatMap(([category, items]) =>
          Array.isArray(items) ? items.map((i) => `${category} ${issue.file} ${i.name ?? ""}`.trim()) : [],
        ),
      ),
  },
  madge: {
    args: ["--circular", "--json", "--extensions", "ts,tsx", "app", "components", "lib"],
    keys: (out) => JSON.parse(out.slice(out.indexOf("["))).map((cycle) => cycle.join(" > ")),
  },
}

const tool = process.argv[2]
const spec = TOOLS[tool]
if (!spec) {
  console.error(`usage: node scripts/check-baseline.mjs <${Object.keys(TOOLS).join("|")}> [--emit]`)
  process.exit(2)
}

const bin = join(ROOT, "node_modules", ".bin", tool)
const run = spawnSync(bin, spec.args, { cwd: ROOT, encoding: "utf8", shell: true, maxBuffer: 64 * 1024 * 1024 })
if (run.error) {
  console.error(`❌ ${tool}: could not run — ${run.error.message}`)
  process.exit(1)
}

let found
try {
  found = spec.keys(run.stdout)
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
