---
name: define-work
description: Define or refine requirements, behavioral specifications, epics, and tickets through independently invocable management workflows for Beligent SDD projects.
---

# Define work

Define or refine the requested current work. This skill does not require a
complete planning sequence: select `requirements`, `specification`, `epics`, or
`tickets` when explicitly requested, while an ordinary schema-2 feature request
defaults to the smallest useful current task. Workflow names are prompt selectors,
not portable slash commands.

## Preconditions and inputs

Read applicable project instructions, `.beligent/config.json`,
[governance](references/shared/governance.md), and the schema-2
[current-task lifecycle](references/shared/current-task-lifecycle.md). Read the
[diagnosis and simplicity contract](references/shared/diagnosis-and-simplicity.md)
when specification/process cycles appear disproportionate. This skill supports configuration
`schema_version: 1` and `schema_version: 2`. If configuration is missing, explain the setup requirement;
you may offer an explicitly unconfigured draft, but do not invent project paths
or persist project artifacts. Unsupported schemas require a separate migration
proposal before affected writes, never automatic regeneration.

Use the selected profile, workflow depth, configured paths, existing artifacts,
and available decisions as inputs. Reuse relevant project context and IDs rather
than restating stable context or recreating parallel requirements and backlogs.
For schema 1, retain the selected profile and explicitly requested management
route. For schema 2, accept a rough request or existing requirement,
specification, or task and identify one bounded increment.

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

1. Identify the requested result, current artifacts and authorized scope. For
   schema 2, do not infer project planning, a complete backlog, or comprehensive
   design from ordinary feature work. Report missing route-specific inputs
   without starting unrelated routes.
2. Draft or refine the smallest useful artifact depth. Batch only meaningful
   blocking questions. Apply the canonical stop rule; when it is met, stop
   specification. For schema-2 light/standard work, prefer one compact task.
   Reuse expanded REQ/SPEC/EPIC artifacts and create new ones only when explicitly
   requested or justified by rigor, complexity, or consequential scope.
3. For every epic/ticket operation, load the [provider contract](references/ticket-management/contract.md)
   and the configured provider's instructions. The initial `markdown` provider is
   described [here](references/ticket-management/markdown.md). Express operations
   in contract fields; keep file layouts inside the provider.
4. Preserve traceability and record substantive changes using
   [change control](references/change-control.md). Architecture findings can refine
   scope, dependencies and criteria; changed behavior returns to its canonical
   management artifact instead of being hidden in a plan.
5. Validate the result and report artifact IDs/locations, unresolved questions,
   decisions needed, and affected approval references. Respect design depth and
   ask before gated expansion. A draft or `ready` flag does not grant
   implementation approval.

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
