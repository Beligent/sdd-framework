# Shared governance and artifact contract

Canonical source: `skills/define-work/references/shared/governance.md`.
Other skill copies are packaged resources, not independently edited authorities.

## Context and scope

Read applicable project instructions and `.beligent/config.json`. Skills support
configuration schema 1. Missing configuration permits investigation and a setup
proposal; unsupported schemas need a separately reviewed migration before
affected writes. Use configured paths, project conventions and technologies.
Read only resources relevant to the requested workflow. Do not replace existing
requirements or infer permission to alter unrelated project settings.

## Profiles and independent entry

The selected profile names required artifact kinds and human decisions.
`lightweight` defaults to one ticket with context, observable behavior, criteria,
short plan and verification notes; implementation and completion decisions are
required. `standard` additionally uses overview, requirements, specification and
plan, with a scope decision. Epics and ADRs are used when useful. A custom
configured profile may vary depth while retaining implementation/completion
decisions. Existing artifacts or clearly linked ticket sections can satisfy
lightweight requirements; do not create empty documents to complete a checklist.

Invoke a requested management route directly. Inputs may already exist or be
supplied by the user; do not run unrelated routes. Preliminary tickets may start
before detailed specifications/architecture. Mark unknowns and readiness
explicitly; refine them after planning. Readiness and lifecycle status do not
establish approval.

## Human decisions

Before implementation, identify the real human authorization covering the
current behavior, constraints, acceptance criteria and implementation scope.
It can be an explicit decision in the active conversation or a recorded decision
with a retrievable source. Existing authorization for that same scope satisfies
the gate; do not ask again merely because another skill is invoked.

An agent can draft a record of a real decision. It cannot invent an approver,
signature, date, source or approval. Silence, a ready label, tests, another
agent's recommendation and illustrative example approvals are not human consent.
Approval of setup does not approve product scope or code implementation.

An approval record identifies an `APPR-001` style ID, decision/gate, human
decision-maker, source, date when known, scope, artifact IDs/locations and their
reviewed revisions. Use integer revisions for ordinary documents or the
provider's content revision for a ticket snapshot. Capture the approved snapshot
or a retrievable diff/commit so later changes can be compared. If the decision
or its covered content cannot be established, report the gap and request the
missing decision before dependent implementation.

Material changes to behavior, criteria, constraints, scope or plan invalidate
affected approval and require a new decision. Retain historical records. A
ticket's full-file content digest is also a concurrency token: lifecycle,
evidence or approval-link edits change that digest without necessarily changing
approved behavior. Compare against the approved snapshot; such administrative
changes alone do not require another implementation decision. If that comparison
cannot be made, do not assert approval still covers unknown content.

Completion requires mapped verification evidence and the configured human
acceptance. Passing checks supports a technical recommendation; do not mark a
ticket done solely because checks passed. Keep unverified/failing criteria
visible and separate technical verification from the completion decision.

## Traceability and change handling

Use stable IDs: requirements `REQ-001`, specifications `SPEC-001`, criteria
`SPEC-001/AC-001`, epics `EPIC-001`, tickets `TICKET-001`, plans `PLAN-001`,
decisions `ADR-001` and reports `VERIFY-001`. Do not renumber existing identities.
Traceable requirements, specifications, ADRs, plans, approvals and reports carry
`id`, integer `revision` and `status` frontmatter; increase the revision when
approved substantive content changes. A project overview or convention note may
remain narrative and be identified by its configured path. Ticket/epic records
use their provider contract rather than this document revision field.

Engineering references approved management artifacts instead of duplicating
requirements. For ticket reads/writes, use the configured provider contract and
conflict token. Record the request, reason, affected artifacts/approvals and
verification impact before applying a material change. Local links resolve from
their containing artifact; a future provider may use authoritative URLs.

## Separate maintenance operations

Skill updates change installed resources and installer provenance only. Project
configuration migration and managed instruction refresh each need their own
reviewed diff, preservation checks and applicable authorization. Do not infer a
migration from a framework version change. Project artifacts and overrides stay
outside installed skills.
