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

The four lifecycle skills compose manually as `define-work`, optional
`plan-work`, `implement-ticket`, and `verify-work`. `plan-task` is the default
schema-2 planning scope for current work. `plan-epic` and `plan-project` require
explicit intent. Stable project context is referenced rather than copied into
every task, and unrelated discoveries remain future candidates. Verification
uses the configured testing categories only when their policy and the changed
risk make them applicable, then leaves evidence suitable for later delivery.

`develop-task` composes this path for one selected task. It reuses sufficient
definition and approved plans, asks only for blocking clarification, creates a
task plan only when useful, implements, verifies, and requests focused manual
validation when relevant. It then stops ready for delivery without selecting
another task or performing commit, push, or pull-request actions.

After two ineffective symptom-level fixes against the same behavior,
`develop-task` stops corrective implementation in `diagnosis-required` and uses
the shared root-cause contract before another attempt. `diagnose` can also be
invoked directly without creating a task or planning artifacts. Diagnosis keeps
observations separate from hypotheses, respects design depth, and recommends the
smallest supported correction.

Implementation and verification apply the same simplicity and drift review. A
significant unapproved behavior addition pauses or fails the task; necessary
supporting code remains valid when its connection to required behavior is clear.
For an obviously disproportionate process, the framework warns that remaining
specification or planning may be collapsed into the compact task. The warning
never rewrites artifacts or bypasses required decisions automatically.
