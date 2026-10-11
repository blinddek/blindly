#!/usr/bin/env node
/**
 * run-tests — `npm run test`: node:test through tsx, judged by its report as well as its status.
 *
 * Canon L-103, measured here 2026-10-11: a `describe` whose body throws before its first test makes
 * `node --test` print `not ok` on the suite, count `# fail 0`, and EXIT 0 — the gate would pass a
 * suite that tested nothing. So the TAP is written to a file beside the console reporter, and this
 * fails on any `not ok` in it, or on TAP that is missing or names no test.
 *
 *   node scripts/run-tests.mjs            run tests/*.test.ts
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "blindly-tap-"));
const tap = join(dir, "report.tap");
const r = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test",
    "--test-reporter=spec", "--test-reporter-destination=stdout",
    "--test-reporter=tap", `--test-reporter-destination=${tap}`,
    "tests/*.test.ts"],
  { stdio: "inherit" }
);

let report = "";
try { report = readFileSync(tap, "utf8"); } catch { /* judged below */ }
rmSync(dir, { recursive: true, force: true });

const notOk = report.split(/\r?\n/).filter((l) => /^\s*not ok\b/.test(l));
const tests = Number(/^# tests (\d+)/m.exec(report)?.[1] ?? 0);
if (r.status !== 0 || !report || tests === 0 || notOk.length) {
  console.error(`❌ run-tests: exit ${r.status}, ${tests} test(s), ${notOk.length} \`not ok\` line(s) in the TAP${report ? "" : " — NO TAP written"}`);
  for (const l of notOk) console.error(`   ${l.trim()}`);
  process.exit(1);
}
console.log(`✅ run-tests: ${tests} test(s), status 0 and no \`not ok\` in the TAP`);
