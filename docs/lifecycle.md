# Lifecycle and verification

Ordinary requests use shared project/stack/local guidance without creating a
ticket. Requesting tracked work or naming a ticket to implement selects only that
scope. Reading, auditing or mentioning a ticket grants no implementation or record
changes. When config `tracking.required_for` matches a change, the assistant says
so before editing. One main assistant is default; specialists are optional.

`define → useful planning → implement and verify` is a flexible path, not a set of
mandatory ceremonies. Skip satisfied phases. Use a shared spec for durable
multi-ticket behavior; an epic or spec is optional otherwise.

## Statuses and completion

Tickets move `todo` → `in-progress` ⇄ `blocked` → `done`, or to `cancelled`.
sdd-implement adds/updates meaningful coverage where practical, reuses sufficient
existing tests, runs the configured and relevant checks and checks every criterion.
Prefer a reproducible red-before/green-after regression; never fabricate a result.

A ticket is done once its agreed work and required checks pass for the current
revision and implementation snapshot. A failed required check keeps it
`in-progress`; an external blocker makes it `blocked` with a reason. When config
sets `tracking.authorization: recorded`, implementation needs authorization for
the current revision. No commit, PR, merge or acceptance decision gates done.

## Revisions, audit and final states

While a ticket is open, changing its criteria increments `revision` and appends a
`revised` history entry; earlier checks no longer count. Specs have no revision.
Done and cancelled are final. Audit is optional, read-only and valid before or
after done. A later problem in done work is fixed as an ordinary request, or as a
new ticket when tracking is requested.

## Delivery

Delivery states are committed, pushed, pr-open, delivered and blocked, recorded
in the ticket's `delivery` field independently of status. `delivery.delivered_at`
selects the observed delivery point; merged-pr does not authorize merging.
Commit, push and PR permissions are `allowed`, `ask` (default) or `never`.

See [governance](../skills/sdd-define/references/shared/governance.md), the
[record contract](../skills/sdd-define/references/records.md) and the
[runnable fixture](../examples/workflow-fixture/README.md).
