---
id: SPEC-001
revision: 1
status: draft
---

# Create, list and complete a team's tasks

## Source requirements

Implements [REQ-001 revision 1](../requirements/REQ-001.md).
[APPR-001](../approvals/APPR-001.md) is an illustrative scope-decision format,
not actual authorization. All behavior below is a proposed example contract.

## Scope and observable behavior

A signed-in member opens an existing team's task view, creates a titled task,
sees its open state, and marks it complete. Both states remain visible in the
list. All operations use the host's authenticated identity and membership check.
Out-of-scope actions follow [REQ-001](../requirements/REQ-001.md#scope).

## Interfaces and state

| Operation | Request | Successful response |
| --- | --- | --- |
| Create | `POST /teams/{team_id}/tasks`, JSON `{ "title": "Review release notes" }` | `201`, one task object |
| List | `GET /teams/{team_id}/tasks` | `200`, JSON `{ "items": [...] }` |
| Complete | `PATCH /teams/{team_id}/tasks/{task_id}`, JSON `{ "status": "completed" }` | `200`, the completed task object |

A task object has `id`, `team_id`, `title`, `status` (`open` or `completed`) and
`created_at` (server-assigned UTC timestamp). IDs are opaque strings. Creation
normalizes surrounding whitespace and accepts 1–120 Unicode code points after
normalization; the API is authoritative. New tasks are open. List order is newest
`created_at` first, with ascending opaque ID as a deterministic tie-breaker.
The only transition is `open -> completed`; repeating it returns the same ID and
completed state. Completion must not create a replacement record.

The UI shows loading, empty, populated and error states. Submit a mutation, then
update from confirmed server state; optimistic updates are not required. On a
rejected mutation keep the last confirmed task list and preserve the entered
title when creation fails. Successful creation clears the title field.

## Validation and failure behavior

- Missing authentication returns `401`. An authenticated non-member or an
  inaccessible/unknown team returns `404` without task data.
- A missing task, or a task outside the authorized route team, returns `404`
  without modifying any record.
- A missing/non-string title, an empty/whitespace-only normalized title, or a
  title longer than 120 code points returns `422`; no task is created.
- Completion accepts only `status: "completed"`; invalid status input returns
  `422` without a state change. Host service failures show a useful UI error;
  internal exceptions, tokens and other teams' data do not appear in responses.
- Error bodies use the host's documented FastAPI error convention. The UI does
  not depend on private stack traces or a new error library.

## Acceptance criteria

### AC-001

Given membership, creating `"  Review release notes  "` returns `201` with one
server-identified open task titled `"Review release notes"`. A subsequent list
contains that ID exactly once. Motivates
[REQ-001/AC-001](../requirements/REQ-001.md#ac-001).

### AC-002

Given open and completed tasks across two teams, a member's successful list
contains only the requested authorized team's tasks in the specified order,
including an empty `items` list when none exist. Motivates
[REQ-001/AC-001](../requirements/REQ-001.md#ac-001) and
[REQ-001/AC-002](../requirements/REQ-001.md#ac-002).

### AC-003

Given an open task in the authorized team, completing it returns `200` with the
same ID and completed state; repeating completion also returns `200` without a
duplicate. A subsequent list shows it completed. Motivates
[REQ-001/AC-001](../requirements/REQ-001.md#ac-001).

### AC-004

Unauthenticated requests to each operation return `401`. Non-members receive
`404`, and completing a task from another route team receives `404`. None of
these requests discloses or mutates protected task data. Motivates
[REQ-001/AC-002](../requirements/REQ-001.md#ac-002).

### AC-005

When create/complete is rejected or unavailable, the UI shows an understandable
error and leaves the last confirmed tasks intact; failed creation preserves its
title input. A successful retry reflects only the confirmed result. Motivates
[REQ-001/AC-003](../requirements/REQ-001.md#ac-003).

### AC-006

Normalized title lengths 1 and 120 are accepted. Missing/non-string input,
whitespace-only input and 121 code points are rejected with `422` and no new task.
The frontend gives useful validation feedback without replacing API validation.
Motivates [REQ-001/AC-003](../requirements/REQ-001.md#ac-003).

### AC-007

A keyboard user can reach the labeled title input, submit it, reach a task's
named completion control, and identify the resulting status or error without
relying on color alone. Motivates
[REQ-001/AC-003](../requirements/REQ-001.md#ac-003).

## Assumptions and open questions

Host identity, membership and durable storage behavior must be confirmed in a
real codebase. This contract does not claim those dependencies exist here.
Architecture and test-tool choices belong in planning; they must not silently
change the observable behavior above.
