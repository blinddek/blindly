#!/usr/bin/env node
/**
 * check-actions — every `"use server"` export that reaches the service key checks its caller.
 *
 * Mechanises CLAUDE.md §5 / docs/MECHANISABLE.md M-002 (scar 2026-10-05: the price-import actions and
 * lib/storage.ts wrote with the service key and no admin check). A module whose first statement is
 * "use server" makes EVERY export a POST endpoint anyone can call with the action id — a feature
 * flag does not disable it. So an exported async function that calls `createAdminClient()`, directly
 * or through a function declared in the same module, must call `ensureAdmin()` (which throws) in its
 * own body, or be listed in PUBLIC with the reason it is public by design.
 *
 * Ported from life-therapy's `server-action-auth` (scripts/architecture-audit.mjs at 1c0a14f), with
 * its parser rather than regexes (canon L-35, L-49): a comment or a string naming a guard is not a
 * guard, and the AST cannot be fooled by either.
 *
 *   node scripts/check-actions.mjs              audit the tree
 *   node scripts/check-actions.mjs --selftest   planted violations fail, known-good cases pass
 */
import ts from "typescript";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const DIRS = ["app", "lib", "components"];
const SERVICE = "createAdminClient";
/** Throws when the caller is not an admin: any call guards. */
const THROWING = new Set(["ensureAdmin"]);
/** Returns `{ error }` instead: a guard only when its result is used, never as a bare statement. */
const RETURNING = new Set(["requireAdmin"]);
const GUARD = "ensureAdmin()/requireAdmin()";

/**
 * Exports that reach the service key with no admin check BY DESIGN, each with its reason. An entry
 * means "read and classified", not "silenced". `module:` entries cover a whole module, and must hold
 * a claim the check re-measures (`importedBy: 0`), so an exception lapses when its premise does.
 */
const PUBLIC = {
  "lib/contact/actions.ts → submitContactForm": "the public contact form: a stranger writes one enquiry",
  "lib/auth/password-reset.ts → requestPasswordReset": "public by design: anyone may ask for a reset link; it writes only a token hash and emails the account's own address",
  "lib/auth/password-reset.ts → resetPassword": "public by design: the emailed token IS the credential — looked up by SHA-256 hash, single use, expiring",
  "lib/newsletter/actions.ts → subscribeNewsletter": "public by design: a stranger subscribes their own email",
  "lib/booking/actions.ts → createBooking": "public by design: a stranger books a session (booking is off in config/site.ts)",
  // Session-guarded, not admin: each derives the caller from auth.getUser() and writes only that user's rows.
  "lib/booking/actions.ts → cancelBookingByCustomer": "session-guarded: sessionIs(userId) refuses an id that is not the caller's own (2026-10-11)",
  "lib/booking/actions.ts → updateClientNotes": "session-guarded: sessionIs(userId) refuses an id that is not the caller's own (2026-10-11)",
  "lib/lms/actions.ts → enrollInCourse": "session-guarded: returns unless auth.getUser() has a user, and enrols that user",
  "lib/lms/actions.ts → markLessonComplete": "session-guarded: returns unless auth.getUser() has a user, and records only that user's completion",
};
const DEAD_MODULES = {
  "lib/blinds/actions.ts": "13 unguarded writes, imported nowhere (CLAUDE.md §9 gotcha 3) — guarded by staying unimported",
};

// ── parsing ─────────────────────────────────────────────────────────────────

const parse = (path, src) =>
  ts.createSourceFile(path, src, ts.ScriptTarget.Latest, true, path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

/** The first statement is the "use server" directive. */
export function isActionModule(sf) {
  const first = sf.statements[0];
  return Boolean(first && ts.isExpressionStatement(first) && ts.isStringLiteral(first.expression) && first.expression.text === "use server");
}

/** Names of every function called inside `node` (identifier callees only: `f()`, `await f()`). */
function calls(node) {
  const out = new Set();
  const visit = (n) => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) out.add(n.expression.text);
    ts.forEachChild(n, visit);
  };
  visit(node);
  return out;
}

/** `node` calls one of `names` somewhere not inside a `try` block. */
function callsOutsideTry(node, names) {
  let found = false;
  const visit = (n, inTry) => {
    if (found) return;
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && names.has(n.expression.text) && !inTry) found = true;
    if (ts.isTryStatement(n)) {
      visit(n.tryBlock, true);
      if (n.catchClause) visit(n.catchClause, inTry);
      if (n.finallyBlock) visit(n.finallyBlock, inTry);
      return;
    }
    ts.forEachChild(n, (c) => visit(c, inTry));
  };
  visit(node, false);
  return found;
}

