---
id: EPIC-001
kind: epic
title: "Create, list and complete team tasks"
status: todo
readiness: ready
priority: high
requirements: [REQ-001]
specifications: [SPEC-001]
acceptance_criteria: [SPEC-001/AC-001, SPEC-001/AC-002, SPEC-001/AC-003, SPEC-001/AC-004, SPEC-001/AC-005, SPEC-001/AC-006, SPEC-001/AC-007]
dependencies: []
approval_refs: []
evidence: [VERIFY-001]
---

# Create, list and complete team tasks

## Scope and expected outcome

Deliver the team task flow in [REQ-001](../requirements/REQ-001.md) and
[SPEC-001](../specifications/SPEC-001.md). The scenario is planning-ready under
its stated host assumptions. No app exists and no real approval is recorded.

## Child tickets

- [TICKET-001](../tickets/TICKET-001.md): create/list API and storage boundary.
- [TICKET-002](../tickets/TICKET-002.md): idempotent completion API.
- [TICKET-003](../tickets/TICKET-003.md): typed, accessible React task flow.

These are children, not prerequisites of their own epic; `dependencies` is empty.

## Assumptions and open questions

Confirm host interfaces and tooling before using these tickets in a real project.
See [overview](../overview.md) and [planning assumptions](../plans/PLAN-001.md).

## Planning and changes

[PLAN-001](../plans/PLAN-001.md) and
[ADR-001](../architecture/decisions/ADR-001.md) refine the
[earlier preliminary backlog](../../../discovery-and-refinement.md). Scope and
criterion references remain unchanged. [APPR-002](../approvals/APPR-002.md) is
illustrative, so `approval_refs` remains empty.

## Verification and completion

[VERIFY-001](../verification/VERIFY-001.md) contains planned checks and unverified
outcomes. No implementation, test success or completion is claimed. Keep this
epic `todo` until real authorized execution and update its state from actual
child results; completion requires verified criteria and real human acceptance.
