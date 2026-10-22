# Shared governance and artifact contract

Canonical source: `skills/define-work/references/shared/governance.md`.
Other skill copies are packaged resources, not independently edited authorities.

## Context and scope

Read applicable project instructions and `.beligent/config.json`. Skills support
configuration schemas 1 and 2. Missing configuration permits investigation and a
setup proposal; unsupported schemas need a separately reviewed migration before
affected writes. Use configured paths, project conventions and technologies.
Schema-2 workflow settings determine task depth and readiness; schema 1 keeps
its existing profile-based artifact, readiness, and approval behavior. Testing
and delivery settings remain project context until their later lifecycle work.
Read only resources relevant to the requested workflow. Do not replace existing
requirements or infer permission to alter unrelated project settings.

## Incremental specification principles

Beligent SDD optimizes for the smallest amount of specification required to
confidently implement, verify, review, and deliver the next valuable increment.
It expands specification only when complexity, risk, irreversibility, or an
explicit developer request justifies doing so.

Prefer current-task development over speculative project-wide planning. Once
the current increment has enough definition to proceed, continue its work
through implementation and relevant verification before defining or implementing
later work. Project-wide planning remains available when the developer requests
it or approves expansion after a consequential need is identified.

### Specification stop rule

Specification is sufficient when the current increment is unambiguous enough to
implement, its acceptance criteria are testable, consequential risks are
resolved or explicitly accepted, no unresolved decision blocks implementation,
and remaining choices are reversible implementation details. Future behavior
that is not needed for the increment must be out of scope or explicitly
deferred. When these conditions are met, begin implementation; do not continue
specifying hypothetical work.

### Schema-2 task depth

For schema-2 `light` and `standard` work, a compact task is sufficient when it
satisfies the stop rule. Reuse an existing expanded requirement, specification
or plan when it already supplies needed information; do not create a compact
duplicate or expand it to satisfy a checklist. A plan is useful only when it is
requested, the work is complex, consequential sequencing or risk requires it,
or project policy requires it. `rigorous` work retains stronger current-task
artifacts and approvals, while `rigorous + current-task` never means planning
the whole project ahead.

When `ask_before_expansion` is true, identify a consequential concern that lies
beyond the selected depth and ask whether to expand before drafting deeper
design. Name ordinary deferred concerns briefly. Do not generate near-term or
comprehensive design before approval.

### Decisions, deferrals, and scope

Create a formal decision only when a choice blocks implementation, is expensive
or risky to reverse, affects security, privacy, compliance, or a public
contract, affects multiple near-term tasks, or could materially damage the
architecture if wrong. Treat ordinary local and reversible implementation
choices as local: do not create an ADR or approval cycle for naming, file
placement, small component decomposition, compatible test-runner selection, or
other routine details.

Do not specify behavior or design architecture solely because a future version
may need it. When a concern does not affect the current increment, name it as a
brief deferral and stop; do not turn deferred work into a detailed design.

Newly discovered functionality outside the approved task normally becomes a
future candidate rather than expanding the current implementation. Expand the
current task only when needed to meet its criteria, resolve a directly blocking
defect, satisfy a relevant project requirement, or preserve correctness or
security.

When two or more attempted fixes address symptoms without resolving the failing
behavior, stop adding symptom patches and perform root-cause diagnosis before
another implementation attempt. Record the observed failure and diagnosis need
honestly; this rule does not authorize unrelated code changes.

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
