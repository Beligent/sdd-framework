# Lifecycle and verification

Ordinary requests use shared project/stack/local guidance without creating a
ticket. Explicit tracked work or implementation of a named ticket selects only
that scope. Merely reading, auditing or mentioning a ticket grants no mutation or
implementation authorization. One main assistant is default; specialists are optional.

`define → useful planning → implement and verify` is a flexible path, not a set of
mandatory ceremonies. Skip satisfied phases. Stop defining once behavior/criteria
are clear, consequential risks resolved/accepted/escalated and no decision blocks
implementation. Respect depth and ask before consequential expansion. Reuse a
shared spec for durable multi-ticket behavior; an epic/spec is optional otherwise.

## Completion

sdd-implement adds/updates meaningful coverage where practical, reuses sufficient
existing tests and runs relevant tests/checks during implementation. Prefer a
reproducible red-before/green-after regression; never fabricate a failure or pass.
Check every applicable criterion. Required manual checks need actual observations.

Statuses are todo, in-progress, blocked, optional review, done and cancelled.
A tracked ticket is done once its agreed work and required checks pass for the
current revision/implementation snapshot. Structured checks identify criteria,
command/procedure, required flag, outcome, revision and snapshot. Failed, blocked,
unverified or stale required checks keep it open. No commit, PR, merge or universal
extra acceptance decision gates done. Actual project scope authorization still applies.

## Later audit and revisions

Audit is optional, read-only by default and valid before/after done. An unmet
original criterion warrants a reopen recommendation for the same ticket. Only
explicit record-update authorization permits reopening: retain prior scope,
checks/snapshot and reason in history, increment revision and return to todo or
blocked. Rerun stale evidence before closing. New scope is a separately requested
task. Do not change criteria to disguise failures. No-op edits retain bytes/revision.

## Delivery

Delivery states are ready-for-delivery, committed, pushed, pr-open, delivered and
blocked, independent of ticket status. sdd-deliver preflights verification, scoped
paths, actual authorization, index/remote state and policy before Git mutations.
`git.delivery_complete_at` selects the observed delivery point; merged-pr does not
authorize merging. Preserve unrelated changes and pending push permission.

See [governance](../skills/sdd-define/references/shared/governance.md),
[record contract](../skills/sdd-define/references/ticket-management/contract.md), and
[runnable scenarios](../examples/workflow-fixture/README.md).
