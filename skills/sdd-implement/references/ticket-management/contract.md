# Ticket-provider contract

Canonical source: `skills/sdd-define/references/ticket-management/contract.md`.
This is portable methodology, not a transactional ticket runtime. Only the
[Markdown provider](markdown.md) ships. One authoritative backend per record.

## Minimum records

Ticket frontmatter requires `id: TICKET-042`, positive integer `revision`, and
`status`. The body supplies objective, behavior and stable `AC-001` headings.
Optional fields: `kind: ticket`, title, readiness (preliminary/ready), priority,
requirements, specifications, acceptance_criteria, dependencies, epic,
authorization, implementation, checks, history, evidence, delivery, rigor and
design_depth. Lists are actual lists when present. Local criteria can be derived
from headings; explicit references use `TICKET-042/AC-001` or `SPEC-001/AC-001`.
Referenced spec criteria must belong to a listed specification. No epic or shared
spec is required for a standalone ticket. Shared specs use id/revision/status,
stable criterion headings and an authoritative definition of multi-ticket behavior.

Epics use `EPIC-001`, revision, status, criterion headings and optional `tickets`
listing child IDs. Dependencies mean prerequisites, not child membership. Done
epics require completed children and outcome verification. Other artifact IDs
retain REQ/SPEC/ADR/PLAN/VERIFY/APPR prefixes and positive integer revisions.

Stable IDs are not paths; preserve renamed files and resolve by frontmatter ID.
Reject duplicates, missing/wrong-kind references and dependency cycles. Never
fabricate IDs for absent documents. Narrative conventions can remain path-identified.

## Check records and closure

`implementation` names the reviewed commit or immutable working-diff/content digest.
`checks` is a list of records with:

| Field | Requirement |
| --- | --- |
| id | Unique nonempty check identifier |
| criteria | Nonempty list of this ticket's fully qualified criterion references |
| required | Boolean indicating whether closure requires this check |
| command or procedure | Actual automated command or reproducible manual procedure |
| outcome | pass, fail, blocked, unverified, or not-applicable |
| revision | Covered ticket revision |
| snapshot | Covered implementation snapshot, matching implementation for closure |
| reason | Required for not-applicable; describe other limitations when relevant |

Done requires a current implementation snapshot, at least one required check,
every required check passing at the current revision/snapshot and passing required
evidence for every criterion. Required manual checks obey the same rule. Failed,
blocked, unverified and stale checks keep work open. Optional not-applicable checks
need a reason. Narrative Evidence text, approval fields and Git delivery cannot
substitute for structured closure evidence. Validation checks declared shape,
links, outcomes and coverage; review establishes that results are truthful.

Delivery metadata is optional and independent of status. When present it carries
state (ready-for-delivery, committed, pushed, pr-open, delivered or blocked), an
observed reference for committed and later states, and the configured point for
delivered. It is not a closure prerequisite. Its permissions and
milestone come from project Git policy. No human acceptance or Git operation is
universally required for done; actual project authorization still applies to work.

## Lifecycle, revisions and scope

Statuses: todo, in-progress, blocked, review (optional), done, cancelled.
Readiness is independent of implementation authorization. Preliminary drafts can
record unknowns; ready work has enough unambiguous behavior/criteria to proceed.
A direct scoped request to implement supplies authorization; a read-only reference
does not. Record blocked reasons and what is needed to proceed.

Increment revision for substantive scope changes or authorized reopening. Retain
old scope/checks/snapshots in `history` or retrievable version control before
replacing current evidence. History entries identify revision and reason and may
include criteria, definition, checks and snapshot. Current evidence must be rerun
when its revision/snapshot becomes stale. No-op updates preserve bytes/revision.

An audit of closed work is read-only by default. Recommend reopening for a missed
original criterion; on explicit reopen authorization preserve evidence/history,
increment revision and return to todo/blocked. New requested scope gets a separate
ticket only if tracking is requested. Never reopen for an unrelated enhancement.

## Operations and conflicts

Create, read, list/filter, update/refine/prioritize, link and transition remain
semantic operations. Read returns record, locator and `content_revision`:
`sha256:<digest>` of the complete stored bytes, kept outside the file. Mutations
require the expected digest, preflight IDs/links, recheck immediately before a
scoped edit, then read back and validate. Conflicts make no write; report competing
content and propose a merge. This detects observed conflicts, not atomic CAS.
Queries, audits and status requests never write records by default. Explicit
tracking/implementation authorizes the selected task's evidence/status updates;
standalone audit requires separate mutation authorization.
