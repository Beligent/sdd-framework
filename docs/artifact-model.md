# Artifacts, templates and traceability

Project artifacts are Markdown, stored at the paths chosen in
`.beligent/config.json`. Templates have one owner and travel with their skill.

| Artifact | Template | Relationship |
| --- | --- | --- |
| Overview | [project-overview.md](../skills/init-project/assets/project-overview.md) | Context, users, boundaries and existing conventions; may remain narrative |
| Requirements / PRD | [requirements.md](../skills/define-work/assets/requirements.md) | Product outcomes, functional/non-functional requirements and criteria |
| Behavioral specification | [specification.md](../skills/define-work/assets/specification.md) | Observable contracts implementing requirements |
| ADR | [adr.md](../skills/plan-work/assets/adr.md) | Consequential technical decision and alternatives |
| Epic | [epic.md](../skills/define-work/assets/epic.md) | Groups an outcome and child tickets |
| Development ticket | [ticket.md](../skills/define-work/assets/ticket.md) | Actionable approved scope linked to behavior and verification |
| Schema-2 compact task | [compact-task.md](../skills/define-work/assets/compact-task.md) | A light/standard current-task ticket that combines sufficient objective, behavior, criteria and relevant verification in one artifact |
| Implementation plan | [implementation-plan.md](../skills/plan-work/assets/implementation-plan.md) | Architecture, sequence, dependencies and test approach |
| Verification report | [verification-report.md](../skills/verify-work/assets/verification-report.md) | Criteria mapped to observed evidence and gaps |
| Approval/change record | [approval-record.md](../skills/define-work/assets/approval-record.md) | A real human decision covering specific scope/revisions |

Replace example IDs and bracketed template fields before use; templates are
drafts, never approval or evidence. Requirements/specifications/ADRs/plans/reports
use `id`, positive integer `revision`, and document `status`. The overview and
convention notes can use a configured path as identity. Ticket/epic metadata is
the exact [normalized provider record](../skills/define-work/references/ticket-management/contract.md),
with a full-file content digest returned as provider metadata, outside the file.

Use stable references such as `REQ-001`, `SPEC-001/AC-001`, `TICKET-001`,
`PLAN-001`, `VERIFY-001` and `APPR-001`. Markdown links resolve relative to the
containing artifact; normalized ticket references use logical IDs. Native issue
numbers/URLs belong in a future provider's metadata, not in place of framework
identity. Keep one authoritative ticket backend.

The motivating requirement and specification stay canonical. Tickets reference
the applicable criteria instead of creating an alternative behavior definition.
Verification references the same criteria and records actual commands/review
procedures, results and limits. A lightweight ticket may define its own
`TICKET-001/AC-001` criterion headings and include its plan/evidence inline.

Schema-2 light and standard work may instead use a compact task. It is an
additional ticket representation, never an automatic rewrite of expanded
artifacts. Include only relevant sections; the readiness stop rule requires an
objective, behavior, testable criteria, no unresolved blocker, and an explicit
resolution, acceptance, or escalation for any consequential risk.

## Readiness, lifecycle and decisions

Preliminary tickets can have explicit unknowns or missing references before
detailed architecture. Ready records satisfy the selected profile's behavior and
planning needs. `todo`, `in-progress`, `blocked`, `review`, `done`, `cancelled`
describe lifecycle; neither a status nor readiness grants authorization.

For a durable `done` record, persist the actual completion decision and evidence
references so a later reader can verify why it was closed. Structured approval
records use `gate`, `decision`, `approver`, `source` and `artifacts`; an approved
record needs nonempty real decision-maker/source information. The validator can
check those fields exist; human review establishes their truth and scope.

Content digests detect concurrent file changes. Approval comparison uses a
reviewed snapshot: changing status/evidence changes the digest without
necessarily changing behavior. Preserve that snapshot and compare substantive
changes, as described in [governance](../skills/define-work/references/shared/governance.md).
