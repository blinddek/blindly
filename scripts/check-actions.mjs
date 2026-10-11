#!/usr/bin/env node
/**
 * check-actions — every `"use server"` export that reaches the service key checks its caller.
 *
 * Mechanises docs/MECHANISABLE.md M-002 (scar 2026-10-05: the price-import actions and lib/storage.ts
 * wrote with the service key and no admin check). A module whose first statement is "use server"
 * makes EVERY export a POST endpoint anyone can call with the action id — a feature flag does not
 * disable it. So an export that reaches `createAdminClient()` must check its caller BEFORE it first
 * reaches it, or be listed in PUBLIC with the reason it is public by design.
 *
 * "Reaches" is followed through: a same-module function; an imported function in any local module
 * (`@/…` or relative, re-exports and `export *` included) that reaches it; an aliased import
 * (`import { createAdminClient as admin }`); a namespace import (`A.createAdminClient()`). A closure
 * inside the export that reaches it counts.
 * "Exports" are every form: `export function`, `export const f = () =>`, `export { f, g as h }`,
 * `export default f`, and an anonymous `export default async function`.
 * "Checks its caller" is a call of `ensureAdmin()` (throws), or of `requireAdmin()` whose result is
 * read — returned, tested, or assigned to a name the body reads again — in the export's own body,
 * not inside a nested function, and before the first call that reaches the service key. A
 * same-module wrapper of either counts as the same kind of guard.
 *
 * NOT COVERED: a guard inside a branch (`if (x) await ensureAdmin()`) counts as a guard; the service
 * key reached through a value rather than a call (`const f = createAdminClient; f()`), a class
 * method, or a package outside the tree. Those shapes do not occur here (2026-10-11).
 *
 * Ported from life-therapy's `server-action-auth` (scripts/architecture-audit.mjs at 1c0a14f), with
 * its parser rather than regexes (canon L-35, L-49): a comment or a string naming a guard is not a
 * guard, and the AST cannot be fooled by either. Widened 2026-10-11 after walk F3 found nine shapes
 * the first version passed.
 *
 *   node scripts/check-actions.mjs              audit the tree
 *   node scripts/check-actions.mjs --selftest   planted violations fail, known-good cases pass
 */
import ts from "typescript";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep, posix } from "node:path";

const ROOT = process.cwd();
const DIRS = ["app", "lib", "components"];
const SERVICE = "createAdminClient";
/** Throws when the caller is not an admin: any call guards. */
const THROWING = new Set(["ensureAdmin"]);
/** Returns `{ error }` instead: a guard only when its result is read. */
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

const hasMod = (n, kind) => Boolean(ts.canHaveModifiers(n) && ts.getModifiers(n)?.some((m) => m.kind === kind));
const isFnLike = (n) => ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n) || ts.isMethodDeclaration(n);

/** The callee of a call as a key: `f` for `f()`, `ns.m` for `ns.m()`; null for anything else. */
function calleeKey(call) {
  const e = call.expression;
  if (ts.isIdentifier(e)) return e.text;
  if (ts.isPropertyAccessExpression(e) && ts.isIdentifier(e.expression)) return `${e.expression.text}.${e.name.text}`;
  return null;
}

/**
 * One module's shape: its top-level functions, what it exports, and where its imports come from.
 *   fns      name → body                 (an anonymous default export is named "default")
 *   exports  export name → local name    (or → { spec, imported } for a re-export)
 *   stars    module specifiers of `export * from`
 *   imports  local name → { spec, imported }   (imported "*" for a namespace import)
 */
