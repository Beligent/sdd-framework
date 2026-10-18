---
id: TICKET-002
kind: ticket
title: "Complete a team task idempotently"
status: todo
readiness: ready
priority: high
requirements: [REQ-001]
specifications: [SPEC-001]
acceptance_criteria: [SPEC-001/AC-003, SPEC-001/AC-004]
dependencies: [TICKET-001]
approval_refs: []
evidence: [VERIFY-001]
---

# Complete a team task idempotently

## Scope and expected behavior

Implement completion from [SPEC-001](../specifications/SPEC-001.md) within
[EPIC-001](../epics/EPIC-001.md), using TICKET-001's task-store and authorization
boundaries. A repeated completion returns the same completed task. Reopening,
deletion and other transitions remain excluded.

## Acceptance criteria

- [SPEC-001/AC-003](../specifications/SPEC-001.md#ac-003): complete, repeat and list
  with the same ID/state.
- [SPEC-001/AC-004](../specifications/SPEC-001.md#ac-004): completion access and
  cross-team task-ID cases; TICKET-001 supplies create/list cases.

## Plan and validation

Follow [PLAN-001](../plans/PLAN-001.md) and
[ADR-001](../architecture/decisions/ADR-001.md). After
[TICKET-001](TICKET-001.md), implement the service/store transition and PATCH
handler. Exercise `api_complete_is_idempotent`, cross-team/missing task cases and
invalid completion status input. Check list reflects persisted completion and
no duplicate is created; an HTTP mock alone cannot prove that contract.

## Assumptions and open questions

Ready within the stated host design assumptions; actual execution requires its
prerequisite and real implementation authorization. Identify storage concurrency
or compatibility issues before departing from the approved plan.

## Changes, evidence and completion

See the [preliminary-to-ready narrative](../../../discovery-and-refinement.md).
[APPR-002](../approvals/APPR-002.md) is illustrative, so there is no approval
reference granting execution. [VERIFY-001](../verification/VERIFY-001.md) is
entirely unverified. Keep this ticket `todo` until authorized work actually starts.
