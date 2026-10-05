# HARNESS EXPERIMENT REGISTER

**Observations of one harness version, not documented mechanisms.** This project runs none of its
own yet: it **inherits pleks's register by reference** — `E:\dev\pleks\docs\EXPERIMENTS.md`, same
machine, same operator, same extension — because every result there is a property of the harness,
not of the repo.

**Inherited at:** 2026-10-05, Claude Code **2.1.286** (VS Code extension). The pleks results were
measured on 2.1.235; none has been re-run on 2.1.286 here.

The ones this project's controls rest on:

| E | Result (pleks) | What here depends on it |
|---|---|---|
| E1b | scoped rule files are read-triggered only | no incident-class rule lives in `.claude/rules/` (there are none) |
| E2 | HTML comment blocks stripped; inline end-of-line tags survive | the `@enforced` markers in `CLAUDE.md` |
| E3 | `CLAUDE.md` reaches subagents | the agents' "What reaches you" |
| E7/E8 | `PreToolUse` carries subagent identity; `tools:` frontmatter cannot withhold `Write` | `agent-write-scope` is the write control, not frontmatter |
| E10 | `isolation: "worktree"` bases on `origin/main` | implementer never runs in a worktree |

**Re-run trigger:** a Claude Code major-version upgrade, or any control above behaving unlike its
row. A result measured here gets its own `## E<n>` section below with its version and date, and
supersedes the inherited row.
