---
name: sdd-define
description: Define behavior, requirements, specifications, epics or opt-in tickets, and plan the current task or explicitly requested epic/project without implementing code.
---

# Define and plan bounded work

Read project instructions, configuration when present,
[governance](references/shared/governance.md), and the
[current-task lifecycle](references/shared/current-task-lifecycle.md).
Missing configuration permits useful definition in chat. Do not persist SDD
artifacts until the developer selects tracking or explicitly requests artifacts.
Unsupported configurations require migration before affected writes.

## Select only the requested route

| Request | Guidance | Template |
| --- | --- | --- |
| Requirements / PRD | [requirements](references/workflows/requirements.md) | [requirements](assets/requirements.md) |
| Observable behavior | [specification](references/workflows/specification.md) | [specification](assets/specification.md) |
| Outcome grouping | [epics](references/workflows/epics.md) | [epic](assets/epic.md) |
| Ticket operations | [tickets](references/workflows/tickets.md) | [compact task](assets/compact-task.md), [expanded ticket](assets/ticket.md) |
| Technical planning | Procedure below | [plan](assets/implementation-plan.md), [ADR](assets/adr.md) |

An ordinary request concerns one bounded increment. Ask blocking questions
together. Stop defining when behavior is clear, criteria are testable, no decision
blocks implementation and consequential risks are resolved, accepted or escalated.
Reuse existing artifacts; never create a parallel behavioral contract.

## Planning

`plan-task` is the default scope. `plan-epic` and `plan-project` require explicit
intent. Read affected code, tests, constraints, conventions and only relevant
technology guidance: [React/TypeScript](references/technology/react-typescript.md),
[Next.js](references/technology/nextjs.md), [Node.js](references/technology/nodejs.md),
[Python](references/technology/python.md), or [FastAPI](references/technology/fastapi.md).
Compare consequential choices and map criteria to verification.
An obvious implementation needs no separate PLAN. Use concise chat notes for
untracked work or task notes for tracked work. Create a PLAN only when useful,
requested, or required by rigor; create an ADR only for a consequential decision.
Identify sequencing, interfaces, dependencies and relevant rollout/rollback.

For tracking, read the [provider contract](references/ticket-management/contract.md)
and [Markdown mapping](references/ticket-management/markdown.md). Allocate stable
IDs, preserve links, check content digests immediately before mutations, and
leave no-op bytes/revisions unchanged. Preliminary records may precede detailed
architecture. A ready label does not authorize implementation.

Use [change control](references/change-control.md) for material behavior changes.
Ask before consequential depth expansion; defer unrelated work without creating
follow-up tickets. Report the scoped result, blockers, verification approach and
any missing implementation decision. This skill does not implement or deliver.
