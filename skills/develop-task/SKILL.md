---
name: develop-task
description: Develop one bounded Beligent SDD task from its current definition through implementation and relevant verification, stopping ready for delivery. Use for ordinary day-to-day feature, fix, or refactoring work; it does not perform Git delivery or select later backlog work.
---

# Develop one task

Move exactly one current task through the existing SDD lifecycle. Orchestrate the
shared phase contracts; do not recreate their requirements, planning,
implementation, or verification logic.

## Context and selection

Read applicable project instructions, `.beligent/config.json`,
[governance](references/shared/governance.md), the
[current-task lifecycle](references/shared/current-task-lifecycle.md), the
[diagnosis and simplicity contract](references/shared/diagnosis-and-simplicity.md), and the
configured [ticket contract](references/ticket-management/contract.md) and
[Markdown provider](references/ticket-management/markdown.md). Load only relevant
project conventions, ADRs, artifacts, and code.

Use a developer-named task. Otherwise use the single obvious current or ready
task. If several relevant candidates exist and none is clearly current, present
the small candidate set and ask which to develop; do not rank, expand, or plan
the backlog. Schema 1 retains its existing profile artifacts, readiness, and
approval gates. Schema 2 uses rigor, design depth, expansion, and testing policy.

## Schema-2 orchestration decisions

| Observed state | Next action |
| --- | --- |
| Ready compact task | Skip definition and planning; implement |
| Ready expanded task with applicable PLAN | Reuse its REQ/SPEC/PLAN; implement |
| Small blocking gap | Batch concise clarification; update the current task only |
| Stop rule met and implementation is obvious | Skip PLAN; keep concise notes in the task |
| Coordinated steps, cross-component change, sequencing, material risk, rollback, non-obvious tradeoff, or rigorous requirement | Use `plan-task`; reuse existing decisions |
| Consequential expansion beyond selected depth | If `ask_before_expansion` is true, identify the boundary and ask before broader design |
| Several plausible tasks | Ask the developer to select one |
| Manual observation needed after automated checks | Provide one focused manual-validation checklist and wait |
| Two ineffective symptom-level fixes do not resolve the same behavior | Stop corrective implementation in `diagnosis-required`; apply the diagnosis contract before another attempt |
| Verification complete | Update evidence/status and stop `ready-for-delivery` |

Never infer `plan-epic` or `plan-project`. Comprehensive work is allowed only
when the configured depth or explicit request selects it, and remains bounded to
the current task unless the developer separately requests broader work.

## Execute the selected path

For schema 1, orchestrate the same phases using its existing profile rules; do
not apply this schema-2 short path to legacy standard projects.

1. Read the authoritative task and reusable artifacts at their current
   revisions. Resolve only blocking definition gaps, then apply the canonical
   specification stop rule. Use the packaged [compact task
   template](assets/compact-task.md) only when schema-2 readiness calls for a new
   compact representation.
2. Decide whether `plan-task` adds value. Create a separate
   [PLAN](assets/implementation-plan.md) only when the shared lifecycle calls for
   it; otherwise keep concise implementation notes in the task.
3. Implement the bounded task using [implementation guidance](references/implementation.md)
   and only relevant packaged technology guidance: [React/TypeScript](references/technology/react-typescript.md),
   [Next.js](references/technology/nextjs.md), [Node.js](references/technology/nodejs.md),
   [Python](references/technology/python.md), or [FastAPI](references/technology/fastapi.md).
   Preserve resolved decisions. Apply the shared drift, future-candidate, and
   depth-expansion rules. Do not create follow-up tickets unless explicitly
   requested.
4. Select checks from project `testing` policy and changed risk using [testing
   guidance](references/testing.md). Run categories configured as `always`;
   apply conditional categories only when their condition is relevant. Apply
   [review guidance](references/review.md) to acceptance criteria, scope,
   simplicity, speculative abstractions, and maintainability. Do not add
   unrelated test infrastructure.
5. Record automated evidence, failures, limitations, and any manual procedure
   against existing criteria without rewriting them. Use the packaged
   [verification report](assets/verification-report.md) only when a separate
   report is useful.
6. When focused manual validation is still relevant, report the automated result
   and request only checks not already established. After actual confirmation,
   record it under existing lifecycle rules.
7. Update provider evidence/status with conflict checks and stop. Do not select
   the next task.

## Failure and delivery boundary

Resolve an ordinary first fixable failure within current scope and reverify it.
At the diagnosis contract's two-fix threshold, stop accumulating patches and
switch to its root-cause investigation before another corrective attempt.

The terminal outcome is `ready-for-delivery`, pending manual validation, blocked,
or diagnosis-required. You may propose a conventional commit message. Do not
commit, push, create or merge a pull request, close a task from Git state, or
claim human completion acceptance. Hand off `ready-for-delivery` work to the
independently invoked `deliver-work` skill when repository delivery is requested.