function shape(sf) {
  const fns = new Map();
  const exports = new Map();
  const stars = [];
  const imports = new Map();
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier) && st.importClause && !st.importClause.isTypeOnly) {
      const spec = st.moduleSpecifier.text;
      const nb = st.importClause.namedBindings;
      if (nb && ts.isNamespaceImport(nb)) imports.set(nb.name.text, { spec, imported: "*" });
      if (nb && ts.isNamedImports(nb)) {
        for (const el of nb.elements) if (!el.isTypeOnly) imports.set(el.name.text, { spec, imported: (el.propertyName ?? el.name).text });
      }
      if (st.importClause.name) imports.set(st.importClause.name.text, { spec, imported: "default" });
    } else if (ts.isFunctionDeclaration(st) && st.body) {
      const isDefault = hasMod(st, ts.SyntaxKind.DefaultKeyword);
      const name = st.name?.text ?? "default";
      fns.set(name, st.body);
      if (hasMod(st, ts.SyntaxKind.ExportKeyword)) exports.set(isDefault ? "default" : name, name);
    } else if (ts.isVariableStatement(st)) {
      const exported = hasMod(st, ts.SyntaxKind.ExportKeyword);
      for (const d of st.declarationList.declarations) {
        const init = d.initializer;
        if (init && ts.isIdentifier(d.name) && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
          fns.set(d.name.text, init.body);
          if (exported) exports.set(d.name.text, d.name.text);
        }
      }
    } else if (ts.isExportDeclaration(st) && !st.isTypeOnly) {
      const spec = st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier) ? st.moduleSpecifier.text : null;
      if (!st.exportClause) { if (spec) stars.push(spec); continue; }
      if (!ts.isNamedExports(st.exportClause)) continue;
      for (const el of st.exportClause.elements) {
        if (el.isTypeOnly) continue;
        const local = (el.propertyName ?? el.name).text;
        exports.set(el.name.text, spec ? { spec, imported: local } : local);
      }
    } else if (ts.isExportAssignment(st) && !st.isExportEquals) {
      const e = st.expression;
      if (ts.isIdentifier(e)) exports.set("default", e.text);
      else if (ts.isArrowFunction(e) || ts.isFunctionExpression(e)) { fns.set("default", e.body); exports.set("default", "default"); }
    }
  }
  return { fns, exports, stars, imports };
}

