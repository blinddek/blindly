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
 * "Exports" are every form: `export function`, `export const f = () =>`, `export const f = g` (an
 * alias, the lib/auth/actions.ts shape) and its spellings (`g as T`, `(g)`, `g!`, `g.bind(x)`,
 * `wrap(g)`), `export const f = wrap(async () => …)`, `export { f, g as h }` (through a local alias
 * too), `export default f`, `export default wrap(…)`, and an anonymous `export default async function`.
 * "Checks its caller" is a call of `ensureAdmin()` (throws), or of `requireAdmin()` whose result is
 * read — returned, tested, or assigned to a name the body reads again — in the export's own body,
 * not inside a nested function, and before the first call that reaches the service key. The guard
 * is the one imported from lib/admin/auth (aliases followed); a same-named function from anywhere
 * else is not. A guard inside a `try` counts only when the try has no `finally` (which runs on the
 * throw) and its `catch` ends in a return or throw and does not itself reach the key. That fails
 * closed on some correct shapes (a catch ending in `redirect()`, an if/else that returns on both
 * branches, a guard imported through a barrel); none is in the tree. A same-module wrapper of either
 * counts as the same kind of guard.
 *
 * NOT COVERED: a guard inside a branch (`if (x) await ensureAdmin()`) counts as a guard; a
 * requireAdmin() result read but not acted on (only logged) counts as read; the service key reached
 * through a value rather than a call (`const f = createAdminClient; f()`), a class method, or a
 * package outside the tree; a catch that exits only on some paths counts as exiting. None of these
 * was found in the tree on 2026-10-11 (walk round 3 checked the aliases it had missed).
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
  "lib/auth/actions.ts → resetPassword": "public by design: an alias of password-reset.ts requestPasswordReset (above)",
  "lib/auth/actions.ts → resetPasswordWithToken": "public by design: an alias of password-reset.ts resetPassword (above) — the emailed token is the credential",
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
/** The function an expression names, in any spelling: `g`, `g as T`, `(g)`, `g!`, `g.bind(x)`,
 *  `wrap(g)` (its last argument that names one). Null for anything else. */
function aliasOf(e) {
  while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e) || ts.isNonNullExpression(e) || ts.isTypeAssertionExpression(e)) e = e.expression;
  if (ts.isIdentifier(e)) return e.text;
  if (ts.isCallExpression(e)) {
    if (ts.isPropertyAccessExpression(e.expression) && e.expression.name.text === "bind") return aliasOf(e.expression.expression);
    for (const a of [...e.arguments].reverse()) { const n = aliasOf(a); if (n) return n; }
  }
  return null;
}

function shape(sf) {
  const aliases = new Map();
  const fns = new Map();
  const exports = new Map();
  const stars = [];
  const imports = new Map();
  const values = new Map();
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
        if (!init || !ts.isIdentifier(d.name)) continue;
        // `const f = async () => …`, or a wrapped one, `const f = wrap(async () => …)`: the function
        // argument is the body that runs.
        const fn = ts.isArrowFunction(init) || ts.isFunctionExpression(init)
          ? init
          : ts.isCallExpression(init) ? [...init.arguments].reverse().find((a) => ts.isArrowFunction(a) || ts.isFunctionExpression(a)) : undefined;
        if (fn) {
          fns.set(d.name.text, fn.body);
          if (exported) exports.set(d.name.text, d.name.text);
        } else {
          // `const f = g` in any spelling: f IS g, a local function or an import (resolved below).
          const a = aliasOf(init);
          if (a) { aliases.set(d.name.text, a); if (exported) exports.set(d.name.text, d.name.text); }
          values.set(d.name.text, init); // a module-level value, e.g. `const sb = createAdminClient()`
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
      else {
        const fn = ts.isArrowFunction(e) || ts.isFunctionExpression(e)
          ? e
          : ts.isCallExpression(e) ? [...e.arguments].reverse().find((a) => ts.isArrowFunction(a) || ts.isFunctionExpression(a)) : undefined;
        if (fn) { fns.set("default", fn.body); exports.set("default", "default"); }
        else { const a = aliasOf(e); if (a) { aliases.set("default", a); exports.set("default", "default"); } }
      }
    }
  }
  // An alias takes its target's body, or its target's import, so every rule below sees through it.
  for (let grew = true; grew; ) {
    grew = false;
    for (const [a, t] of aliases) {
      if (fns.has(a) || imports.has(a)) continue;
      if (fns.has(t)) { fns.set(a, fns.get(t)); grew = true; }
      else if (imports.has(t)) { imports.set(a, imports.get(t)); grew = true; }
    }
  }
  return { fns, exports, stars, imports, values };
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

