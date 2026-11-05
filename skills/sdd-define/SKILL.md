---
name: sdd-define
description: Define behavior, shared specs, optional epics or explicitly tracked tickets, and plan the current task without implementing code.
---

# Define and plan bounded work

Read project instructions, configuration when present,
[governance](references/shared/governance.md), the
[current-task lifecycle](references/shared/current-task-lifecycle.md) and, for
tracked work, the [record contract](references/records.md). Missing configuration
permits useful definition in chat. Do not write records until the developer
explicitly requests tracked work. Earlier configurations are rejected, not converted.

## Select only the requested route

| Request | Guidance | Template |
| --- | --- | --- |
| Shared behavior across tickets | [specification](references/workflows/specification.md) | [spec](assets/spec.md) |
| Outcome grouping | [epics](references/workflows/epics.md) | [epic](assets/epic.md) |
| Ticket operations | [tickets](references/workflows/tickets.md) | [ticket](assets/ticket.md) |
| Technical planning | Procedure below | None; plans stay in chat or ticket notes |

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
An obvious implementation needs no written plan. Use concise chat notes for
untracked work or ticket notes for tracked work. Identify sequencing, interfaces,
dependencies and relevant rollout/rollback.

For tracked work, allocate unused IDs, keep file names equal to IDs, re-read a
record immediately before writing it and leave no-op edits byte-identical.
While a ticket is open, changing its criteria increments `revision` and appends
a `revised` history entry. Done and cancelled tickets are final. A record never
authorizes implementation by itself. Run `sdd validate` after changing records.

Ask before consequential depth expansion; defer unrelated work without creating
follow-up tickets. Report the scoped result, blockers, verification approach and
any missing implementation decision. This skill does not implement or deliver.
