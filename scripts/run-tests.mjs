#!/usr/bin/env node
/**
 * run-tests — `npm run test`: node:test through tsx, judged by its report as well as its status.
 *
 * Canon L-103, measured here 2026-10-11: a `describe` whose body throws before its first test makes
 * `node --test` print `not ok` on the suite, count `# fail 0`, and EXIT 0 — the gate would pass a
 * suite that tested nothing. So the TAP is written to a file beside the console reporter, and this
 * fails on any `not ok` in it, or on TAP that is missing or names no test.
 *
 * The same hole at file granularity (walk round 3 F5): run together, each file is itself a "test", so
 * an empty file, or one that calls `process.exit(0)`, counted as one passing test. Each file now runs
 * alone, in-process (`--experimental-test-isolation=none`, Node 22), and must report at least one test of its own, finish
 * its TAP summary, and skip nothing.
 *
 *   node scripts/run-tests.mjs            run tests/*.test.ts
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const files = readdirSync("tests").filter((f) => f.endsWith(".test.ts")).sort().map((f) => `tests/${f}`);
const dir = mkdtempSync(join(tmpdir(), "blindly-tap-"));
const bad = [];
let total = 0;

for (const [i, file] of files.entries()) {
  const tap = join(dir, `${i}.tap`);
  const r = spawnSync(
    process.execPath,
    ["--import", "tsx", "--test", "--experimental-test-isolation=none",
      "--test-reporter=spec", "--test-reporter-destination=stdout",
      "--test-reporter=tap", `--test-reporter-destination=${tap}`,
      file],
    { stdio: "inherit" }
  );
  let report = "";
  try { report = readFileSync(tap, "utf8"); } catch { /* judged below */ }
  const count = (k) => Number(new RegExp(`^# ${k} (\\d+)`, "m").exec(report)?.[1] ?? 0);
  const lines = report.split(/\r?\n/);
  const notOk = lines.filter((l) => /^\s*not ok\b/.test(l)).map((l) => l.trim());
  // An empty file is still reported as one passing test named after the file: not a test.
  const tests = count("tests") - lines.filter((l) => /^\s*ok \d+ - \S*\.test\.ts$/.test(l)).length;
  const why = [
    r.status !== 0 && `exit ${r.status}`,
    !report && "no TAP written",
    report && !/^# duration_ms/m.test(report) && "TAP has no summary (the process ended early)",
    tests <= 0 && "no tests",
    count("skipped") > 0 && `${count("skipped")} skipped`,
    notOk.length > 0 && `${notOk.length} \`not ok\`: ${notOk.join(" | ")}`,
  ].filter(Boolean);
  if (why.length) bad.push(`${file}: ${why.join("; ")}`);
  total += tests;
}
rmSync(dir, { recursive: true, force: true });

if (files.length === 0 || bad.length) {
  console.error(`❌ run-tests: ${files.length === 0 ? "no tests/*.test.ts" : `${bad.length} of ${files.length} file(s) wrong`}`);
  for (const b of bad) console.error(`   ${b}`);
  process.exit(1);
}
console.log(`✅ run-tests: ${total} test(s) in ${files.length} file(s), each exiting 0 with a complete TAP and no \`not ok\` or skip`);
