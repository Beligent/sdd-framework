# Shared engineering and tracking contract

Canonical source: `skills/sdd-define/references/shared/governance.md`.

## Ordinary work and explicit intent

Use project instructions, `.sdd/beligent/config.json` when present, installed shared
`.sdd/beligent/guidance/` and applicable local/subsystem rules. Ordinary code work
uses the main assistant, relevant stack guidance, useful tests and actual checks
without requiring a ticket or configuration. A small edit can use the main
assistant directly. Optional specialists receive only a bounded assignment,
relevant criteria and expected evidence, using the same project standards.

Tracking defaults to opt-in. Explicitly requesting tracked work or implementing a
named ticket selects persistence for that scope. Merely mentioning/reading a
ticket, auditing it, automatic skill matching or requesting code does not authorize
record mutation or implementation. Surface any approved project tracking policy
before edits. Reuse scoped authorization already supplied; never infer consent
from silence or a status. Keep untracked plans, evidence and findings in chat.

## Scope and sufficient definition

Work on one bounded current increment. Stop defining once behavior is clear,
criteria testable, material risks resolved/accepted/escalated and no decision
blocks implementation. Ask blocking questions together. Reuse existing specs and
plans; do not duplicate shared behavior in tickets. Reversible local choices
need no ADR. Plan only when useful for risk, sequencing or complexity. Respect
workflow depth and ask before consequential expansion. Never infer a full backlog.

Add/update meaningful automated coverage where practical, reuse adequate coverage,
and run relevant existing/new tests during implementation. Prefer a reproducible
failing-before/passing-after check. Use manual verification where appropriate.
Record command/procedure, result, criterion and implementation snapshot/diff.
Unavailable or unrun checks are unverified. After two ineffective symptom fixes,
diagnose the root cause before another patch. Keep observations and hypotheses separate.

## Completion, audit and delivery

A tracked ticket is done when its agreed work is complete and every required
check passes for its current revision/snapshot, with evidence for every criterion.
Failed, blocked, unverified or stale required checks keep it open. Do not fabricate
results or silently drop a required check. No universal extra acceptance gate,
commit, push, PR or merge is needed for ticket completion. Honor actual applicable
project-specific scope authorization; it is distinct from verification.

Audit is optional, read-only by default and valid before or after closure. Report
missed original criteria as reopen recommendations. Mutate a record only with
explicit update/reopen authorization. Authorized reopening preserves scope and
prior evidence/history, increments revision and leaves work open for fresh checks.
Newly requested scope is separate work, tracked only on explicit intent.

Delivery has its own state and Git permissions. `git.delivery_complete_at` selects
an observed delivery milestone, never a ticket closure gate. An open PR does not
establish a merge; never merge without separate explicit authorization.

## Persistence and maintenance

Use stable IDs and positive integer revisions for tracked records and shared specs.
The provider's SHA-256 content digest is an external concurrency token, not a
substitute for a scope revision. Recheck immediately before mutation and stop on
conflict. Keep past scope and evidence retrievable; do not erase history to pass
validation. No-op updates preserve bytes/revisions. Config, instructions and
artifacts are project-owned. Inspect old installations and present a reviewed
clean-break plan; never silently overwrite them. Usage remains explicit/local
and contains no prompt, response or tool content.
