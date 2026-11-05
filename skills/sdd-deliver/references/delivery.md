# Repository delivery contract

Canonical source: `skills/sdd-deliver/references/delivery.md`.

Delivery changes repository or remote state for exactly one verified task. It
does not implement, diagnose, respecify, verify unrelated behavior, or select
later work. Configured projects use `.sdd/beligent/config.json` Git policy. Unconfigured
projects have no framework Git policy: require explicit developer direction for
each commit, push, pull-request, or merge action and never infer permission from
defaults.

## States and completion

These are delivery workflow states, not new ticket frontmatter values:

| State | Meaning |
| --- | --- |
| `ready-for-delivery` | Verified task and understandable repository state passed preflight |
| `committed` | The bounded change exists in a new local commit |
| `pushed` | The intended remote branch contains that commit |
| `pr-open` | A pull request for the delivered change exists |
| `delivered` | The configured `delivery.delivered_at` point has been observed |
| `blocked` | A prerequisite, policy decision, authorization, conflict, or safe change boundary is missing |

Map `delivered` exactly:

| `delivered_at` (default `merged-pr`) | Evidence required before `delivered` |
| --- | --- |
| `commit` | New task-scoped commit exists locally |
| `push` | Remote accepted the intended commit/branch |
| `pull-request` | Pull request was created and its URL/identifier recorded |
| `merged-pr` | Pull request merge was observed; an open PR is only `pr-open` |

Do not mark delivery complete earlier. Ticket done is separate. `merged-pr` does not authorize merging.
Without separate explicit merge authorization and satisfied repository policy,
stop at `pr-open` and report merge as pending.

## Preflight

Before a mutation, establish:

- the named task or the single unambiguous current change and its
  `ready-for-delivery` evidence;
- required automated checks, manual validation, and review under project policy;
- no unresolved blocking criterion, `diagnosis-required`, specification
  contradiction, or consequential expansion decision;
- current branch, upstream/remotes, HEAD, staged and unstaged changes, untracked
  files, conflicts, and relevant repository instructions;
- an exact task-to-path boundary and whether staged content already contains
  unrelated work.

Report a specific `blocked` reason when any prerequisite cannot be established.
Do not rerun the full lifecycle or repair product behavior during delivery.

## Policy decisions

Config `delivery.commit`, `delivery.push` and `delivery.pull_request` each take
one value (default `ask`):

| Value | Required behavior |
| --- | --- |
| `allowed` | Perform the step after preflight when current authorization and repository state permit |
| `ask` | Stop at the previous state and ask before this step |
| `never` | Do not perform the step; prepare paths, message or PR text for a human |

Follow the repository's existing branch and commit-message conventions. If the
permissions cannot reach `delivered_at`, stop `blocked` and request only the
missing delivery decision. A direct invocation such as “commit this task”
supplies that requested action but does not override `never`, repository
protections, or host authorization.

## Commit integrity

Inspect both the working tree and index. Compare every candidate path with the
task objective and criteria. Surface unrelated modifications and exclude them;
never use broad staging when it could absorb them. If the existing index cannot
be preserved while isolating the task safely, stop and ask for separation rather
than resetting or stashing someone else's work.

Review the exact staged diff before committing. Reject secrets, credentials,
obvious private material, unintended generated output, conflict markers, and
files outside the task boundary. Generate one concise message from the actual
change. Do not amend, squash, rebase, reset, rewrite history, delete branches or
remotes, or perform opportunistic cleanup unless separately and explicitly
requested.

## Push and pull request

Push only the intended branch to its understood upstream. Never force push by
default; a force push needs explicit authorization for that exact operation and
must still comply with repository policy. Surface rejected pushes and conflicts
without destructive resolution.

A PR title names the delivered behavior. Its body briefly states implemented
behavior, criterion references, meaningful automated results, relevant manual
validation, and known limitations or deferrals. Link canonical artifacts rather
than copying the full specification. Exclude unrelated future planning.

Never merge solely because the PR exists or checks pass. Merge only when an
already-defined project policy and explicit authorization cover the operation
and all required conditions are satisfied. Otherwise record `pr-open`.

## Evidence and stopping

Record commit ID, remote branch, PR reference, verification summary, manual
validation state, limitations, and observed completion point. For a tracked
ticket, write only its `delivery` field, re-reading the file before writing.

Stop at the configured completion point or the last permitted state. Do not
close a ticket based only on Git state, select another task, expand scope, create
future tickets, or rewrite existing SDD artifacts.

## Optional tracking

A persisted ticket is not required if the current change and evidence are clear.
Keep untracked delivery facts in chat. For tracked work record observed delivery
state/commit/PR reference separately with actual authorization. Do not delay
ticket done until Git delivery; delivery never changes ticket status or creates tracking.
