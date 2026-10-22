---
name: define-work
description: Define or refine requirements, behavioral specifications, epics, and tickets through independently invocable management workflows for Beligent SDD projects.
---

# Define work

Create and maintain the project's behavioral contract and backlog. This skill
does not require a complete planning sequence: select `requirements`,
`specification`, `epics`, or `tickets` from the user's request and run that route
directly. Workflow names are prompt selectors, not portable slash commands.

## Preconditions and inputs

Read applicable project instructions, `.beligent/config.json`, and
[governance](references/shared/governance.md). This skill supports configuration
`schema_version: 1` and `schema_version: 2`. If configuration is missing, explain the setup requirement;
you may offer an explicitly unconfigured draft, but do not invent project paths
or persist project artifacts. Unsupported schemas require a separate migration
proposal before affected writes, never automatic regeneration.

Use the selected profile, configured artifact paths, conventions, existing
artifacts, requested workflow/operation, and available user decisions as inputs.
Read only context relevant to the requested outcome. Reuse existing IDs and
content rather than recreating parallel requirements or backlogs. Ask for
missing information only when it changes the result; otherwise label assumptions
and open questions in a draft.

## Select a workflow

| Requested result | Read | Starting template |
| --- | --- | --- |
| Elicit or refine requirements/PRD | [requirements workflow](references/workflows/requirements.md) | [requirements](assets/requirements.md) |
| Specify observable behavior and interfaces | [specification workflow](references/workflows/specification.md) | [specification](assets/specification.md) |
| Group outcomes into epics and candidate tickets | [epics workflow](references/workflows/epics.md) | [epic](assets/epic.md) |
| Create, find, refine, prioritize, link or transition tickets | [tickets workflow](references/workflows/tickets.md) | [compact task](assets/compact-task.md) or [ticket](assets/ticket.md) |

Discovery means inspecting the requested outcome, users, evidence and constraints;
it is part of the selected route. It is not an extra prerequisite workflow.
Examples: “Use define-work, workflow specification, for REQ-001” or “Use
define-work, workflow tickets, to refine TICKET-003 using PLAN-001.”

## Shared procedure

1. Identify the requested result, current artifacts and authorized scope. Report
   missing route-specific inputs without starting unrelated routes.
2. Draft or refine the smallest useful artifact depth for the configured profile.
   Separate confirmed behavior, assumptions, open questions and exclusions.
3. For every epic/ticket operation, load the [provider contract](references/ticket-management/contract.md)
   and the configured provider's instructions. The initial `markdown` provider is
   described [here](references/ticket-management/markdown.md). Express operations
   in contract fields; keep file layouts inside the provider.
4. Preserve traceability and record substantive changes using
   [change control](references/change-control.md). Architecture findings can refine
   scope, dependencies and criteria; changed behavior returns to its canonical
   management artifact instead of being hidden in a plan.
5. Validate the result and report artifact IDs/locations, unresolved questions,
   decisions needed, and affected approval references. A draft or `ready` flag
   does not grant implementation approval.

## Outputs and validation

Return the requested requirements/specification artifact, normalized epic/ticket
records, or query results. Preliminary tickets may precede detailed architecture
and completed specifications. For schema-2 light/standard work, a compact task
meeting the governance stop rule is sufficient before `ready`; schema 1 and
rigorous schema 2 retain their profile-based needs.

Check unique stable IDs, resolvable references, observable acceptance criteria,
scope exclusions, dependency validity and consistency with existing decisions.
For mutations, check the provider's content revision before writing; stop on a
conflict and report the competing changes. Keep lifecycle, planning readiness
and human approval distinct. Repeating an unchanged request should not create
duplicate records or meaningless revisions.

## Gates

Drafting and backlog management do not require detailed architecture or authorize
coding. Apply the configured scope/implementation/completion decisions from
governance. Existing explicit authorization for the same concrete scope satisfies
the corresponding gate. Material changes to approved behavior, criteria or plans
require renewed approval before dependent implementation. Never fabricate a
decision, infer it from silence, or mark work accepted from passing tests alone.
