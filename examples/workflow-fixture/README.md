# Runnable runbook fixture

Run from this directory with Node.js 22+:

```sh
node --test regression.test.mjs
node run-scenarios.mjs
```

The scenario runner performs actual failing-before/passing-after tests, an expected
required-check failure and a post-close audit reproduction. Expected failing
subprocesses are asserted, not counted as product test passes. It writes no
config, records, reports, application files or Git state. `before.mjs` and
`audit-regression.mjs` are deliberately broken reproduction inputs, not production
implementations. The default app tests must pass.

## Direct work, no ticket

An ordinary request to fix the empty passport label loads project/Node guidance,
runs the reproducer against before.mjs and the regression against app.mjs, and
reports evidence in chat. Running these commands creates no tracking artifacts.
The checked-in .sdd files below are separate illustrative tracked scenarios;
they do not imply a direct request creates them.

## Tracked work and resume

[Standalone TICKET-001](.sdd/beligent/tickets/TICKET-001.md) holds local behavior
and current structured evidence without an epic or spec. [EPIC-001](.sdd/beligent/epics/EPIC-001.md)
groups [TICKET-002](.sdd/beligent/tickets/TICKET-002.md) and
[TICKET-003](.sdd/beligent/tickets/TICKET-003.md), both referencing one
[shared SPEC-001](.sdd/beligent/specs/SPEC-001.md).

The done records illustrate completion without approval artifacts or Git delivery.
Their declared snapshots are deterministic hashes of the selected module, test
and app bytes, and their check commands can be executed from this example root.
The repository suite validates the graph and actually executes the scenarios.
These are local fixture results, not observed assistant-host workflows.

[TICKET-004](.sdd/beligent/tickets/TICKET-004.md) stays blocked with a failed
required regression. [TICKET-005](.sdd/beligent/tickets/TICKET-005.md) illustrates an
explicitly authorized reopen for a missed original criterion, retaining the prior
revision/check evidence. A real audit would first report its finding read-only;
no approval source is fabricated by this fixture.

Start a fresh host session and ask `Use sdd-implement for TICKET-004`. It should
read config/task/specs as relevant, reproduce the declared check, resume only
that scope, update actual current evidence and close only when required checks
pass. Ask `Use sdd-audit verify TICKET-001` for a read-only post-close review.
New requested behavior is separate work; read-only references never authorize
implementation. Install/configure a host before asserting its discovery behavior.

`cases/invalid-done.md` intentionally declares a failed required check but done
status. It is outside configured record paths. The test suite copies it into a
disposable project's tickets and confirms rejection. Do not copy it into a real
backlog or weaken the validator to accept it.
