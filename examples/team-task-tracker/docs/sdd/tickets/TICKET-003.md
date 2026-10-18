---
id: TICKET-003
kind: ticket
title: "Build the accessible React team-task flow"
status: todo
readiness: ready
priority: medium
requirements: [REQ-001]
specifications: [SPEC-001]
acceptance_criteria: [SPEC-001/AC-001, SPEC-001/AC-002, SPEC-001/AC-003, SPEC-001/AC-005, SPEC-001/AC-006, SPEC-001/AC-007]
dependencies: [TICKET-001, TICKET-002]
approval_refs: []
evidence: [VERIFY-001]
---

# Build the accessible React team-task flow

## Scope and expected behavior

Implement [SPEC-001](../specifications/SPEC-001.md)'s React flow within
[EPIC-001](../epics/EPIC-001.md): load tasks, create a task and complete it using
confirmed server results. Include loading/empty/error states and keyboard
operation. Preserve the host UI conventions without adding a state library.

## Acceptance criteria

- [SPEC-001/AC-001](../specifications/SPEC-001.md#ac-001),
  [AC-002](../specifications/SPEC-001.md#ac-002) and
  [AC-003](../specifications/SPEC-001.md#ac-003): the UI exposes the confirmed API
  behavior; backend criteria are also covered by TICKET-001/TICKET-002.
- [SPEC-001/AC-005](../specifications/SPEC-001.md#ac-005): rejected mutations
  preserve confirmed state and failed-create input, with useful error/retry.
- [SPEC-001/AC-006](../specifications/SPEC-001.md#ac-006): frontend feedback agrees
  with the API's normalized title/code-point rule.
- [SPEC-001/AC-007](../specifications/SPEC-001.md#ac-007): named keyboard controls
  and readable status/error feedback.

## Plan and validation

Follow [PLAN-001](../plans/PLAN-001.md), after
[TICKET-001](TICKET-001.md) and [TICKET-002](TICKET-002.md). Add a typed API boundary
and focused UI state, then exercise proposed UI happy/error/keyboard cases and
one real API-backed create/list/complete flow in an isolated environment.
Discover actual commands from the host; this example supplies no test runner.

## Assumptions and open questions

Ready under the scenario assumptions. Confirm host routing, accessible component
conventions and error format before coding. A mock can test interaction, but real
API integration and a suitable accessibility check remain necessary evidence.

## Changes, evidence and completion

[Planning history](../../../discovery-and-refinement.md) explains its readiness
and dependency refinement. [APPR-002](../approvals/APPR-002.md) grants no actual
approval; `approval_refs` remains empty. [VERIFY-001](../verification/VERIFY-001.md)
contains no observed application result. This ticket remains `todo` and acceptance
pending until real implementation and verification happen.
