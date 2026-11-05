# Shared engineering and tracking contract

Canonical source: `skills/sdd-define/references/shared/governance.md`.

## Ordinary work and explicit intent

Use project instructions, `.sdd/beligent/config.json` when present, installed shared
`.sdd/beligent/guidance/` and applicable local/subsystem rules. Ordinary code work
uses the main assistant, relevant stack guidance, useful tests and actual checks
without requiring a ticket or configuration. A small edit can use the main
assistant directly. Optional specialists receive only a bounded assignment,
relevant criteria and expected evidence, using the same project standards.

Tracking starts only on explicit intent: requesting tracked work, or naming a
ticket to implement. Merely mentioning or reading a ticket, auditing it,
automatic skill matching or requesting code does not authorize record changes or
implementation. When `tracking.required_for` matches a requested change, say so
before editing. Reuse scoped authorization already supplied; never infer consent
from silence or a status. Keep untracked plans, evidence and findings in chat.

## Scope and sufficient definition

Work on one bounded current increment. Stop defining once behavior is clear,
criteria testable, material risks resolved/accepted/escalated and no decision
blocks implementation. Ask blocking questions together. Reuse existing specs; do
not duplicate shared behavior in tickets. Plan only when useful for risk,
sequencing or complexity. Ask before consequential expansion. Never infer a backlog.

Add/update meaningful automated coverage where practical, reuse adequate coverage,
and run relevant existing/new tests during implementation. Prefer a reproducible
failing-before/passing-after check. Use manual verification where appropriate.
Record command/procedure, result, criterion and implementation snapshot.
Unavailable or unrun checks are not passes. After two ineffective symptom fixes,
diagnose the root cause before another patch. Keep observations and hypotheses separate.

## Completion, audit and delivery

A tracked ticket is done when its agreed work is complete and every required
check passes for its current revision and snapshot, with evidence for every
criterion. Failed, blocked, unrun or stale required checks keep it open. Do not
fabricate results or silently drop a required check. No acceptance decision,
commit, push, PR or merge is needed for completion. When the project sets
`tracking.authorization: recorded`, record scope authorization before implementing.

Audit is optional, read-only by default and valid before or after closure. Done
and cancelled tickets are final; report findings instead of changing them. A later
fix is ordinary work, or a new ticket when tracking is explicitly requested.

Delivery has its own state and Git permissions. `delivery.delivered_at` selects an
observed delivery milestone, never a closure gate. An open PR does not establish
a merge; never merge without separate explicit authorization.

## Persistence and maintenance

Records follow the record contract: stable IDs, a positive scope revision for
tickets, append-only history. Re-read a record immediately before writing and
stop on a concurrent change. No-op updates preserve bytes. Config, instructions
and records are project-owned. Earlier Beligent installations are reported, never
converted or silently overwritten. Usage remains explicit/local and contains no
prompt, response or tool content.
