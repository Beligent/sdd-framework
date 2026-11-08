# Ticket contract

Canonical source: `skills/sdd-define/references/records.md`.

The ticket is the only record. `sdd validate` checks every rule marked
*validated*; the developer judges whether the requirements capture the intent.

## Location and identity

- One file per ticket: `.sdd/beligent/tickets/TICKET-042.md`, with
  `schema: beligent-sdd/ticket` in the frontmatter (*validated*). The file name
  equals the ID; IDs have three or more digits, and a committed ID is never reused.
- Other files in the folder, and earlier `epics/` or `specs/` folders, are
  reported (*validated*). Records without the marker are rejected, not converted.

## Frontmatter

| Field | Required | Rule |
| --- | --- | --- |
| `schema`, `id`, `title` | yes | Marker, ID matching the file name, nonempty title |
| `status` | yes | `todo`, `in-progress`, `blocked`, `done`, `cancelled` |
| `depends_on` | no | Prerequisite ticket IDs; no self-links or cycles. A removed ticket counts as satisfied |
| `blocked_reason` | when blocked | What must happen before the agent can continue |
| `cancelled_reason` | when cancelled | Why the work was dropped |
| `checks` | when done | Results of the checks run, see below |

## Body

```markdown
## Context
Why the work exists and what the agent needs to know.

## Requirements
The behavior to build, in plain language.

## Acceptance criteria
### AC-001
An observable, testable result.

## Out of scope
What the agent must not change.
```

`## Requirements` must not be empty and `## Acceptance criteria` needs at least
one `### AC-001` heading with text under it (*validated*). Context and Out of
scope are strongly recommended. Criterion IDs are unique within the ticket.

## Checks

| Field | Required | Rule |
| --- | --- | --- |
| `id` | yes | Unique in the ticket; equal to a config `checks` id for project checks |
| `criteria` | unless a project check | The ticket's own criterion IDs, e.g. `[AC-001]` |
| `command` or `procedure` | exactly one | The command run, or the manual steps taken |
| `observed` | manual checks | What was seen |
| `outcome` | yes | `pass`, `fail`, `blocked` or `not-run` |

A check with a config id records that check's configured command (*validated*).
Record only results that actually happened.

## Done

A ticket may be `done` only when (*validated*):

1. every criterion is covered by a check with outcome `pass`;
2. every config check with `required: true` has a passing result;
3. no recorded check is `fail`, `blocked` or `not-run`.

Done and cancelled tickets are final: never reopened or edited. See the
[shared contract](shared/governance.md#tickets) for blocked, removal and IDs.
