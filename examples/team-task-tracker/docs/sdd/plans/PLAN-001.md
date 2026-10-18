---
id: PLAN-001
revision: 1
status: draft
---

# Deliver the team task workflow

## Scope and behavioral contract

Plan revision 1 covers [REQ-001](../requirements/REQ-001.md) revision 1,
[SPEC-001](../specifications/SPEC-001.md) revision 1 and
[EPIC-001](../epics/EPIC-001.md). Use those canonical criteria instead of creating
new behavior here. Exclusions remain in the requirement. No actual scope or
implementation approval exists; [APPR-001](../approvals/APPR-001.md) and
[APPR-002](../approvals/APPR-002.md) are illustrations only.

## Current system and proposed approach

This is a fictional host, not an inspected application. Confirm its authenticated
identity/membership resolver, durable storage adapter, UI conventions and actual
commands before real implementation. Follow [ADR-001](../architecture/decisions/ADR-001.md):
FastAPI transport, a small task service, host adapters and a typed React API
boundary. Preserve host tooling; do not select infrastructure from this example.

## Implementation steps and dependencies

1. [TICKET-001](../tickets/TICKET-001.md): integrate create/list endpoints and the
   task-store boundary; validate title input and team access. Add domain, HTTP
   and real adapter contract cases using the host's existing tooling.
2. [TICKET-002](../tickets/TICKET-002.md): implement idempotent completion using
   that boundary. Verify cross-team task IDs cannot bypass route-team scoping.
3. [TICKET-003](../tickets/TICKET-003.md): add the React create/list/complete flow,
   failure recovery and keyboard interaction against those endpoint contracts.
4. Execute the appropriate host checks and record actual outcomes in
   [VERIFY-001](../verification/VERIFY-001.md). Resolve gaps before the real human
   completion decision; do not mark a ticket done from proposed checks.

The earlier [preliminary backlog](../../../discovery-and-refinement.md) predates
this plan. Planning refines its same logical IDs to ready under the stated
scenario assumptions. It introduces dependencies, not additional product scope.

## Validation

All identifiers below are proposed test/review names, not existing tests or runs.

| Criterion reference | Check and expected result | Evidence to collect |
| --- | --- | --- |
| [SPEC-001/AC-001](../specifications/SPEC-001.md#ac-001) | `api_create_normalizes_title`; create/list round trip returns one open task | HTTP test and durable-store contract result |
| [SPEC-001/AC-002](../specifications/SPEC-001.md#ac-002) | `api_list_team_scope_and_order`; authorized team, empty case, stable ordering | Request/adapter fixtures and observed results |
| [SPEC-001/AC-003](../specifications/SPEC-001.md#ac-003) | `api_complete_is_idempotent`; same task remains completed after repeat/list | Domain, HTTP and store results |
| [SPEC-001/AC-004](../specifications/SPEC-001.md#ac-004) | `api_rejects_unauthenticated_and_cross_team`; no leak or mutation | Negative request cases for all endpoints |
| [SPEC-001/AC-005](../specifications/SPEC-001.md#ac-005) | `ui_failed_mutation_preserves_state`; error and successful retry | UI interaction result and observed states |
| [SPEC-001/AC-006](../specifications/SPEC-001.md#ac-006) | `api_title_boundaries`; 1/120 accepted, invalid/121 rejected | Parameterized cases including code points |
| [SPEC-001/AC-007](../specifications/SPEC-001.md#ac-007) | `ui_keyboard_task_flow`; named controls/status work with keyboard | Interaction test or recorded manual procedure |

## Compatibility, risks and rollout

Add task routes within the host's API conventions without changing unrelated
contracts. If storage changes need a migration, propose its concrete diff,
compatibility and recovery strategy after inspecting that store; this plan does
not authorize destructive live operations. Roll out through the host's existing
release process. A rollback removes the new UI/routes while preserving created
data for later recovery; confirm the actual mechanism in the real project.

Risks: host capabilities may differ; Unicode length can diverge between JS and
Python; mocks may hide persistence or authorization errors. Confirm integration,
count code points consistently and retain real adapter/negative request checks.

## Open questions and readiness

No product behavior remains unspecified for the scenario. Actual host interfaces,
versions, commands and implementation authorization are absent because there is
no application here. Tickets are planned/ready within the scenario, not approved
to run. A real host mismatch reopens affected planning and approvals.
