# Ticket-provider contract

Canonical source: `skills/define-work/references/ticket-management/contract.md`.
Packaged copies retain this declaration and must match the canonical bytes.

This is a documented methodology contract, not an API server or runtime package.
All epic/ticket consumers express these operations against the configured
provider. Schema 1 configuration selects `tickets.provider`; only `markdown`
ships in the MVP. Read its [provider instructions](markdown.md) when selected.

## Normalized record

| Field | Meaning |
| --- | --- |
| `id` | Stable logical ID: `EPIC-001` or `TICKET-001` style, unique across the project; never a file path or native issue number |
| `kind` | `epic` or `ticket`, matching the ID prefix |
| `title` | Non-empty concise outcome |
| `status` | `todo`, `in-progress`, `blocked`, `review`, `done`, or `cancelled` |
| `readiness` | `preliminary` or `ready`; independent of status and approval |
| `priority` | `low`, `medium`, `high`, or `urgent`; prioritization is not approval |
| `requirements` | List of stable requirement IDs; unresolved references are described explicitly in preliminary scope/details |
| `specifications` | List of stable specification IDs |
| `acceptance_criteria` | List of criterion references such as `SPEC-001/AC-001`; lightweight tickets may use `TICKET-001/AC-001` defined in their own body |
| `dependencies` | List of prerequisite epic/ticket IDs; no self-links or dependency cycles |
| `approval_refs` | List of current governing `APPR-001` style approval IDs; an empty list grants no approval |
| `evidence` | List of verification IDs, project-relative evidence links or authoritative URLs; describe the result and limits in scope/details |
| scope/details | Body content: expected behavior, exclusions, assumptions, questions, plan references and relevant verification/change notes |

Every list field is present, including when empty, for this expanded normalized
record. Do not fabricate IDs for missing documents. Schema-1 ready standard
records need valid requirement/specification criterion references and a linked
implementation plan. Ready lightweight tickets may keep behavior, criteria and
a short plan in their body. Epic scope/details identify child IDs;
`dependencies` means prerequisites, not membership.

## Schema-2 compact task

A schema-2 `light` or `standard` Markdown ticket may instead use the compact
task form: `id`, `status`, `rigor`, and `design_depth` frontmatter, with optional
`kind: ticket` and `readiness`. Its body holds the objective, expected behavior,
testable `AC-001` style criteria, and only relevant constraints, exclusions,
questions, verification, notes, or evidence. Separate requirement,
specification, plan, and approval references are not required solely because
their concepts apply. A preliminary compact task may name blocking questions.
An omitted or `ready` readiness value requires the stop rule: clear objective
and behavior, testable criteria, no unresolved blocker, and consequential risks
resolved, accepted, or escalated. Missing irrelevant sections are valid.

Existing expanded records remain valid and are reused when sufficient. Rigorous
schema-2 work uses the expanded record and current-task governance. Provider
implementations may normalize either stored representation when returning a
record; the storage form does not change logical identity or conflict handling.

Provider metadata accompanies reads and writes but is not logical identity:
`locator` identifies authoritative storage, and `content_revision` identifies the
exact stored record version. The Markdown provider uses a SHA-256 byte digest.
Another provider may use an equivalent conflict-detection token. Approval scopes
reference the relevant artifact revision, for example an integer document
revision or a ticket's `sha256:<digest>` content revision.

## Operations

| Operation | Inputs and required behavior |
| --- | --- |
| `create` | Normalized content plus kind; allocate/check a unique ID and create without overwriting; return record, locator and content revision |
| `read` | Stable ID; return record and metadata or an explicit missing/ambiguous-ID error |
| `list` / `filter` | Optional kind, status, readiness, priority, dependency or text criteria; return matching records and metadata; report unsupported filters |
| `update` | ID, expected content revision and field/body changes; preserve identity, apply only when revision matches, validate, return updated record/metadata |
| `link` | ID, prerequisite IDs to add/remove, expected content revision; validate existence/cycles, then update without duplicate links |
| `transition` | ID, target lifecycle status, reason/evidence and expected content revision; enforce readiness/approval/evidence conditions, then update |

Refine and prioritize are `update` operations. Every mutation checks the latest
authoritative content against the expected revision immediately before writing.
On mismatch, return a conflict and make no write; inspect the changed content
and propose a merge rather than overwriting. A no-op returns existing metadata.
Missing IDs, invalid records, unsupported operations and unavailable providers
are explicit outcomes, never silently approximated or written to a fallback copy.

## Lifecycle, readiness and approval

- `todo` describes queued work, including preliminary drafts. In schema 1 and
  rigorous schema 2, set `ready` only when profile-specific behavior and
  planning needs are met. In light/standard schema 2, a compact task meeting
  the stop rule is ready. Readiness grants no human approval.
- Enter `in-progress` only when work is ready, prerequisites are satisfied or
  explicitly waived, and the current ticket/plan scope has implementation
  authorization. An epic summarizes child progress; it does not authorize them.
- Use `blocked` with a reason and the condition needed to proceed. Resume only
  when that condition and the applicable implementation gate are satisfied.
- Enter `review` with implementation/verification evidence and known gaps.
  Enter `done` only with verified criteria and required human completion
  acceptance. For an epic, assess its outcome and applicable child results.
- `cancelled` records an authorized removal from scope and its reason. Reopening
  done/cancelled work returns it to `todo` or `blocked`, explains why, and requires
  current readiness and approvals before further implementation.

Human approval is established by actual scoped decisions recorded in referenced
approval artifacts; a label, lifecycle state, readiness value or passing test is
not approval. Material changes invalidate affected authorization; retain
historical decisions and apply change control.

## Provider extension boundary

A future provider documents how every field, operation, ID, revision token,
status and approval/evidence link maps to native storage. It must preserve
identity, traceability, conflicts and gates, and declare unsupported capabilities.
Management workflows remain unchanged. Confirm authorization and available
access before external mutations. Keep one authoritative backend per record;
do not create a competing Markdown mirror. Native issue numbers/URLs stay in
provider metadata. Remote providers and ticket-data migration tooling are outside
the MVP, and provider selection never implicitly migrates ticket data.
