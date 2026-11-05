# Records, templates and evidence

Records exist only for explicitly tracked work; ordinary work keeps definitions,
plans and evidence in chat. The normative rules are in the
[record contract](../skills/sdd-define/references/records.md).

| Record | Location | Minimum | Template |
| --- | --- | --- | --- |
| Ticket | `.sdd/beligent/tickets/TICKET-NNN.md` | `schema`, `id`, `title`, `status`, `revision`, ≥1 criterion | [ticket](../skills/sdd-define/assets/ticket.md) |
| Epic (optional) | `.sdd/beligent/epics/EPIC-NNN.md` | `schema`, `id`, `title`, `status` | [epic](../skills/sdd-define/assets/epic.md) |
| Shared spec (optional) | `.sdd/beligent/specs/SPEC-NNN.md` | `schema`, `id`, `title`, `status`, criteria when active | [spec](../skills/sdd-define/assets/spec.md) |

Criteria are `### AC-001` headings under `## Acceptance criteria`, referenced as
`TICKET-001/AC-001` or `SPEC-001/AC-001`. A ticket must satisfy its local criteria
plus every `spec_criteria` entry. File names equal IDs; IDs are never reused.

## Closure evidence

Before `done`, record `implementation: {base, snapshot}` from `sdd snapshot` and one
check per actual result: criteria, `required`, command or manual procedure with
observation and performer, outcome, revision and snapshot. Every criterion and
every configured required check needs a passing current required check. Failed,
blocked, unrun or stale required checks keep the ticket open. Narrative prose
never closes a ticket.

Done and cancelled tickets are final; `sdd validate --since <ref>` enforces it.
Templates are drafts, never evidence. See the [runnable fixture](../examples/workflow-fixture/README.md).
