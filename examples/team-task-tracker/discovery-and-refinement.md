# Discovery, preliminary backlog and refinement

This narrative reconstructs a fictional drafting sequence. It is not another
ticket backend or an approval record. Canonical records live only in the
configured [ticket directory](docs/sdd/tickets/TICKET-001.md); no archived record
with a duplicate frontmatter ID is created.

## First: discover and specify the outcome

The fictional product owner describes lost work items in chat. Draft the
[overview](docs/sdd/overview.md), [REQ-001](docs/sdd/requirements/REQ-001.md) and
[SPEC-001](docs/sdd/specifications/SPEC-001.md). Scope is create/list/complete;
identity/team management and a technology migration are excluded.

## Then: draft tickets before architecture

The `define-work` tickets route can create these actionable starting points
before an ADR or plan exists. The earlier state is summarized below rather than
stored as duplicate records. At that point each ticket had `status: todo`,
`readiness: preliminary` and no approval/evidence references.

| Logical ticket | Initially known | Explicit technical unknown |
| --- | --- | --- |
| TICKET-001 | Create/list behavior, team access and title criteria | Host identity/store contracts; where team scoping is enforced |
| TICKET-002 | Completion must be one-way and idempotent | Service/store transition boundary and prerequisite API work |
| TICKET-003 | UI flow, error recovery and keyboard criteria | API integration sequence, state ownership and host UI conventions |

Initial dependency links are left unresolved in details until planning can justify
them. No ticket is ready for implementation, and preliminary drafting does not
require inventing a full architecture first.

## Next: planning refines the same records

[ADR-001](docs/sdd/architecture/decisions/ADR-001.md) proposes a small task-service
boundary; [PLAN-001](docs/sdd/plans/PLAN-001.md) identifies validation and sequencing.
Planning uses the ticket-provider `read`, `update` and `link` operations with the
latest content revision. It changes these same IDs, not a copied backlog:

| Canonical record | Planning refinement | Current state |
| --- | --- | --- |
| [TICKET-001](docs/sdd/tickets/TICKET-001.md) | Link plan/ADR; identify adapter and negative request tests | `todo`, `ready`, no prerequisite |
| [TICKET-002](docs/sdd/tickets/TICKET-002.md) | Reuse store/service boundary; link TICKET-001 prerequisite | `todo`, `ready`, depends on TICKET-001 |
| [TICKET-003](docs/sdd/tickets/TICKET-003.md) | Define API/UI boundary and useful checks; link both backend prerequisites | `todo`, `ready`, depends on TICKET-001 and TICKET-002 |

Readiness is satisfied only within the stated design assumptions. Scope and
criteria have not changed; the dependency/plan refinements do not authorize code.
All canonical `approval_refs` remain empty because the
[implementation decision](docs/sdd/approvals/APPR-002.md) is illustrative.

## Finally: hand off, implement and verify in a real project

After actual scope/implementation decisions, confirm real host assumptions and
use the [handoff](implementation-handoff.md). A changed behavioral constraint
returns to the affected artifacts and decision before dependent implementation.
Provider digests guard writes; an observed conflict stops the write and requires
comparison/merge, not a last-writer overwrite.

This example stops before actual coding. [VERIFY-001](docs/sdd/verification/VERIFY-001.md)
shows the absent evidence instead of manufacturing a green test run or completion.
