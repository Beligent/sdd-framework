# Default contract for release 1.0.0

The runbook remains the behavior authority, with the developer's later choices:
release 1.0.0 and one unversioned configuration. This record documents the
implementation choices authorized by the request to correct the audited gaps;
it does not claim an independent review or live host certification.

## Configuration and ownership

Project settings live at `.sdd/beligent/config.json`. General and selected stack
guidance is installed at `.sdd/beligent/guidance/`, independently of explicit skill
invocation. Tickets, epics and shared specs are on-demand destinations. Keep the
five `sdd-*` skills in selected native host locations. Do not create frameworks.json.
Legacy `.beligent/` and versioned configurations need a reviewed clean-break plan.
No automatic conversion or deletion is authorized by skill installation.

The minimum config contains project, assistants, technologies, artifact and ticket
paths, workflow, testing, Git and tracking policy. Profiles and universal completion
approval gates are removed. Paths resolve from the consumer repository root,
including when the config is nested under `.sdd/beligent/`.

## Records and evidence

A ticket needs stable id, positive integer revision, status and a Markdown body
with objective, behavior and criterion headings. Title/kind/readiness, epic,
specification references, dependencies, implementation, checks and history are
optional until relevant. A standalone ticket supplies its own criteria; linked
shared specs remain canonical for behavior spanning tickets. Epics are optional;
explicit tickets lists identify children without abusing dependency edges.

Done requires all criteria covered by required passing check records at the
current ticket revision and implementation snapshot. Each check identifies id,
criteria, required flag, command or manual procedure, outcome, revision and snapshot.
Failed, blocked, unverified or stale required checks keep the ticket open. A
not-applicable optional check needs a reason. Structural validation checks fields,
links, coverage and declared outcomes; human/assistant review establishes truth.
No parser infers success from narrative prose.

Delivery has independent states/permissions and `git.delivery_complete_at`.
Neither Git delivery nor a universal extra human acceptance decision gates ticket
done. Actual project-specific authorization requirements still apply before work.

## Revisions, audit and scope

Increment revisions for substantive scope changes and preserve prior definition,
checks/snapshots and reasons in history or retrievable version control. Current
checks become stale when their revision or snapshot differs. No-op updates leave
bytes unchanged. SHA-256 remains the external conflict token for writes.

Audit is read-only by default, including existing/closed tickets. Report a missed
original criterion as a recommendation to reopen the same ticket. On explicit
reopen/update authorization, retain old evidence, increment revision and return to
todo or blocked with the unmet original criterion and reason. Newly requested
scope gets a new ticket only when tracking is explicitly requested.

## Three cases

An ordinary bug fix uses project guidance, meaningful tests and checks, leaves
results in chat and creates no ticket. A tracked implementation whose required
check fails remains in-progress/blocked with honest evidence. A post-close audit
that finds an original criterion unmet reports the finding without changing the
record; authorized reopening preserves the old evidence and requires fresh checks.
