# Implementation handoff — proposed, not implemented

Use the approved real-project versions of [SPEC-001](docs/sdd/specifications/SPEC-001.md),
[PLAN-001](docs/sdd/plans/PLAN-001.md) and the three
[tickets](docs/sdd/epics/EPIC-001.md). This outline teaches the handoff shape;
none of the application files or tests below exists in this example.
[APPR-002](docs/sdd/approvals/APPR-002.md) is not authorization to execute it.

## Proposed diff outline

Adapt paths to the host after inspecting its architecture. Do not scaffold a
parallel application or introduce the listed names as a mandatory layout.

```text
Backend: new or extended host modules
  task request/response models         title/status contract and public fields
  task route handlers                 create/list/complete; membership boundary
  task service                        team scope and completion semantics
  task-store adapter integration      host persistence and deterministic ordering
  task behavior/HTTP/adapter tests     isolated fixtures and criterion mapping

Frontend: new or extended host modules
  typed task API boundary              request/response/error translation
  team task view/form                  loading, empty, list and create states
  completion control                  confirmed-state update and error recovery
  interaction/integration checks       happy path, rejected mutations and keyboard

Project documentation
  existing API/user documentation      changed behavior and usage
  ticket evidence and VERIFY-001        actual revision, checks and limitations
```

The backend must enforce membership and route-team/task association before
exposing or changing data. The UI uses confirmed server results and does not
attempt to establish authorization. Keep database, auth, state and test tooling
choices with the host. A real storage adapter check is needed before claiming
durability; an in-memory fake only supports isolated tests.

## Example test cases to implement

These are planned cases, not runnable test definitions or observed results.
Use the host's runner and discover actual commands from its configuration/CI.

| Proposed identifier | Initial state and action | Expected observation | Criterion |
| --- | --- | --- | --- |
| `api_create_normalizes_title` | Member of team A posts a padded title, then lists A | `201`, trimmed open task, one matching ID in list | [AC-001](docs/sdd/specifications/SPEC-001.md#ac-001) |
| `api_list_team_scope_and_order` | A/B have open/completed tasks with a timestamp tie; list A and an empty authorized team | Only requested team's records, stable ordering, empty list supported | [AC-002](docs/sdd/specifications/SPEC-001.md#ac-002) |
| `api_complete_is_idempotent` | Member completes the same open task twice, then lists it | Both calls `200`, same ID, one persisted completed record | [AC-003](docs/sdd/specifications/SPEC-001.md#ac-003) |
| `api_rejects_unauthenticated_and_cross_team` | Exercise every endpoint without identity/as a non-member; complete team B's task through team A | `401`/`404` per contract, no disclosure/mutation | [AC-004](docs/sdd/specifications/SPEC-001.md#ac-004) |
| `ui_failed_mutation_preserves_state` | Reject create and completion, then retry successfully | Error shown, confirmed list retained, failed-create title retained; retry uses real response | [AC-005](docs/sdd/specifications/SPEC-001.md#ac-005) |
| `api_title_boundaries` | Submit lengths 1/120/121, whitespace-only, missing/non-string, including non-BMP characters | Accepted/rejected exactly as specified; rejected calls create nothing | [AC-006](docs/sdd/specifications/SPEC-001.md#ac-006) |
| `ui_keyboard_task_flow` | Use keyboard to create/complete and inspect status/error feedback | Named reachable controls; usable feedback without color alone | [AC-007](docs/sdd/specifications/SPEC-001.md#ac-007) |

Add invalid completion-status coverage and a real API-backed UI round trip.
If TDD is appropriate, run a useful failing behavioral case first, implement it,
then refactor with checks passing. Never claim such a run occurred merely because
this document suggests it.

## Provider-safe execution and evidence

1. Resolve the canonical ticket by ID from configured provider locations. Read
   its normalized record and metadata; check readiness, prerequisites and actual
   approval coverage before entering `in-progress`.
2. Keep provider metadata outside ticket frontmatter. A real read returns its
   locator and a SHA-256 content revision calculated from complete current bytes.
   The schematic form below contains a placeholder, not a usable conflict token:

   ```json
   {
     "locator": "docs/sdd/tickets/TICKET-001.md",
     "content_revision": "sha256:<compute the exact current file digest>"
   }
   ```

3. Recheck the expected revision immediately before each `update`, `link` or
   `transition`. A mismatch produces a conflict and no write. Inspect/reconcile
   the changed record rather than overwriting it; return the new digest only
   after a successful write/read-back.
4. Record actual implementation references, executed checks, observed outcomes
   and criterion links. Then enter `review` when supported by real evidence.
   This example stays `todo` because no such execution occurred.
5. Update [VERIFY-001](docs/sdd/verification/VERIFY-001.md) for the actual reviewed
   revision. Keep failed/unrun checks visible and obtain the configured real
   human acceptance before `done`. Administrative evidence/status changes alter
   the digest; compare against the approved snapshot to distinguish them from
   material behavior changes. Never derive approval from a digest alone.