/**
 * The body checks its caller: it calls a throwing guard, or calls a returning guard and USES the
 * result — `const auth = await requireAdmin()`, `if (await adminOrError())` — not `await requireAdmin();`.
 */
function guarded(body, throwing, returning) {
  let ok = false;
  const visit = (n) => {
    if (ok) return;
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
      const name = n.expression.text;
      if (throwing.has(name)) ok = true;
      else if (returning.has(name)) {
        let p = n.parent;
        while (p && (ts.isAwaitExpression(p) || ts.isParenthesizedExpression(p))) p = p.parent;
        if (p && !ts.isExpressionStatement(p)) ok = true;
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(body);
  return ok;
}

const hasMod =(n, kind) => Boolean(ts.canHaveModifiers(n) && ts.getModifiers(n)?.some((m) => m.kind === kind));

/** Every top-level function in the module, exported or not: { name, exported, body }. */
function functions(sf) {
  const out = [];
  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st) && st.name && st.body) {
      out.push({ name: st.name.text, exported: hasMod(st, ts.SyntaxKind.ExportKeyword), body: st.body });
    } else if (ts.isVariableStatement(st)) {
      const exported = hasMod(st, ts.SyntaxKind.ExportKeyword);
      for (const d of st.declarationList.declarations) {
        const init = d.initializer;
        if (init && ts.isIdentifier(d.name) && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
          out.push({ name: d.name.text, exported, body: init.body });
        }
      }
    }
  }
  return out;
}

/** Findings for one module's source: an unguarded export that reaches the service key. */
export function auditModule(path, src, publicList = PUBLIC) {
  const sf = parse(path, src);
  if (!isActionModule(sf)) return [];
  const fns = functions(sf);
  const callsOf = new Map(fns.map((f) => [f.name, calls(f.body)]));
  // Reaches the service key: calls it, or calls a same-module function that does (to a fixed point).
  const reaches = new Set(fns.filter((f) => callsOf.get(f.name).has(SERVICE)).map((f) => f.name));
  for (let grew = true; grew; ) {
    grew = false;
    for (const f of fns) {
      if (reaches.has(f.name)) continue;
      if ([...callsOf.get(f.name)].some((c) => reaches.has(c))) { reaches.add(f.name); grew = true; }
    }
  }
  // A same-module wrapper is a guard too: throwing if it calls a throwing guard outside any `try`
  // (the throw escapes), returning if it calls a guard at all (lib/storage.ts `adminOrError`).
  const throwing = new Set(THROWING);
  const returning = new Set(RETURNING);
  for (let grew = true; grew; ) {
    grew = false;
    for (const f of fns) {
      if (throwing.has(f.name) || returning.has(f.name)) continue;
      if (callsOutsideTry(f.body, throwing)) { throwing.add(f.name); grew = true; }
      else if ([...callsOf.get(f.name)].some((c) => throwing.has(c) || returning.has(c))) { returning.add(f.name); grew = true; }
    }
  }
  const out = [];
  for (const f of fns) {
    if (!f.exported || !reaches.has(f.name)) continue;
    if (guarded(f.body, throwing, returning)) continue;
    if (publicList[`${path} → ${f.name}`]) continue;
    out.push(`${path} → ${f.name}: reaches ${SERVICE} with no ${GUARD} call — guard it, or list it in PUBLIC with the reason it is public`);
  }
  return out;
}

// ── the tree ────────────────────────────────────────────────────────────────

function walk(dir, out = []) {
  let names;
  try { names = readdirSync(dir); } catch { return out; }
  for (const name of names) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name) && !name.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

const rel = (p) => relative(ROOT, p).split(sep).join("/");

/** Files whose source imports `modulePath` (by its `@/` alias or a relative path ending in it). */
function importersOf(modulePath, files) {
  const stem = modulePath.replace(/\.tsx?$/, "");
  const alias = `@/${stem}`;
  const tail = stem.split("/").slice(-2).join("/");
  return files.filter((f) => {
    if (rel(f) === modulePath) return false;
    const src = readFileSync(f, "utf8");
    return src.includes(`"${alias}"`) || src.includes(`'${alias}'`) || new RegExp(`from ["'][./]+[^"']*${tail}["']`).test(src);
  });
}

