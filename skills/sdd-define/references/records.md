# Tracked records (v2)

Canonical source: `skills/sdd-define/references/records.md`.

Records exist only for explicitly tracked work. Ordinary requests keep their
definition and evidence in chat. `sdd validate` checks the rules marked
*validated*; the implementer remains responsible for the judgments listed last.

## Layout and identity

| Record | Location | Marker |
| --- | --- | --- |
| Ticket | `.sdd/beligent/tickets/TICKET-042.md` | `schema: beligent-sdd/ticket/v2` |
| Epic (optional) | `.sdd/beligent/epics/EPIC-007.md` | `schema: beligent-sdd/epic/v2` |
| Shared spec (optional) | `.sdd/beligent/specs/SPEC-003.md` | `schema: beligent-sdd/spec/v2` |

- The project root is the directory containing `.sdd/`. Paths in frontmatter
  (such as check `tests`) are project-relative POSIX paths; body links resolve
  relative to the file. Create a record directory only when its first record is written.
- IDs use three or more digits, are unique, never reused or renumbered, and the
  file name equals the ID. Records without a v2 marker are rejected, not converted.
- Criteria are `### AC-001` headings under the body's `## Acceptance criteria`.
  The full reference is `TICKET-042/AC-001` or `SPEC-003/AC-002`; inside its own
  ticket a bare `AC-001` is accepted. Never reuse a criterion ID within a record.
- Before writing a record, re-read it; if it changed since you read it, stop and
  merge instead of overwriting.

## Ticket

| Field | Required | Rule |
| --- | --- | --- |
| `schema`, `id`, `title` | yes | Marker, ID matching the file name, nonempty title |
| `status` | yes | `todo`, `in-progress`, `blocked`, `done`, `cancelled` |
| `revision` | yes | Positive integer scope revision, starting at 1 |
| criteria | yes | At least one local `### AC-001` heading or `spec_criteria` entry |
| `spec_criteria` | no | Shared criteria this ticket must satisfy, e.g. `[SPEC-003/AC-002]` |
| `epic` | no | The one epic this ticket belongs to |
| `depends_on` | no | Prerequisite ticket IDs; no self-links or cycles |
| `blocked_reason` | when blocked | What must happen before work can continue |
| `cancelled_reason` | when cancelled | Why the work was dropped |
| `authorization` | when the project records it | `{revision, by, source}` |
| `implementation` | when done | `{base: <commit>, snapshot: git-tree:<sha>}` |
| `checks` | when done | Verification results, see below |
| `history` | no | `revised` entries preserving earlier scope and evidence |
| `delivery` | no | `{state, reference, point, reason}`; independent of `status` |

A ticket's required criteria are its local headings **plus** every
`spec_criteria` entry. References to specs, epics and dependencies are resolved
for open tickets only; done and cancelled tickets are historical, so later spec
edits never invalidate them.

## Checks and closure

Each check records one actual result:

| Field | Required | Rule |
| --- | --- | --- |
| `id` | yes | Unique in the ticket; equal to a config `checks` id for project checks |
| `criteria` | unless a project check | Criterion references this check verifies |
| `required` | yes | `true` when closure depends on it |
| `command` or `procedure` | exactly one | Automated command, or the manual steps taken |
| `observed`, `by` | manual checks | What was seen, and who performed it (a name or `assistant`) |
| `outcome` | yes | `pass`, `fail`, `blocked`, `not-run`, or `not-applicable` (optional checks only, with `reason`) |
| `revision`, `snapshot` | yes | Ticket revision and `git-tree:` snapshot the check ran against |
| `coverage` | automated checks with criteria | `added`, `updated` or `existing` automated coverage |
| `reason` | when needed | Required for `not-applicable` and for criteria verified only manually |
| `before` | no | `fail` when a failing-before regression was reproduced |
| `tests`, `at` | no | Test files added/updated; ISO date-time of the run |
| `carried_forward` | manual only | Why changes since the check's snapshot cannot affect it |

Run `sdd snapshot` to obtain `base` and `snapshot` for the final implementation.
The snapshot is the Git tree of the working directory, including untracked
non-ignored files and excluding `.sdd/beligent/`, so recording evidence does not
change what was verified. Run `sdd validate --snapshot TICKET-042` before closing.

A ticket may be set to `done` only when (*validated*):

1. `implementation` is set, and each counted check matches the current
   `revision` and `implementation.snapshot` (a manual check may instead state
   `carried_forward`);
2. every criterion is covered by a passing current required check;
3. every config check with `required: true` has a passing current result;
4. no required check is stale, `fail`, `blocked` or `not-run`;
5. a criterion verified only by manual checks gives a `reason`;
6. when config sets `tracking.authorization: recorded`, `authorization.revision`
   equals `revision` (this also applies before `in-progress`).

A failed required check keeps the ticket `in-progress`. A check that cannot run
because something external is missing is `blocked`, with status `blocked` and a
`blocked_reason`. Unrun checks are `not-run`. Narrative prose never closes a ticket.

## Lifecycle and revisions

`todo` → `in-progress` ⇄ `blocked` → `done`; any open status → `cancelled`.
**`done` and `cancelled` are final** (*validated with `--since <ref>`*): only a
ticket's `delivery` may change afterwards. A later problem in done work is fixed
as an ordinary request, or as a new ticket when tracking is explicitly requested.

While a ticket is open, a change to its criteria or `spec_criteria` increments
`revision` (*validated*) and appends a `history` entry
`{event: revised, revision: <previous>, reason, ...}` that preserves the previous
criteria, implementation and checks. History is append-only. Checks and recorded
authorization from an earlier revision no longer count. Shared specs have no
revision: refine them freely while work is being defined.

Epic statuses are `todo`, `in-progress`, `done`, `cancelled`. Membership is the
ticket's `epic` field; a done epic needs members that are all done or cancelled.
Spec statuses are `draft`, `active`, `retired`; an active spec has criteria.

## Delivery

`delivery.state` is `committed`, `pushed`, `pr-open` or `delivered` with an
observed `reference`, or `blocked` with a `reason`. `delivered` also needs
`point` equal to config `delivery.delivered_at` (default `merged-pr`). Delivery
never gates or changes `done`.

## Judgment that stays with the implementer

The validator cannot establish that criteria capture the agreed work, that a test
exercises its criterion, that automated coverage was impractical, that commands
really ran or manual observations happened, that a `carried_forward` reason
holds, or whether an audit finding is original or new scope. Record only real results.