/** Positions of references to any of `names` in `node` (a module-level value that holds the key). */
function refsIn(node, names) {
  const out = [];
  const visit = (n) => {
    if (ts.isIdentifier(n) && names.has(n.text)) out.push(n.getStart());
    ts.forEachChild(n, visit);
  };
  if (names.size) visit(node);
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

/** The call's promise is awaited or returned — an un-awaited async guard rejects too late to stop anything. */
function awaited(call) {
  let p = call.parent;
  while (p && ts.isParenthesizedExpression(p)) p = p.parent;
  return Boolean(p && (ts.isAwaitExpression(p) || ts.isReturnStatement(p)));
}

/** `node` awaits one of `names` somewhere not inside a `try` block or a nested function. */
function callsOutsideTry(node, names) {
  let found = false;
  const visit = (n, inTry) => {
    if (found || (n !== node && isFnLike(n))) return;
    if (ts.isCallExpression(n) && names.has(calleeKey(n)) && awaited(n) && !inTry) found = true;
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
 * A throw from `call` stops `body` before the key: every enclosing `try` (within body) has no
 * `finally` (it runs on the throw), and a `catch` that ends in a return or throw and does not itself
 * reach the key (`reachesIn`).
 */
function throwEscapes(call, body, reachesIn) {
  for (let n = call; n && n !== body; n = n.parent) {
    const t = n.parent;
    if (t && ts.isTryStatement(t) && t.tryBlock === n) {
      if (t.finallyBlock) return false;
      const last = t.catchClause?.block.statements.at(-1);
      if (t.catchClause && (!last || !(ts.isReturnStatement(last) || ts.isThrowStatement(last)) || reachesIn(t.catchClause.block))) return false;
    }
  }
  return true;
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
      if (member) return Boolean(imp && imp.imported === "*" && (member === SERVICE || importReaches(m.path, { spec: imp.spec, imported: member })));
      return key === SERVICE || Boolean(imp && importReaches(m.path, imp));
    };
    // A module-level value built by a reaching call (`const sb = createAdminClient()`) holds the key;
    // a function that names it reaches it.
    const heldBy = new Set([...m.values].filter(([, init]) => callsIn(init).some((c) => seed(c.key))).map(([n]) => n));
    const reaches = new Set([...m.fns.keys()].filter((n) => callsOf.get(n).some((c) => seed(c.key)) || refsIn(m.fns.get(n), heldBy).length));
    for (let grew = true; grew; ) {
      grew = false;
      for (const n of m.fns.keys()) {
        if (!reaches.has(n) && callsOf.get(n).some((c) => reaches.has(c.key))) { reaches.add(n); grew = true; }
      }
    }
    return { reaches, seed, heldBy };
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

  return { shapeOf, localReach, importReaches, exportsReaching };
}

/** Findings for one module's source: an export that reaches the service key before checking its caller. */
export function auditModule(path, src, publicList = PUBLIC, load = diskLoader) {
  const sf = parse(path, src);
  if (!isActionModule(sf)) return [];
  const ctx = context((p) => (p === path ? { path, src } : load(p)));
  const m = ctx.shapeOf(path);
  const { reaches, seed, heldBy } = ctx.localReach(m);
  const reachKey = (key) => reaches.has(key) || seed(key);

  // The guard is the one lib/admin/auth exports, under whatever local name it is imported as.
  const imported = (names) => new Set([...m.imports].filter(([, i]) => names.has(i.imported) && resolveSpec(path, i.spec) === "lib/admin/auth").map(([local]) => local));
  // A same-module wrapper is a guard too: throwing if it awaits a throwing guard outside any `try`
  // (the throw escapes), returning if it awaits one inside a try or reads a returning guard's result
  // (lib/storage.ts `adminOrError`).
  const throwing = imported(THROWING);
  const returning = imported(RETURNING);
  for (let grew = true; grew; ) {
    grew = false;
    for (const [name, body] of m.fns) {
      if (throwing.has(name) || returning.has(name)) continue;
      if (callsOutsideTry(body, throwing)) { throwing.add(name); grew = true; }
      else if (ownCalls(body).some((c) => (throwing.has(c.key) && awaited(c.call)) || (returning.has(c.key) && resultRead(c.call, body)))) { returning.add(name); grew = true; }
    }
  }

  const out = [];
  for (const spec of m.stars) {
    const stem = resolveSpec(path, spec);
    const t = stem && ctx.shapeOf(stem);
    for (const n of t ? ctx.exportsReaching(t) : []) out.push(`${path} → ${n}: export * from "${spec}" re-exports a function that reaches ${SERVICE} — wrap it here with a guard`);
  }
  for (const [exportName, target] of m.exports) {
    if (publicList[`${path} → ${exportName}`]) continue;
    // A re-export out of a "use server" module is an action of this module too, with no body here to
    // hold a guard: `export { f } from`, or an imported `f` exported again.
    const reExport = typeof target !== "string" ? target : !m.fns.has(target) && m.imports.get(target);
    if (reExport) {
      if (ctx.importReaches(path, reExport)) out.push(`${path} → ${exportName}: re-exports a function that reaches ${SERVICE} — wrap it here with a guard`);
      continue;
    }
    const body = m.fns.get(target);
    if (!body || !reaches.has(target)) continue;
    const firstReach = Math.min(...callsIn(body).filter((c) => reachKey(c.key)).map((c) => c.pos), ...refsIn(body, heldBy));
    const reachesIn = (node) => callsIn(node).some((c) => reachKey(c.key)) || refsIn(node, heldBy).length > 0;
    const guard = ownCalls(body).find((c) => (throwing.has(c.key) && awaited(c.call) && throwEscapes(c.call, body, reachesIn)) || (returning.has(c.key) && resultRead(c.call, body)));
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

/** Files that import `modulePath` — every static import, re-export and `import()` resolved, so a
 *  sibling's `"./actions"` counts as much as `"@/lib/blinds/actions"`. */
function importersOf(modulePath, files, read = (f) => readFileSync(f, "utf8"), relOf = rel) {
  const stem = modulePath.replace(/\.tsx?$/, "").replace(/\/index$/, "");
  const hits = (from, spec) => {
    const r = resolveSpec(from, spec);
    return r != null && r.replace(/\.tsx?$/, "").replace(/\/index$/, "") === stem;
  };
  return files.filter((f) => {
    const from = relOf(f);
    if (from === modulePath) return false;
    const sf = parse(from, read(f));
    let found = false;
    const visit = (n) => {
      if (found) return;
      const spec = (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier) ? n.moduleSpecifier.text
        : ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword && n.arguments[0] && ts.isStringLiteral(n.arguments[0]) ? n.arguments[0].text : null;
      if (spec && hits(from, spec)) found = true;
      ts.forEachChild(n, visit);
    };
    visit(sf);
    return found;
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
  const m = (body) => `"use server";\nimport { createAdminClient } from "@/lib/supabase/admin";\nimport { ensureAdmin, requireAdmin } from "@/lib/admin/auth";\n${body}`;
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

  // Walk round 2 F4/F5 (2026-10-11): shapes the widened version still passed.
  ok(n(`export async function f() { ensureAdmin(); createAdminClient(); }`) === 1, "PLANTED: an UN-AWAITED ensureAdmin() fails — its rejection lands after the write");
  ok(n(`async function g() { await ensureAdmin(); }\nexport async function f() { g(); createAdminClient(); }`) === 1, "PLANTED: an un-awaited throwing wrapper fails");
  ok(raw(`"use server";\nexport { decrement } from "@/lib/helper";`) === 1, "PLANTED: `export { f } from` out of a use-server module fails");
  ok(raw(`"use server";\nexport * from "@/lib/helper";`) === 1, "PLANTED: `export * from` a reaching module fails");
  ok(raw(`"use server";\nimport { decrement } from "@/lib/helper";\nexport { decrement };`) === 1, "PLANTED: an imported helper exported again fails");
  ok(raw(`"use server";\nexport { format } from "@/lib/pure";`) === 0, "KNOWN-GOOD: re-exporting a function that never reaches the key passes");
  ok(raw(`"use server";\nimport * as H from "@/lib/helper";\nexport async function f() { H.decrement(); }`) === 1, "PLANTED: a reaching helper through a NAMESPACE import fails");
  ok(n(`const sb = createAdminClient();\nexport async function f() { await sb.from("t").delete(); }`) === 1, "PLANTED: a MODULE-LEVEL service client used by an export fails");
  ok(n(`const sb = createAdminClient();\nexport async function f() { await ensureAdmin(); await sb.from("t").delete(); }`) === 0, "KNOWN-GOOD: the module-level client behind ensureAdmin() passes");
  ok(n(`const wrap = (fn) => fn;\nexport const f = wrap(async () => { createAdminClient(); });`) === 1, "PLANTED: a WRAPPED export (`export const f = wrap(async () => …)`) fails");
  ok(n(`async function g() { await requireAdmin(); return null; }\nexport async function f() { const d = await g(); if (d) return; createAdminClient(); }`) === 1, "PLANTED: a returning wrapper that discards requireAdmin()'s result is no guard");
  ok(raw(`"use server";\nasync function ensureAdmin() {}\nexport async function f() { await ensureAdmin(); createAdminClient(); }`) === 1, "PLANTED: a LOCAL function named ensureAdmin that checks nothing is no guard");
  // Walk round 3 F1–F3 (2026-10-11).
  ok(n(`async function w() { createAdminClient(); }\nexport const f = w;`) === 1, "PLANTED: an exported ALIAS of a local function (`export const f = w`) fails");
  ok(raw(`"use server";\nimport { decrement } from "@/lib/helper";\nexport const f = decrement;`) === 1, "PLANTED: an exported alias of an imported reaching helper fails");
  ok(raw(`"use server";\nimport { format } from "@/lib/pure";\nexport const f = format;`) === 0, "KNOWN-GOOD: an exported alias of a pure helper passes");
  ok(n(`const wrap = (fn) => fn;\nexport default wrap(async () => { createAdminClient(); });`) === 1, "PLANTED: `export default wrap(async () => …)` fails");
  ok(n(`export async function f() { try { await ensureAdmin(); } catch {} createAdminClient(); }`) === 1, "PLANTED: a guard whose throw is SWALLOWED by try/catch fails");
  ok(n(`export async function f() { try { await ensureAdmin(); } catch { return null; } createAdminClient(); }`) === 0, "KNOWN-GOOD: a guard in a try whose catch returns passes (getAdminNotificationPrefs)");
  ok(n(`export async function f() { try { await ensureAdmin(); } finally { createAdminClient(); } }`) === 1, "PLANTED: a FINALLY that reaches the key runs on the guard's throw — fails");
  ok(raw(`"use server";\nimport { createAdminClient } from "@/lib/supabase/admin";\nimport { ensureAdmin } from "@/lib/noop";\nexport async function f() { await ensureAdmin(); createAdminClient(); }`) === 1, "PLANTED: ensureAdmin imported from ANOTHER module is no guard");
  ok(raw(`"use server";\nimport { createAdminClient } from "@/lib/supabase/admin";\nconst ensureAdmin = Promise.resolve.bind(Promise);\nexport async function f() { await ensureAdmin(); createAdminClient(); }`) === 1, "PLANTED: a module-level VALUE named ensureAdmin is no guard");
  ok(raw(`"use server";\nimport { createAdminClient } from "@/lib/supabase/admin";\nimport { ensureAdmin as gate } from "../lib/admin/auth";\nexport async function f() { await gate(); createAdminClient(); }`.replace("../lib", "./lib")) === 0, "KNOWN-GOOD: the real guard, ALIASED and by relative path, passes");
  // Walk round 4 F2/F3 (2026-10-11).
  const w = `async function w() { createAdminClient(); }\nconst wrap = (fn) => fn;\n`;
  ok(n(w + `export const f = w as any;`) === 1, "PLANTED: `export const f = w as any` fails");
  ok(n(w + `export const f = (w);`) === 1, "PLANTED: `export const f = (w)` fails");
  ok(n(w + `export const f = w!;`) === 1, "PLANTED: `export const f = w!` fails");
  ok(n(w + `export const f = w.bind(null);`) === 1, "PLANTED: `export const f = w.bind(null)` fails");
  ok(n(w + `export const f = wrap(w);`) === 1, "PLANTED: `export const f = wrap(w)` fails");
  ok(n(w + `export default wrap(w);`) === 1, "PLANTED: `export default wrap(w)` fails");
  ok(n(w + `const a = w;\nexport { a as f };`) === 1, "PLANTED: a local alias exported by list fails");
  ok(raw(`"use server";\nimport { decrement } from "@/lib/helper";\nconst a = decrement;\nexport { a as f };`) === 1, "PLANTED: a local alias of an imported reaching helper, exported by list, fails");
  ok(n(`async function w() { await ensureAdmin(); createAdminClient(); }\nexport const f = wrap2(w);\nfunction wrap2(fn) { return fn; }`) === 0, "KNOWN-GOOD: a wrapped alias of a GUARDED function passes");
  ok(n(`export async function f() { try { await ensureAdmin(); } catch { return createAdminClient().from("t").select(); } }`) === 1, "PLANTED: a CATCH that returns through the key fails");
  ok(n(`export async function f() { try { await ensureAdmin(); } catch { await createAdminClient().from("t").delete(); return; } }`) === 1, "PLANTED: a catch that writes with the key, then returns, fails");
  ok(n(`export async function f() { for (const x of [1]) { try { await ensureAdmin(); } finally { continue; } } createAdminClient(); }`) === 1, "PLANTED: a finally that continues past the guard's throw fails");
  const files = { "lib/blinds/x.ts": `import { a } from "./actions";`, "lib/y.ts": `import { a } from "@/lib/blinds/actions";`, "lib/z.ts": `const m = await import("../lib/blinds/actions");`, "lib/w.ts": `import { a } from "./blinds/actions-old";` };
  const users = importersOf("lib/blinds/actions.ts", Object.keys(files), (f) => files[f], (f) => f);
  ok(users.includes("lib/blinds/x.ts"), "PLANTED: a SIBLING relative import of a dead module is seen (F5)");
  ok(users.includes("lib/y.ts") && users.includes("lib/z.ts"), "PLANTED: the alias import and a dynamic import() are seen");
  ok(!users.includes("lib/w.ts"), "KNOWN-GOOD: a module whose name merely starts the same is not an importer");

  console.log(failed ? `\n❌ ${failed} probe(s) wrong` : "\n✅ check-actions probes green — planted violations fail, known-good cases pass");
  process.exit(failed ? 1 : 0);
}

if (process.argv.includes("--selftest")) selftest();
else audit();
