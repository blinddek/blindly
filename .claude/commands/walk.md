---
description: Adversarial walk of the current work before it goes out — spawn the walker, verify the claims with read agents, fold the findings in
---
<!-- @kit walk v1 — tracked OUTSIDE its KIT:CONFIG regions. Edit it in dev-standards and re-adopt;
     a change outside a region is a fork, and check-kit-drift says so. It restates no spine:
     scripts/check-commands.mjs fails a command that copies one. -->

Walk the work just completed. You are trying to REFUTE the done-report, not confirm it. The walker
does the walking, with a context that never saw the author's reasoning; its method lives in
`.claude/agents/walker.md`, and this command does not restate it.

1. **Pick one slug for this walk** — `walk-<topic>` — and number the spawns in the order you send
   them, one `NN` each. A re-walk takes the next free number; it never reuses one.

2. **Spawn the `walker` in the background**, with this brief and nothing inline:

   ```
   pipeline: walk · step 1 of <N> · artefact: .handoff/walk-<topic>/<NN>-walker.md
   <what was done · the range to walk (below) · the claims under test · the upstream artefacts it may read, by path>
   ```

3. **While it runs, send the claims out — all in ONE message**, so they run concurrently: one
   `db-inspector` per live-data claim, one `census` per repo-wide pattern claim.

   ```
   pipeline: walk · step <NN> of <N> · artefact: .handoff/walk-<topic>/<NN>-db-inspector.md
   pipeline: walk · step <NN> of <N> · artefact: .handoff/walk-<topic>/<NN>-census.md
   ```

   A census brief names the synonym spellings and one known positive: a zero counts only when the
   search demonstrably finds that positive.

4. **Read the artefacts, not the replies.** Each agent returns its contract block. Relay it
   verbatim, and open the artefact at the section it names. Never brief "return your findings as
   text": the artefact is where a finding lives.

5. **Walking inline instead** — no agent available, or a one-line change — means applying
   `.claude/agents/walker.md` §Method in full, every step, and the surfaces below it. A walk run
   from Main that skips steps is weaker than the agent's and reads the same.

6. **Report the surviving findings**, most severe first, each marked as the walker marked it. If
   nothing survived, say so plainly.

**The range this project walks:**

<!-- /* KIT:CONFIG range — yours: the range a walk diffs against */ -->
`origin/main..HEAD`, plus `git diff HEAD` for anything not yet committed.
<!-- /* KIT:CONFIG /range */ -->

**This project's standing walk surfaces** — the checks every walk here adds, and the precedents that
paid for them. Evidence is project property; canon ships this empty.

<!-- /* KIT:CONFIG surfaces — yours: domain surfaces and precedents, each with its cost stated */ -->
- **A change to the PayFast checkout signature is checked against PayFast's documented algorithm
  before it ships.** It reached `main` three times running (84fd8ca, 30548df, 735e607), each
  reversing the last on encoding, before checkout signed correctly. A wrong signature means PayFast
  rejects the payment, so the cost of a miss is a live checkout that cannot take money.
<!-- /* KIT:CONFIG /surfaces */ -->

$ARGUMENTS
