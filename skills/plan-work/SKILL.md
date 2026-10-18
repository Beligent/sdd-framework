---
name: plan-work
description: Analyze architecture, record consequential decisions, and create or refine implementation plans and preliminary tickets for specified Beligent SDD work.
---

# Plan work

Turn defined behavior into an implementation approach that fits the existing
project. Planning may begin with preliminary tickets; completed architecture is
not a prerequisite for drafting a backlog. Feed technical findings back into
canonical behavior and tickets rather than silently changing their meaning.

## Preconditions and inputs

Read applicable instructions, `.beligent/config.json`, and
[governance](references/shared/governance.md). This skill supports configuration
`schema_version: 1`; missing configuration requires setup or an explicitly
unconfigured proposal without persisted artifacts. Unsupported schemas require
a separate migration proposal before affected writes.

Use the selected profile, current behavior/requirements/specifications, available
preliminary tickets, repository structure, tests, constraints and actual decisions.
Read the relevant code and existing architecture before proposing replacements.
Existing explicit authorization for the same scope satisfies its gate. Where
behavior lacks enough definition, identify the ambiguity and prepare only the
parts of the plan that do not depend on resolving it.

## Procedure

1. Identify the outcome, current artifact revisions and planning depth. A
   lightweight ticket may hold a short plan; standard work uses the configured
   plans directory and [implementation-plan template](assets/implementation-plan.md).
2. Trace the affected system boundaries, data/interface changes, dependencies and
   current test coverage. Compare proportionate options for consequential choices.
   Reuse existing project decisions unless evidence warrants a change.
3. Load only relevant selected technology guidance from the table below and any
   configured project conventions. Record consequential decisions with the
   [ADR template](assets/adr.md) in the configured decisions directory; routine
   choices do not need an ADR.
4. Specify implementable steps, affected areas, criterion-to-validation mapping,
   dependencies and material rollout/rollback considerations. Estimate only when
   useful, with assumptions; do not invent precision or mandate infrastructure.
5. Refine preliminary tickets through the locally packaged
   [ticket-provider contract](references/ticket-management/contract.md) and
   [Markdown provider](references/ticket-management/markdown.md) when configured.
   Read records by ID and expected content revision, then update scope, plan
   references, dependencies and readiness through semantic operations. Keep
   provider serialization and paths out of planning logic.
6. If technical findings alter approved behavior, criteria or material plan
   constraints, describe the proposed change and affected approvals; return it to
   management for a scoped decision before dependent implementation. Preserve
   historical approvals and unresolved questions.
7. Validate and report the plan, ADRs where justified, ticket refinements and
   remaining implementation-approval needs. This skill produces planning
   artifacts, not application changes.

## Technology selection

These are packaged copies of one canonical technology source. Read a guide only
when selected in `technologies` and relevant to the planned change. The project
may supply conventions that take precedence; do not replace its stack implicitly.

| Technology | Local guide |
| --- | --- |
| React/TypeScript | [react-typescript](references/technology/react-typescript.md) |
| Next.js | [nextjs](references/technology/nextjs.md) |
| Node.js | [nodejs](references/technology/nodejs.md) |
| Python | [python](references/technology/python.md) |
| FastAPI | [fastapi](references/technology/fastapi.md) |

## Outputs and validation

Produce a scoped plan or embedded lightweight plan, justified ADRs and normalized
ticket updates. Use stable `PLAN-001` and `ADR-001` style IDs and increment saved
document revisions on changed content; no-op updates leave revisions unchanged.
Link requirements/specifications, applicable criteria, tickets and source decisions.

Check that every planned behavior follows its canonical contract, validation
covers the criteria and relevant failure paths, dependencies can be sequenced,
and proposed changes fit project constraints. Review data/compatibility/security
risks where the work creates them; record unknowns and verification limits.
Detect conflicting ticket revisions before mutations. Do not mark tickets ready
while profile-specific behavior or planning needs remain unresolved.

## Gates

Planning readiness is separate from lifecycle and human approval. A `ready`
ticket and an authored plan do not authorize implementation. Report the actual
scope/implementation decisions applying to current revisions and request only
missing decisions. Preliminary records cannot authorize coding. Material changes
require renewed affected authorization; editorial refinements within the same
concrete scope do not create an extra gate. Never infer approval from silence,
a previous unrelated decision or passing checks.
