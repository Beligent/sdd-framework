# Schema-2 current-task lifecycle

Canonical source: `skills/define-work/references/shared/current-task-lifecycle.md`.
Packaged copies let every lifecycle skill operate independently. This contract
applies to schema 2; schema 1 retains its profile-based workflow and artifacts.

## Project context and task boundary

Load relevant stable context from project instructions, configuration,
conventions, major ADRs, and existing SDD artifacts. Reference that context from
the task instead of copying the stack, architecture principles, testing and Git
policies, accessibility or security targets, and project terminology into every
artifact. Repeat context only when the task must remain independently usable.

Treat an ordinary request as one bounded current task. Do not infer a project
plan, complete backlog, comprehensive design, or later tickets. The manual path
is `define-work`, then `plan-work` only when useful, then `implement-ticket`, then
`verify-work`. Each skill remains independently invocable.

Use the specification stop rule in [governance](governance.md) as the sole
definition of enough specification. Ask meaningful blocking questions together.
When the stop rule is met, proceed instead of improving completeness.

Respect `workflow.design_depth` and apply governance's ask-before-expansion,
deferral, feature-drift, future-candidate, decision-significance, and
depth-expansion rules. Keep independent work moving while a gated expansion
waits.

## Phase behavior

- **Define:** Accept a rough request or an existing requirement, specification,
  or ticket. Reuse existing context, choose the smallest valuable increment, and
  detect only gaps that block it. For light/standard work, create or update one
  compact task when sufficient. Reuse expanded artifacts; create a separate
  requirement, specification, or epic only when explicitly requested or
  justified by rigor, complexity, or consequential scope.
- **Plan:** Select `plan-task` for an ordinary request tied to current work.
  `plan-epic` and `plan-project` require explicit developer intent. A small or
  obvious task may need only concise implementation notes in its task. Create a
  PLAN only when requested, useful for complexity or consequential sequencing or
  risk, or required by project policy.
- **Implement:** Accept a ready compact task or expanded work backed by its
  existing artifacts. Reuse those sources; do not regenerate specifications,
  reopen resolved decisions without a real contradiction, or plan later tasks.
  Keep reversible choices local. Stop affected work for consequential new
  decisions, scope drift, or gated depth expansion.
- **Verify:** Select checks from `testing` policy and the current change's risks.
  Apply `always`, `when-relevant`, and specialized values such as
  `critical-user-journeys`, `affected-ui`, or `risk-based` literally. Separate
  automatic from manual evidence. Verify stable acceptance criteria without
  rewriting them, and review scope drift, unnecessary complexity, speculative
  abstractions, maintainability, failures, and unverified behavior.

Verification leaves the bounded task with honest evidence and findings suitable
for later delivery handling. This lifecycle does not authorize or orchestrate a
commit, push, pull request, or unrelated future work.