function audit() {
  const files = DIRS.flatMap((d) => walk(join(ROOT, d)));
  const findings = [];
  let modules = 0;
  for (const f of files) {
    const path = rel(f);
    const src = readFileSync(f, "utf8");
    if (!isActionModule(parse(path, src))) continue;
    modules++;
    if (DEAD_MODULES[path]) {
      const users = importersOf(path, files);
      if (users.length) findings.push(`${path}: excused as imported nowhere, but ${users.map(rel).join(", ")} import it — its unguarded exports are live`);
      continue;
    }
    findings.push(...auditModule(path, src));
  }
  for (const key of Object.keys(PUBLIC)) {
    const [path, name] = key.split(" → ");
    let src = "";
    try { src = readFileSync(join(ROOT, path), "utf8"); } catch { /* reported below */ }
    if (!functions(parse(path, src)).some((fn) => fn.exported && fn.name === name)) findings.push(`PUBLIC lists ${key}, which does not exist — remove the stale exception`);
  }
  if (findings.length) {
    console.error(`❌ check-actions: ${findings.length} finding(s) across ${modules} "use server" module(s)`);
    for (const f of findings) console.error(`   ${f}`);
    process.exit(1);
  }
  console.log(`🛡️  check-actions: ${modules} "use server" module(s) — every export reaching ${SERVICE} calls ${GUARD} or is public by a listed reason`);
}

// ── selftest ────────────────────────────────────────────────────────────────

function selftest() {
  let failed = 0;
  const ok = (cond, label) => { if (!cond) failed++; console.log(`  ${cond ? "✓" : "✗"} ${label}`); };
  const m = (body) => `"use server";\nimport { createAdminClient } from "@/lib/supabase/admin";\nimport { ensureAdmin } from "@/lib/admin/auth";\n${body}`;
  const n = (body) => auditModule("x.ts", m(body), {}).length;

  ok(n(`export async function f() { const s = createAdminClient(); }`) === 1, "PLANTED: an export calling the service key with no guard fails");
  ok(n(`export async function f() { await ensureAdmin(); const s = createAdminClient(); }`) === 0, "KNOWN-GOOD: the same export with ensureAdmin() passes");
  ok(n(`async function w() { return createAdminClient(); }\nexport async function f() { await w(); }`) === 1, "PLANTED: the service key reached through a same-module helper fails");
  ok(n(`function a() { return createAdminClient(); }\nfunction b() { return a(); }\nexport const f = async () => { b(); };`) === 1, "PLANTED: two helpers deep, through an exported arrow, fails");
  ok(n(`export async function f() { // ensureAdmin()\n const s = createAdminClient(); }`) === 1, "PLANTED: a COMMENT naming the guard is not a guard");
  ok(n(`export async function f() { const g = "ensureAdmin()"; const s = createAdminClient(); }`) === 1, "PLANTED: a STRING naming the guard is not a guard");
  ok(n(`export async function f() { return 1; }`) === 0, "KNOWN-GOOD: an export that never reaches the service key passes");
  ok(auditModule("x.ts", `import { createAdminClient } from "x";\nexport async function f() { createAdminClient(); }`, {}).length === 0, "KNOWN-GOOD: a module without \"use server\" is not an endpoint");
  ok(auditModule("x.ts", `// note\n"use server";\nexport async function f() { createAdminClient(); }`, {}).length === 1, "PLANTED: a comment before the directive still makes it an action module");
  ok(auditModule("x.ts", m(`export async function f() { createAdminClient(); }`), { "x.ts → f": "reason" }).length === 0, "KNOWN-GOOD: a PUBLIC entry with a reason excuses its export");
  ok(n(`export async function f() { const auth = await requireAdmin(); if ("error" in auth) return auth; createAdminClient(); }`) === 0, "KNOWN-GOOD: requireAdmin() with its result used passes");
  ok(n(`export async function f() { await requireAdmin(); createAdminClient(); }`) === 1, "PLANTED: requireAdmin() as a bare statement — result discarded — fails");
  ok(n(`async function g() { try { await ensureAdmin(); return null; } catch { return "no"; } }\nexport async function f() { const d = await g(); if (d) return; createAdminClient(); }`) === 0, "KNOWN-GOOD: a returning local wrapper (adminOrError) with its result used passes");
  ok(n(`async function g() { try { await ensureAdmin(); return null; } catch { return "no"; } }\nexport async function f() { await g(); createAdminClient(); }`) === 1, "PLANTED: the same wrapper as a bare statement fails");
  ok(n(`async function g() { await ensureAdmin(); }\nexport async function f() { await g(); createAdminClient(); }`) === 0, "KNOWN-GOOD: a throwing local wrapper as a bare statement passes");
  // The real scar, as it was: lib/storage.ts before 82d5344 wrote with the service key, no check.
  ok(n(`export async function uploadFile(path, file) { const supabase = createAdminClient(); await supabase.storage.from("media").upload(path, file); }`) === 1, "PLANTED: the 2026-10-05 lib/storage.ts scar shape fails");

  console.log(failed ? `\n❌ ${failed} probe(s) wrong` : "\n✅ check-actions probes green — planted violations fail, known-good cases pass");
  process.exit(failed ? 1 : 0);
}

if (process.argv.includes("--selftest")) selftest();
else audit();
