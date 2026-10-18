---
id: TICKET-001
kind: ticket
title: "Provide authorized task creation and listing"
status: todo
readiness: ready
priority: high
requirements: [REQ-001]
specifications: [SPEC-001]
acceptance_criteria: [SPEC-001/AC-001, SPEC-001/AC-002, SPEC-001/AC-004, SPEC-001/AC-006]
dependencies: []
approval_refs: []
evidence: [VERIFY-001]
---

# Provide authorized task creation and listing

## Scope and expected behavior

Implement create/list from [SPEC-001](../specifications/SPEC-001.md) within
[EPIC-001](../epics/EPIC-001.md). Integrate host identity/membership and the durable
task-store boundary proposed in [ADR-001](../architecture/decisions/ADR-001.md).
Do not add completion, UI, a new auth system or a database selection here.

## Acceptance criteria

- [SPEC-001/AC-001](../specifications/SPEC-001.md#ac-001): create/list round trip.
- [SPEC-001/AC-002](../specifications/SPEC-001.md#ac-002): scoped, ordered listing.
- [SPEC-001/AC-004](../specifications/SPEC-001.md#ac-004): create/list access checks;
  completion cases are delivered by TICKET-002.
- [SPEC-001/AC-006](../specifications/SPEC-001.md#ac-006): API title boundaries;
  frontend feedback is delivered by TICKET-003.

## Plan and validation

Follow [PLAN-001](../plans/PLAN-001.md). Confirm host interfaces, implement the
team-scoped store/service and HTTP create/list behavior, then exercise the
proposed `api_create_normalizes_title`, `api_list_team_scope_and_order`,
`api_title_boundaries` and endpoint-specific access cases. Verify persistence
with the actual adapter contract, not solely an in-memory fake.

## Assumptions and open questions

Ready within the fictional host assumptions only. Real tooling/interfaces must
be confirmed before coding. No unresolved design choice may silently alter
scope; return material changes to the relevant artifacts/decision.

## Changes, evidence and completion

The [evolution narrative](../../../discovery-and-refinement.md) shows this ticket
before planning. `approval_refs` is empty because
[APPR-002](../approvals/APPR-002.md) is not real approval.
[VERIFY-001](../verification/VERIFY-001.md) records missing evidence. Remain
`todo`: no implementation or test result exists, and completion is pending.
