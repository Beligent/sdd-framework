---
name: implement-ticket
description: Implement an approved Beligent SDD ticket, run appropriate checks, and record acceptance evidence for review. Use for scoped coding, bug fixes, or refactoring against an agreed behavioral contract.
---

# Implement an approved ticket

Turn an implementation-ready ticket into reviewable changes and honest evidence.
Keep requirements and expected behavior in their existing management artifacts.

## Preconditions and inputs

Read applicable repository instructions and `.beligent/config.json`. This skill
supports `schema_version: 1` and `schema_version: 2`. Use its artifact locations, profile, conventions
and technology modules. Missing configuration permits an explicitly unconfigured
investigation/proposal without persisted artifacts; otherwise use setup first.
Unsupported schemas require a migration proposal before affected writes. Do not
initialize or reconfigure the project implicitly.

Required inputs are a ticket, its acceptance criteria and linked behavioral
contract, applicable implementation authorization, and any existing plan. A
standard-profile ticket needs its approved implementation plan; a lightweight
ticket may contain a short plan itself. Architecture documents are needed only
when the work makes or depends on a consequential architecture decision.

Read [governance](references/shared/governance.md) to establish authorization and
revision coverage. Read the [ticket contract](references/ticket-management/contract.md)
and the configured provider guidance, initially
[Markdown tickets](references/ticket-management/markdown.md), before reading or
updating ticket state. An unsupported provider requires a supported adapter or a
project decision; do not silently create a second backlog.

## Procedure

1. Resolve the ticket's requirements, specifications, criteria, dependencies and
   approval references. Confirm readiness and authorization for this exact work.
   Existing explicit authorization counts. If a decision is missing, prepare the
   concrete ticket/plan for that decision; continue independent investigation but
   do not implement the unapproved behavior.
2. Inspect the affected code, tests and current working changes. Establish actual
   project commands and the relevant baseline. Read
   [implementation guidance](references/implementation.md) and
   [testing guidance](references/testing.md) as needed. Select the technology
   references below for the files and boundaries being changed.
3. Choose the smallest coherent change that satisfies the approved criteria.
   Identify a regression test or observable check for changed behavior. Use
   test-driven development when it adds confidence: demonstrate the relevant
   failure, implement the behavior, then refactor with checks passing.
4. Implement within scope. Preserve unrelated user changes. Handle a material
   change to approved behavior, criteria, constraints or plan through governance
   before dependent implementation. Record a genuine blocker with its evidence;
   do not invent a design decision to bypass it.
5. Run relevant checks and inspect the resulting diff. Review changed trust
   boundaries, error handling, compatibility and documentation. Report unavailable
   checks as unverified, distinguish pre-existing failures from regressions, and
   resolve failures introduced by the change before claiming readiness.
6. Use the ticket provider to record implementation references, per-criterion
   evidence, executed checks, limitations and any remaining work. Preserve its
   conflict/revision safeguards. Propose review when appropriate; human acceptance
   remains a separate decision from passing tests or an implementation report.

## Technology references

Load only selected or actually relevant modules; use the project's installed
versions and conventions rather than copying current-version defaults.

- [React and TypeScript](references/technology/react-typescript.md): typed UI,
  interaction, state and accessibility.
- [Next.js](references/technology/nextjs.md): router, server/client boundaries,
  rendering and data freshness; combine with React/TypeScript when applicable.
- [Node.js](references/technology/nodejs.md): runtime, asynchronous services and
  package/module boundaries.
- [Python](references/technology/python.md): packages, typing, resources and tests.
- [FastAPI](references/technology/fastapi.md): HTTP contracts, dependencies and
  request isolation; combine with Python.

## Outputs and validation

Produce the scoped implementation, necessary tests/documentation, and ticket
evidence linking each criterion to an observed result. State changed behavior,
checks and outcomes, unresolved risks, and the next decision. For a lightweight
change, this evidence may remain in the ticket. Standard work can hand off to
`verify-work` when available, but does not depend on that skill being installed.
Do not mark work accepted or the ticket done without the required real human
acceptance recorded under the configured policy.
