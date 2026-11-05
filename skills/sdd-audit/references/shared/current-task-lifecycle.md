# Current-task lifecycle

Canonical source: `skills/sdd-define/references/shared/current-task-lifecycle.md`.

Direct work uses shared project/stack/local guidance without creating records.
Tracked work requires explicit intent under [governance](governance.md). Merely
reading or auditing a ticket does not authorize implementation or record updates.
Use one main assistant; specialists are optional bounded help using the same rules.

Select only useful phases: enough definition, useful planning, implementation,
criterion verification. `sdd-implement` composes this path; it need not be preceded
by `sdd-define` or followed by `sdd-audit`. Reuse existing definitions and skip
satisfied steps. Ask before consequential design expansion and defer unrelated scope.

During implementation add/update meaningful tests where practical, reuse adequate
coverage and run relevant checks. Record every required check with its criteria,
command or procedure, actual outcome, ticket revision and implementation snapshot.
Failing, blocked, unrun or stale required checks leave tracked work open. When
agreed behavior and current required checks pass, record done. Delivery is separate.

Done and cancelled tickets are final. An optional audit can inspect done work and
report findings; a later fix is ordinary work, or a new ticket when tracking is
explicitly requested. Never rewrite criteria to disguise a failure or infer
acceptance from silence.
