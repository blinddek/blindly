# MECHANISABLE — the mechanisation build queue

Rules in `CLAUDE.md` marked UNENFORCEABLE — MECHANISABLE carry a pointer `M-0NN` to an entry here,
which holds the sketch of what a mechanism would assert. **It only shrinks**: an entry leaves when
its mechanism ships and the rule in `CLAUDE.md` gets an `@enforced` tag instead of the pointer.
No speculative entries outside a triage pass. No entry count here — count with
`grep -cE '^### M-[0-9]+'`.

Entry grammar:

```md
### M-0NN · <the rule, as CLAUDE.md states it>
- **Rung:** hook | check | eslint · **Blast:** <what a violation costs>
- **Would assert:** <the observable condition, and its planted-violation probe>
```

## Open

### M-001 · Every email send on a request path is awaited or inside `after()`
- **Rung:** check · **Blast:** a lost lead or a lost order notice; nortiercupboards lost two leads
  to this (2026-10-02, 2026-10-04) and blindly's contact form had the same code
- **Would assert:** no call to `sendEmail(`, `notifyAdmin(` or `sendRawEmail(` in `app/` or `lib/`
  appears as a bare statement (not `await`ed, not returned, not inside an `after(` callback).
  Planted violation: `git show 2a962c8^:lib/contact/actions.ts` must fail it.

### M-003 · The ITN claims an order atomically before any send, and answers 500 on a failed claim
- **Rung:** check · **Blast:** two supplier order forms for one payment (a duplicate manufactured
  blind), or a paid order that never reaches the supplier
- **Would assert:** in `app/api/webhooks/payfast/route.ts`, the first `sendEmail`/supplier send in
  `handleBlindlyOrderPayment` is preceded by an update carrying `.neq("payment_status", "paid")`
  and `.select(`, and a claim error throws. Planted violation: `1437581^` of that file.

## Closed

| id | Closed | Mechanism |
|---|---|---|
| M-002 | 2026-10-11 | `scripts/check-actions.mjs` (`check:actions`): AST walk of every `"use server"` module; an export reaching `createAdminClient` (directly or via a same-module helper) must call `ensureAdmin`, or `requireAdmin`/a local wrapper with its result used, or sit in `PUBLIC` with a reason. Selftest plants the `82d5344^:lib/storage.ts` shape. The three open sites at entry were fixed: booking customer actions check the session, stock moved to `lib/shop/stock.ts`. Ported from life-therapy `server-action-auth`. |
