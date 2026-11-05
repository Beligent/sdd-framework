# Current-task lifecycle

Canonical source: `skills/sdd-define/references/shared/current-task-lifecycle.md`.

Direct work uses shared project/stack/local guidance without creating records.
Tracked work requires explicit intent under [governance](governance.md). Merely
reading or auditing a ticket does not authorize implementation or record updates.
Use one main assistant; specialists are optional bounded help using the same rules.

Select only useful phases: enough definition, useful planning, implementation,
criterion verification. `sdd-implement` composes this path; it need not be preceded
by `sdd-define` or followed by `sdd-audit`. Reuse existing definitions/plans and
skip satisfied steps. Ordinary scope is plan-task; plan-epic/plan-project require
explicit intent. Ask before consequential design expansion and defer unrelated scope.

During implementation add/update meaningful tests where practical, reuse adequate
coverage and run relevant checks. Apply always/when-relevant and specialized risk
preferences literally. Record every required check with criterion references,
command/procedure, actual outcome, ticket revision and implementation snapshot.
Failing, blocked, unverified or stale required checks leave tracked work open.
When agreed behavior and current required checks pass, record done. Delivery is
separate. An optional audit can inspect done work without reopening it automatically.

Missed original criteria warrant a reopen recommendation; new scope is separate.
An explicitly authorized reopen preserves evidence/history and requires fresh
checks. Never rewrite criteria to disguise a failure or infer acceptance from silence.
