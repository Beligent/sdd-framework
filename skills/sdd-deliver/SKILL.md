---
name: sdd-deliver
description: Deliver one verified tracked or untracked change through authorized task-scoped commit, push and pull-request steps, stopping at the configured repository delivery point.
---

# Deliver verified work

Read project instructions, configuration when present,
[governance](references/shared/governance.md) and
[delivery](references/delivery.md). Use the named task or single unambiguous
current change. Tracking is optional; untracked verification can be established
from the conversation and final diff. Missing configuration requires explicit
Git direction and repository policy instead of invented defaults.

1. Establish exact scope/revision, verification, required manual validation and
   review, authorization and completion target. Block delivery for unresolved
   criteria, diagnosis, contradictory evidence or unsafe scope.
2. Inspect branch, HEAD, remotes/upstream, index, working tree, untracked files and
   conflicts. Define exact task paths and exclude unrelated changes. Preserve
   existing index content; ask for separation if safe isolation is impossible.
3. Apply configured Git policy and current authorization. Stage only reviewed
   paths, inspect the exact staged diff and create a scoped commit when allowed.
4. Apply push and PR policy; `ask` requires permission before push. Do not merge
   without separate explicit authorization. Observe the configured completion
   point; an open PR never establishes a merge.
5. Report commit, remote branch, PR reference, verification and limits. If tracked,
   update only the ticket's `delivery` field as described in the
   [record contract](references/records.md), re-reading the file before writing.
   Never create a ticket as a side effect of delivery.

`delivered` records an observed Git milestone. Ticket done already means agreed
work and required checks are complete; delivery never redefines or gates it.
Record delivery independently and only with applicable mutation authorization.
Never force push by default, reset, rewrite history, stage unrelated work, repair
product behavior or select later work. Stop at the last permitted delivery state.
