/**
 * scripts/sync-secrets.mjs — carry the git-ignored credential files between machines.
 *
 *   node scripts/sync-secrets.mjs pull    # OneDrive -> this working copy
 *   node scripts/sync-secrets.mjs push    # this working copy -> OneDrive
 *   node scripts/sync-secrets.mjs status  # compare, change nothing
 *
 * Ported from yoros's `scripts/sync-secrets.mjs` (itself from life-therapy's) so every
 * project behaves the same on a new machine. OneDrive holds ONLY the secrets — never
 * the repo. Override the store with BLINDLY_SECRETS_DIR if OneDrive sits elsewhere.
 *
 * The store is nested under the client (`dev-secrets/nortier/blindly`) because
 * the client has several projects; the repo mirrors that at `E:\dev\nortier\blindly`.
 *
 * Two guards, both inherited from yoros:
 *  - `pull`/`push` verify with `git check-ignore` that each file is actually ignored
 *    before copying it. A live service-role key landing in a tracked path is one
 *    `git add -A` from a public repository.
 *  - It refuses to run inside OneDrive. This repo lived in OneDrive until 2026-10-05;
 *    syncing `.git` and `node_modules` corrupts both (L-32).
 */
import { existsSync, mkdirSync, copyFileSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";

const STORE =
  process.env.BLINDLY_SECRETS_DIR ??
  join(homedir(), "OneDrive", "dev-secrets", "nortier", "blindly");

/** [pathInRepo, nameInStore] */
const FILES = [
  [".env.local", ".env.local"],
  [join(".claude", "settings.local.json"), "settings.local.json"],
];

const mode = process.argv[2] ?? "status";
if (!["pull", "push", "status"].includes(mode)) {
  console.error(`Unknown mode "${mode}". Use pull, push or status.`);
  process.exit(1);
}

if (/onedrive/i.test(process.cwd())) {
  console.error(`REFUSED: this checkout is inside OneDrive.\n  ${process.cwd()}`);
  console.error("Syncing .git and node_modules corrupts both. Move it to E:\\dev\\nortier\\blindly.");
  process.exit(1);
}

if (!existsSync(STORE)) {
  if (mode === "pull") {
    console.error(`Secrets store not found: ${STORE}`);
    console.error("Is OneDrive signed in on this machine? Or set BLINDLY_SECRETS_DIR.");
    process.exit(1);
  }
  mkdirSync(STORE, { recursive: true });
}

/**
 * Is this path ignored by git? Deliberately without `--no-index`: a file that is
 * already TRACKED matches .gitignore and is committed anyway, and that is exactly
 * the state this guard must refuse. Anything but a clean exit 0 is "not proven ignored".
 */
function isIgnored(repoRel) {
  const res = spawnSync("git", ["check-ignore", "-q", repoRel], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
  return res.status === 0;
}

const digest = (p) => (existsSync(p) ? readFileSync(p, "utf8") : null);
const when = (p) =>
  existsSync(p) ? statSync(p).mtime.toISOString().slice(0, 16).replace("T", " ") : "—";

let changed = 0;
let refused = 0;

for (const [repoRel, storeName] of FILES) {
  const repoPath = join(process.cwd(), repoRel);
  const storePath = join(STORE, storeName);
  const a = digest(repoPath);
  const b = digest(storePath);

  if (mode === "status") {
    let state;
    if (a === null && b === null) state = "missing both sides";
    else if (a === null) state = "only in OneDrive — run `pull`";
    else if (b === null) state = "only here — run `push`";
    else state = a === b ? "in sync" : `DIFFERENT (here ${when(repoPath)}, store ${when(storePath)})`;
    const guard = isIgnored(repoRel) ? "" : "  ** NOT GITIGNORED **";
    console.log(`  ${repoRel.padEnd(30)} ${state}${guard}`);
    continue;
  }

  if (!isIgnored(repoRel)) {
    console.error(`  REFUSED ${repoRel} — not gitignored. Add it to .gitignore first.`);
    refused++;
    continue;
  }

  const [from, to] = mode === "pull" ? [storePath, repoPath] : [repoPath, storePath];
  if (!existsSync(from)) {
    console.log(`  skip ${repoRel} — nothing to copy from ${mode === "pull" ? "OneDrive" : "here"}`);
    continue;
  }
  if (a !== null && b !== null && a === b) {
    console.log(`  ok   ${repoRel} — already identical`);
    continue;
  }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  changed++;
  console.log(`  ${mode === "pull" ? "pulled" : "pushed"} ${repoRel}`);
}

if (mode !== "status") {
  console.log(`\n${changed} file(s) ${mode === "pull" ? "pulled from" : "pushed to"} ${STORE}`);
  if (refused > 0) process.exit(1);
}
