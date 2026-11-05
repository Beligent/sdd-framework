# Records, templates and evidence

Artifacts are opt-in. Ordinary work keeps definitions, plans and evidence in chat.
Project settings live at .sdd/beligent/config.json; configured paths resolve from
consumer root. A standalone ticket needs no epic, requirement or separate spec.
Use a durable shared spec for behavior spanning tickets or outliving them.

| Record | Minimum | Optional/relevant |
| --- | --- | --- |
| Ticket | TICKET-NNN id, positive revision, status, body with objective/behavior/AC headings | title, kind, readiness, local or linked criteria, epic, specifications, dependencies, implementation, checks, history, delivery |
| Epic | EPIC-NNN id, revision, status, outcome criteria | tickets membership, dependencies, implementation and outcome checks |
| Shared spec | SPEC-NNN id, revision, status, stable AC headings | requirements and behavior/context links |
| Narrative guidance | Configured path | No artificial artifact ID required |

A body may define AC-001 locally. Explicit criterion refs use TICKET-001/AC-001
or SPEC-001/AC-001. Linked criteria must belong to a listed specification. Stable
IDs survive file renames. Unique records/criteria, link resolution and dependency
cycles are checked. Provider locators identify storage and SHA-256 content digests
are external concurrency tokens, distinct from positive integer scope revisions.

## Required closure evidence

Set implementation to the actual reviewed commit or immutable diff/content digest.
Each checks entry has id, criteria, required, command or procedure, outcome,
revision and snapshot. Done needs all required checks passing at the record's
current revision/snapshot and required passing evidence for every criterion.
Failed/blocked/unverified/stale required checks keep work open. Optional
not-applicable checks need reasons. Narrative evidence alone never closes a task.
Structural checks validate declared data; the implementer verifies actual results.

Preserve old scope/checks/snapshots in history or retrievable version control before
substantive revisions or authorized reopening. History entries carry revision and
reason and may include definition/criteria/checks/snapshot. Do not erase evidence
to achieve closure. Audit is read-only by default; missed original scope warrants
a reopen recommendation, new scope is separate. Git delivery never gates done.

Templates are packaged under sdd-define/assets and sdd-audit/assets; they are
drafts, never evidence. See the [provider contract](../skills/sdd-define/references/ticket-management/contract.md),
[standalone template](../skills/sdd-define/assets/compact-task.md),
[shared spec template](../skills/sdd-define/assets/specification.md) and
[runnable fixtures](../examples/workflow-fixture/README.md).
