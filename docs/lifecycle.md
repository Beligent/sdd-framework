# Lifecycle and human decisions

Use the [shared governance contract](../skills/define-work/references/shared/governance.md)
for approval semantics, profile selection and change handling. That contract is
packaged into every skill so installed workflows remain understandable.

| Profile | Typical use | Default artifacts | Default decisions |
| --- | --- | --- | --- |
| Lightweight | Bug fix or isolated improvement | One ticket containing behavior, criteria, short plan and verification evidence | Implementation and completion |
| Standard | New feature or complex change | Overview, requirements, specification, plan, ticket; epics and ADRs when useful | Scope, implementation and completion |

Customize these defaults in `.beligent/config.json`. Additional profiles are
supported when their required artifacts and approval policy are explicit. Keep
an implementation decision and completion decision in every profile. Existing
authorization for the same concrete revisions counts; do not ask twice.

Discovery and drafting can begin without implementation approval. Requirements,
specification, epic generation and ticket management can each be called directly.
Preliminary tickets record unknowns; planning refines them to ready. Technical
findings can send work back to requirements or specification. Material changes
invalidate only approvals whose scope or referenced revisions are affected.

A ready ticket is adequately planned. A ticket in `review` has implementation
evidence awaiting verification/acceptance. `done` requires verified criteria and
the configured completion decision. Failing or unrun checks remain visible;
do not manufacture evidence to advance a status.

## Schema-2 compact readiness

Schema 1 retains the profile behavior above. In schema 2, light and standard
current-task work may use one compact task with a clear objective, unambiguous
behavior, testable criteria, no unresolved blocking questions, and consequential
risks resolved, accepted, or escalated. It may contain only sections relevant to
the work. Separate requirement, specification, or plan artifacts are optional
when the task is sufficient. Rigorous work retains stronger current-task
governance without automatically planning later work. When expansion is set to
ask first, identify consequential concerns and request approval before creating
deeper design.
