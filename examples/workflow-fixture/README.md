# Runnable workflow fixture

Run from this directory with Node.js 22+:

```sh
node --test regression.test.mjs
node run-scenarios.mjs
```

The scenario runner executes real tests: a failing-before reproduction, the
passing fix, a required check that fails, and a post-close regression. Expected
failing subprocesses are asserted, not counted as passes. It writes no config,
records, application files or Git state. `before.mjs` and `audit-regression.mjs`
are deliberately broken reproduction inputs; `app.mjs` is the implementation.

## Direct work, no ticket

An ordinary request to fix the empty passport label loads project and Node
guidance, reproduces the bug against `before.mjs`, passes the regression against
`app.mjs` and reports the evidence in chat. It creates no records. The `.sdd`
files below illustrate separate tracked scenarios.

## Tracked records

- [TICKET-001](.sdd/beligent/tickets/TICKET-001.md): a standalone done ticket with
  local criteria, a failing-before regression and no epic or spec.
- [EPIC-001](.sdd/beligent/epics/EPIC-001.md) groups
  [TICKET-002](.sdd/beligent/tickets/TICKET-002.md) and
  [TICKET-003](.sdd/beligent/tickets/TICKET-003.md), which both take their
  criteria from the shared [SPEC-001](.sdd/beligent/specs/SPEC-001.md).
- [TICKET-004](.sdd/beligent/tickets/TICKET-004.md) stays `in-progress` because its
  required regression fails.
- `cases/invalid-done.md` declares `done` with that failing check. It sits outside
  the record directories; the test suite copies it into a disposable project and
  confirms that `sdd validate` rejects it.

The check commands are runnable from this directory. The `git-tree:` snapshot
values are **illustrative**: this fixture is not its own Git repository, so they
were not produced by `sdd snapshot`. The repository test suite exercises real
snapshots in a temporary Git repository.

## Audit after closure

`audit-regression.mjs` simulates a later regression in done work. An audit
reports it read-only; the done ticket stays unchanged, and the fix is an ordinary
request, or a new ticket if tracking is explicitly requested.

In a configured host, `Use sdd-implement for TICKET-004` should resume that
ticket and close it only once its required check passes; `Use sdd-audit verify
TICKET-001` should report findings without editing records. These are prompts to
try, not observed host results.
