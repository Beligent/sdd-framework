---
name: deliver-work
description: Deliver one verified Beligent SDD task through task-scoped commit, push, and pull-request steps allowed by project Git policy, stopping at the configured repository delivery point. Use after develop-task or independently for already completed work; it does not implement features or select another task.
---

# Deliver verified work

Move one bounded, verified change from `ready-for-delivery` to the repository
delivery point allowed by project policy.

## Context and preflight

Read applicable repository instructions, `.beligent/config.json`,
[governance](references/shared/governance.md), the canonical
[delivery contract](references/delivery.md), and the configured
[ticket contract](references/ticket-management/contract.md) and
[Markdown provider](references/ticket-management/markdown.md).

Use a developer-named task. Otherwise identify only the single unambiguous
current change. Direct invocation does not require prior use of `develop-task`.
If task scope is ambiguous, present the relevant candidates and ask; do not
select or plan backlog work.

Apply the delivery contract's complete preflight before any Git mutation. Work
that is not sufficiently verified, has incomplete required manual validation or
review, contains a blocking criterion, or remains `diagnosis-required` is
`blocked`. Report only the missing delivery prerequisite; do not restart the SDD
lifecycle or fix product behavior.

## Procedure

1. Resolve the task, delivery evidence, schema version, Git policy, configured
   completion point, and current authorization. For schema 1, require explicit
   direction for every requested mutation.
2. Inspect branch, HEAD, remotes/upstream, index, working tree, untracked files,
   and conflicts. Establish an exact task path set and surface unrelated changes.
3. If commit is permitted, stage only task paths, inspect the exact staged diff,
   choose the required commit style, and create one task-relevant commit. When
   committing is forbidden or unsafe, stop with the proposed path set and message.
4. Apply `push_after_commit`. For `ask`, stop at `committed` and request push
   permission. For `always`, push only when authorization and remote state permit.
   For `never`, do not push.
5. Apply pull-request policy after an eligible push. Produce a concise title and
   body with behavior, criterion references, verification, relevant manual
   validation, and known limitations. Do not merge without separate policy and
   explicit authorization.
6. Record delivery evidence and the observed delivery state through the provider
   with conflict checks. Mark `delivered` only at `task_complete_at`, then stop.

## Boundaries

Use the smallest safe Git action. Never force push by default, reset hard,
rewrite history, delete branches/remotes, blindly stage unrelated files, commit
secrets/private output, resolve conflicts destructively, or absorb unrelated
changes. Do not implement, refactor, respecify, diagnose, close a task solely
from Git state, or select the next task.