/** Every call key in `node`, nested functions included, in source order: [{ key, pos, call }]. */
function callsIn(node) {
  const out = [];
  const visit = (n) => {
    if (ts.isCallExpression(n)) { const key = calleeKey(n); if (key) out.push({ key, pos: n.getStart(), call: n }); }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return out;
}

/** Calls in `node` that are not inside a nested function (the body's own statements). */
function ownCalls(node) {
  const out = [];
  const visit = (n) => {
    if (n !== node && isFnLike(n)) return;
    if (ts.isCallExpression(n)) { const key = calleeKey(n); if (key) out.push({ key, pos: n.getStart(), call: n }); }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return out;
}

/** `node` calls one of `names` somewhere not inside a `try` block or a nested function. */
function callsOutsideTry(node, names) {
  let found = false;
  const visit = (n, inTry) => {
    if (found || (n !== node && isFnLike(n))) return;
    if (ts.isCallExpression(n) && names.has(calleeKey(n)) && !inTry) found = true;
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

/** The result of `call` is read: returned, tested, passed on, or bound to a name `body` reads again. */
function resultRead(call, body) {
  let p = call.parent;
  while (p && (ts.isAwaitExpression(p) || ts.isParenthesizedExpression(p))) p = p.parent;
  if (!p || ts.isExpressionStatement(p)) return false;
  if (ts.isVariableDeclaration(p)) {
    if (!ts.isIdentifier(p.name)) return true; // destructured: `const { error } = …` is a read
    const name = p.name.text;
    let reads = 0;
    const visit = (n) => {
      if (ts.isIdentifier(n) && n.text === name && n !== p.name) reads++;
      ts.forEachChild(n, visit);
    };
    visit(body);
    return reads > 0;
  }
  return true;
}

// ── modules and resolution ──────────────────────────────────────────────────

/** Read a module by repo-relative path, trying the TS extensions and an index file. */
function diskLoader(path) {
  for (const p of [path, `${path}.ts`, `${path}.tsx`, `${path}/index.ts`, `${path}/index.tsx`]) {
    try { if (statSync(join(ROOT, p)).isFile()) return { path: p, src: readFileSync(join(ROOT, p), "utf8") }; } catch { /* next */ }
  }
  return null;
}

/** A local import specifier as a repo-relative path stem, or null for a package. */
function resolveSpec(fromPath, spec) {
  if (spec.startsWith("@/")) return spec.slice(2);
  if (spec.startsWith(".")) return posix.normalize(posix.join(posix.dirname(fromPath), spec));
  return null;
}

/**
 * The context one audit shares: each module parsed once, and each module's set of exports that reach
 * the service key, memoised (a cycle reads as "not yet known", i.e. empty, which is conservative only
 * for the cycle itself — none exists among the modules this reads, per `check:cycles`).
 */
function context(load) {
  const shapes = new Map();
  const reaching = new Map();
  const shapeOf = (path) => {
    if (!shapes.has(path)) {
      const m = load(path);
      shapes.set(path, m ? { path: m.path, ...shape(parse(m.path, m.src)) } : null);
    }
    return shapes.get(path);
  };

  /** Does the imported binding `{ spec, imported }`, seen from `fromPath`, reach the service key? */
  const importReaches = (fromPath, { spec, imported }) => {
    if (imported === SERVICE) return true;
    const stem = resolveSpec(fromPath, spec);
    if (!stem) return false;
    const target = shapeOf(stem);
    return Boolean(target && exportsReaching(target).has(imported));
  };

  /** Within module `m`, the set of local function names that reach the service key. */
  const localReach = (m) => {
    const callsOf = new Map([...m.fns].map(([name, body]) => [name, callsIn(body)]));
    const seed = (key) => {
      const [head, member] = key.split(".");
      const imp = m.imports.get(head);
      if (member) return Boolean(imp && imp.imported === "*" && member === SERVICE);
      return key === SERVICE || Boolean(imp && importReaches(m.path, imp));
    };
    const reaches = new Set([...m.fns.keys()].filter((n) => callsOf.get(n).some((c) => seed(c.key))));
    for (let grew = true; grew; ) {
      grew = false;
      for (const n of m.fns.keys()) {
        if (!reaches.has(n) && callsOf.get(n).some((c) => reaches.has(c.key))) { reaches.add(n); grew = true; }
      }
    }
    return { reaches, seed };
  };

  const exportsReaching = (m) => {
    if (reaching.has(m.path)) return reaching.get(m.path);
    const out = new Set();
    reaching.set(m.path, out); // cycle guard
    const { reaches } = localReach(m);
    for (const [name, target] of m.exports) {
      if (typeof target === "string" ? reaches.has(target) || (m.imports.has(target) && importReaches(m.path, m.imports.get(target))) : importReaches(m.path, target)) out.add(name);
    }
    for (const spec of m.stars) {
      const stem = resolveSpec(m.path, spec);
      const t = stem && shapeOf(stem);
      if (t) for (const n of exportsReaching(t)) out.add(n);
    }
    return out;
  };

  return { shapeOf, localReach };
}

/** Findings for one module's source: an export that reaches the service key before checking its caller. */
export function auditModule(path, src, publicList = PUBLIC, load = diskLoader) {
  const sf = parse(path, src);
  if (!isActionModule(sf)) return [];
  const ctx = context((p) => (p === path ? { path, src } : load(p)));
  const m = ctx.shapeOf(path);
  const { reaches, seed } = ctx.localReach(m);
  const reachKey = (key) => reaches.has(key) || seed(key);

  // A same-module wrapper is a guard too: throwing if it calls a throwing guard outside any `try`
  // (the throw escapes), returning if it calls a guard at all (lib/storage.ts `adminOrError`).
  const throwing = new Set(THROWING);
  const returning = new Set(RETURNING);
  for (let grew = true; grew; ) {
    grew = false;
    for (const [name, body] of m.fns) {
      if (throwing.has(name) || returning.has(name)) continue;
      if (callsOutsideTry(body, throwing)) { throwing.add(name); grew = true; }
      else if (ownCalls(body).some((c) => throwing.has(c.key) || returning.has(c.key))) { returning.add(name); grew = true; }
    }
  }

  const out = [];
  for (const [exportName, target] of m.exports) {
    if (typeof target !== "string") continue; // a re-export from another module is that module's action
    const body = m.fns.get(target);
    if (!body || !reaches.has(target)) continue;
    if (publicList[`${path} → ${exportName}`]) continue;
    const firstReach = Math.min(...callsIn(body).filter((c) => reachKey(c.key)).map((c) => c.pos));
    const guard = ownCalls(body).find((c) => throwing.has(c.key) || (returning.has(c.key) && resultRead(c.call, body)));
    if (guard && guard.pos < firstReach) continue;
    const why = guard ? `checks its caller only after it first reaches ${SERVICE}` : `reaches ${SERVICE} with no ${GUARD} call that guards it`;
    out.push(`${path} → ${exportName}: ${why} — guard it first, or list it in PUBLIC with the reason it is public`);
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
    const m = diskLoader(path);
    if (!m || !shape(parse(path, m.src)).exports.has(name)) findings.push(`PUBLIC lists ${key}, which does not exist — remove the stale exception`);
  }
  if (findings.length) {
    console.error(`❌ check-actions: ${findings.length} finding(s) across ${modules} "use server" module(s)`);
    for (const f of findings) console.error(`   ${f}`);
    process.exit(1);
  }
  console.log(`🛡️  check-actions: ${modules} "use server" module(s) — every export reaching ${SERVICE} checks its caller first, or is public by a listed reason`);
}

// ── selftest ────────────────────────────────────────────────────────────────

function selftest() {
  let failed = 0;
  const ok = (cond, label) => { if (!cond) failed++; console.log(`  ${cond ? "✓" : "✗"} ${label}`); };
  const m = (body) => `"use server";\nimport { createAdminClient } from "@/lib/supabase/admin";\nimport { ensureAdmin } from "@/lib/admin/auth";\n${body}`;
  // An in-memory tree for cross-module probes: lib/helper.ts reaches the key, lib/pure.ts does not,
  // lib/barrel.ts re-exports the helper both ways.
  const tree = {
    "lib/helper.ts": `import { createAdminClient } from "@/lib/supabase/admin";\nexport function decrement() { return createAdminClient(); }`,
    "lib/pure.ts": `export function format() { return 1; }`,
    "lib/barrel.ts": `export { decrement } from "./helper";\nexport * from "./pure";`,
    "lib/star.ts": `export * from "./helper";`,
  };
  const load = (p) => { for (const k of [p, `${p}.ts`]) if (tree[k] != null) return { path: k, src: tree[k] }; return null; };
  const n = (body) => auditModule("x.ts", m(body), {}, load).length;
  const raw = (src) => auditModule("x.ts", src, {}, load).length;

  ok(n(`export async function f() { const s = createAdminClient(); }`) === 1, "PLANTED: an export calling the service key with no guard fails");
  ok(n(`export async function f() { await ensureAdmin(); const s = createAdminClient(); }`) === 0, "KNOWN-GOOD: the same export with ensureAdmin() passes");
  ok(n(`async function w() { return createAdminClient(); }\nexport async function f() { await w(); }`) === 1, "PLANTED: the service key reached through a same-module helper fails");
  ok(n(`function a() { return createAdminClient(); }\nfunction b() { return a(); }\nexport const f = async () => { b(); };`) === 1, "PLANTED: two helpers deep, through an exported arrow, fails");
  ok(n(`export async function f() { // ensureAdmin()\n const s = createAdminClient(); }`) === 1, "PLANTED: a COMMENT naming the guard is not a guard");
  ok(n(`export async function f() { const g = "ensureAdmin()"; const s = createAdminClient(); }`) === 1, "PLANTED: a STRING naming the guard is not a guard");
  ok(n(`export async function f() { return 1; }`) === 0, "KNOWN-GOOD: an export that never reaches the service key passes");
  ok(raw(`import { createAdminClient } from "x";\nexport async function f() { createAdminClient(); }`) === 0, "KNOWN-GOOD: a module without \"use server\" is not an endpoint");
  ok(raw(`// note\n"use server";\nexport async function f() { createAdminClient(); }`) === 1, "PLANTED: a comment before the directive still makes it an action module");
  ok(auditModule("x.ts", m(`export async function f() { createAdminClient(); }`), { "x.ts → f": "reason" }, load).length === 0, "KNOWN-GOOD: a PUBLIC entry with a reason excuses its export");
  ok(n(`export async function f() { const auth = await requireAdmin(); if ("error" in auth) return auth; createAdminClient(); }`) === 0, "KNOWN-GOOD: requireAdmin() with its result used passes");
  ok(n(`export async function f() { await requireAdmin(); createAdminClient(); }`) === 1, "PLANTED: requireAdmin() as a bare statement — result discarded — fails");
  ok(n(`async function g() { try { await ensureAdmin(); return null; } catch { return "no"; } }\nexport async function f() { const d = await g(); if (d) return; createAdminClient(); }`) === 0, "KNOWN-GOOD: a returning local wrapper (adminOrError) with its result used passes");
  ok(n(`async function g() { try { await ensureAdmin(); return null; } catch { return "no"; } }\nexport async function f() { await g(); createAdminClient(); }`) === 1, "PLANTED: the same wrapper as a bare statement fails");
  ok(n(`async function g() { await ensureAdmin(); }\nexport async function f() { await g(); createAdminClient(); }`) === 0, "KNOWN-GOOD: a throwing local wrapper as a bare statement passes");
  // The real scar, as it was: lib/storage.ts before 82d5344 wrote with the service key, no check.
  ok(n(`export async function uploadFile(path, file) { const supabase = createAdminClient(); await supabase.storage.from("media").upload(path, file); }`) === 1, "PLANTED: the 2026-10-05 lib/storage.ts scar shape fails");

  // Walk F3 (2026-10-11): each of these passed the first version.
  ok(raw(`"use server";\nimport { decrement } from "@/lib/helper";\nexport async function f() { decrement(); }`) === 1, "PLANTED: an IMPORTED helper that reaches the key fails (the validateAndDecrementStock shape)");
  ok(raw(`"use server";\nimport { ensureAdmin } from "@/lib/admin/auth";\nimport { decrement } from "@/lib/helper";\nexport async function f() { await ensureAdmin(); decrement(); }`) === 0, "KNOWN-GOOD: the imported helper behind ensureAdmin() passes");
  ok(raw(`"use server";\nimport { format } from "@/lib/pure";\nexport async function f() { format(); }`) === 0, "KNOWN-GOOD: an imported helper that never reaches the key passes");
  ok(raw(`"use server";\nimport { decrement } from "./lib/barrel";\nexport async function f() { decrement(); }`) === 1, "PLANTED: the helper through a RE-EXPORT, by relative path, fails");
  ok(raw(`"use server";\nimport { decrement } from "@/lib/star";\nexport async function f() { decrement(); }`) === 1, "PLANTED: the helper through `export *` fails");
  ok(raw(`"use server";\nimport { format } from "@/lib/barrel";\nexport async function f() { format(); }`) === 0, "KNOWN-GOOD: a pure function through the same barrel passes");
  ok(n(`async function f() { createAdminClient(); }\nexport { f };`) === 1, "PLANTED: an export LIST (`export { f }`) fails");
  ok(n(`async function f() { createAdminClient(); }\nexport { f as g };`) === 1, "PLANTED: a renamed export (`export { f as g }`) fails");
  ok(raw(`"use server";\nimport { createAdminClient as admin } from "@/lib/supabase/admin";\nexport async function f() { admin(); }`) === 1, "PLANTED: an ALIASED import of the key fails");
  ok(raw(`"use server";\nimport * as A from "@/lib/supabase/admin";\nexport async function f() { A.createAdminClient(); }`) === 1, "PLANTED: a NAMESPACE call of the key fails");
  ok(n(`export async function f() { createAdminClient(); await ensureAdmin(); }`) === 1, "PLANTED: ensureAdmin() AFTER the write fails");
  ok(n(`export async function f() { const never = async () => { await ensureAdmin(); }; createAdminClient(); }`) === 1, "PLANTED: ensureAdmin() inside a never-called closure fails");
  ok(n(`export async function f() { const auth = await requireAdmin(); createAdminClient(); }`) === 1, "PLANTED: requireAdmin() bound to a name never read fails");
  ok(n(`export default async function () { createAdminClient(); }`) === 1, "PLANTED: an anonymous default export fails");
  ok(n(`async function f() { createAdminClient(); }\nexport default f;`) === 1, "PLANTED: `export default f` fails");
  ok(n(`export async function f() { await ensureAdmin(); await Promise.all([1].map(async () => createAdminClient())); }`) === 0, "KNOWN-GOOD: the key inside a closure, after the guard, passes");
  ok(n(`export async function f() { await Promise.all([1].map(async () => createAdminClient())); }`) === 1, "PLANTED: the key inside a closure with no guard fails");

  console.log(failed ? `\n❌ ${failed} probe(s) wrong` : "\n✅ check-actions probes green — planted violations fail, known-good cases pass");
  process.exit(failed ? 1 : 0);
}

if (process.argv.includes("--selftest")) selftest();
else audit();
