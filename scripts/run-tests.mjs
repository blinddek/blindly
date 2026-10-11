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
 * In-process, `.only` is honoured without `--test-only` and the tests it drops are not reported at
 * all (walk round 4 F1), so a file that names `only` is refused before it runs; a `todo` does not
 * test, so a file with one fails too.
 *
 *   node scripts/run-tests.mjs            run tests/*.test.ts
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";

/**
 * The file asks for `only`, in any spelling the parser can see: `.only`, `["only"]`, an `only` option
 * (`only: true`, `"only": true`, `["only"]: true`, shorthand `{ only }`), a destructured one
 * (`const { only } = test`), a computed object key that is not a literal, or a computed member of a
 * runner (`test[k]`), which could be either. The runners are test/it/describe/suite and every local
 * name bound by an import from node:test, so `import { test as t }` makes `t[k]` one too (walk round 5
 * F3). Comments and strings are not code, so "digits only: no fractions" in a comment is not refused
 * (walk g12-g13 F5). NOT COVERED: an option object built elsewhere and spread in.
 */
function namesOnly(file, src) {
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const runners = new Set(["test", "it", "describe", "suite"]);
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier) || !/^(node:)?test$/.test(st.moduleSpecifier.text)) continue;
    const c = st.importClause;
    if (c?.name) runners.add(c.name.text);
    if (c?.namedBindings && ts.isNamespaceImport(c.namedBindings)) runners.add(c.namedBindings.name.text);
    if (c?.namedBindings && ts.isNamedImports(c.namedBindings)) for (const el of c.namedBindings.elements) runners.add(el.name.text);
  }
  const isRunner = (e) => (ts.isIdentifier(e) && runners.has(e.text)) || (ts.isPropertyAccessExpression(e) && isRunner(e.expression));
  const isOnly = (name) => {
    if (!name) return false;
    if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) return name.text === "only";
    if (ts.isComputedPropertyName(name)) {
      const e = name.expression;
      return ts.isStringLiteralLike(e) ? e.text === "only" : !ts.isNumericLiteral(e);
    }
    return false;
  };
  let hit = false;
  const visit = (n) => {
    if (hit) return;
    if (ts.isPropertyAccessExpression(n) && n.name.text === "only") hit = true;
    else if (ts.isElementAccessExpression(n)) {
      const a = n.argumentExpression;
      if (ts.isStringLiteralLike(a) ? a.text === "only" : isRunner(n.expression)) hit = true;
    } else if ((ts.isPropertyAssignment(n) || ts.isShorthandPropertyAssignment(n)) && isOnly(n.name)) hit = true;
    else if (ts.isBindingElement(n) && ts.isObjectBindingPattern(n.parent) && isOnly(n.propertyName ?? n.name)) hit = true;
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return hit;
}

/** Probes, both directions: `node scripts/run-tests.mjs --selftest`. */
if (process.argv.includes("--selftest")) {
  const imp = `import { test } from "node:test";\n`;
  const cases = [
    [imp + `test.only("a", () => {});`, true, "`.only`"],
    [imp + `test["only"]("a", () => {});`, true, "`[\"only\"]`"],
    [imp + `test("a", { only: true }, () => {});`, true, "an `only` option"],
    [imp + `test("a", { ["only"]: true }, () => {});`, true, "a computed `[\"only\"]` key"],
    [imp + `const k = "on" + "ly";\ntest("a", { [k]: true }, () => {});`, true, "a computed non-literal key"],
    [imp + `const { only } = test;\nonly("a", () => {});`, true, "a destructured `only`"],
    [imp + `const { only: o } = test;\no("a", () => {});`, true, "a destructured, renamed `only`"],
    [`import { test as t } from "node:test";\nconst k = "only";\nt[k]("a", () => {});`, true, "an aliased runner's computed member"],
    [`import * as nt from "node:test";\nconst k = "only";\nnt.test[k]("a", () => {});`, true, "a namespace runner's computed member"],
    [imp + `// digits only: no fractions\ntest("a", () => { const xs = [1]; xs[0]; });`, false, "a comment and an array index"],
    [imp + `test("a", () => { const { total } = { total: 1 }; const m = { [0]: 1 }; });`, false, "an ordinary destructure and a numeric key"],
  ];
  let failed = 0;
  for (const [src, want, what] of cases) {
    const got = namesOnly("probe.test.ts", src);
    if (got !== want) failed++;
    console.log(`  ${got === want ? "✓" : "✗"} ${want ? "PLANTED" : "KNOWN-GOOD"}: ${what} ${want ? "is refused" : "passes"}`);
  }
  console.log(failed ? `\n❌ ${failed} probe(s) wrong` : "\n✅ run-tests probes green");
  process.exit(failed ? 1 : 0);
}

const files = readdirSync("tests").filter((f) => f.endsWith(".test.ts")).sort().map((f) => `tests/${f}`);
const dir = mkdtempSync(join(tmpdir(), "blindly-tap-"));
const bad = [];
let total = 0;

for (const [i, file] of files.entries()) {
  if (namesOnly(file, readFileSync(file, "utf8"))) {
    bad.push(`${file}: names \`only\` — in-process it silently drops the file's other tests`);
    continue;
  }
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
    count("todo") > 0 && `${count("todo")} todo`,
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
