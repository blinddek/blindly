# Brief — <PROJECT>

> **The index, and nothing else.** Arguments live in the file that owns them and get one line here.
> Conforms to `dev-standards/standards/BRIEF-STANDARD.md` v1.1.

**What this project is, in three sentences.** <Replace. Enough for a session that has never seen the
repo to know what it is looking at. Not a pitch.>

**This brief is TRACKED / SYNCED.** <Delete one. Tracked is the default; synced means the checker
runs advisory-only and staleness comes from mtime rather than git. §5 of the standard.>

## The spine

| File | What it settles |
|---|---|
| `EVIDENCE.md` | Every fact, with its source. **Nothing here may state a fact that is not in it.** |
| `DECISIONS.md` | What was settled, and what it supersedes. |
| `GATES.md` | What is blocked, on whom, since when. **Read this to know what is waiting on you.** |
| `CURRENT.md` | Where the work is right now. Written every step. ≤ 8 KB. |
| `STATUS.md` | Generated. Never hand-edited. |

## The folders — sorted by what you DO with a document

| Folder | Verb | Belongs here if… |
|---|---|---|
| `product/` | argue | changing it would change what we build |
| `build/` | follow | it tells you how to make the thing |
| `design/` | match | something has to look or behave like this |
| `runbooks/` | run | it is a procedure a person executes |
| `legal/` | comply | someone outside imposed it |
| `research/` | consult | it is an input to a decision, not the decision |
| `vendors/` | check | it is someone else's contract |

Each folder carries its own `README.md` indexing its files.

## Build order

<Delete if there isn't one. If there is, it is the most useful thing on this page.>
