---
name: sdd-implement
description: Use only when the prompt starts with /sdd-implement or $sdd-implement. Implements one ticket against its requirements, runs and records its checks, and sets it done or blocked. Never commits.
disable-model-invocation: true
---

# Implement a ticket

Read project instructions, `.sdd/beligent/config.json`, the
[shared contract](references/shared/governance.md), the
[ticket contract](references/records.md), [engineering](references/engineering.md),
[testing](references/testing.md) and [review](references/review.md) guidance, and
only the relevant [technology](references/technology/nodejs.md) modules in
`references/technology/`. This command authorizes the ticket's code, tests,
checks and its own ticket updates. It never commits, pushes or opens a PR.

1. Select the ticket named in the prompt. Without one, list open tickets and ask.
   With no ticket at all, offer `/sdd-define` first.
   - `done` or `cancelled`: report that it is final and stop. Suggest a new
     ticket (`/sdd-define …`) or doing the change without the framework.
   - `blocked`: continue only once its `blocked_reason` is resolved; then clear
     it and set `in-progress`.
   - An open `depends_on` ticket (one that exists and is not `done`): set or
     keep `blocked` naming it, and stop before coding.
   - Unclear or contradictory requirements: ask before coding, or set `blocked`.
2. Set `todo` to `in-progress`, re-reading the ticket immediately before writing.
3. Follow the requirements and stay inside the ticket's scope and Out of scope.
   Preserve unrelated changes. Ask before a consequential expansion.
4. Add or update tests for each criterion where practical; prefer a test that
   fails before the change and passes after it.
5. Test economically. While iterating, run only focused tests: the criterion's
   test file or the affected package. Fix failures you introduced and rerun.
   After two ineffective fixes for the same symptom, apply the
   [diagnosis safeguards](references/shared/diagnosis-and-simplicity.md).
   When the work is complete, run each check in `checks_required` and each config
   check with `paths: ["**"]` once on the final diff. If the work touched files
   matching another check's `paths`, add that check to `checks_required` first.
   Run no other config checks; they are the developer's concern.
6. Record one check per actual result in the ticket, with its criteria, command
   or procedure and observed result, and outcome. Record results from runs
   against the final diff; after any later change, rerun and replace earlier
   results, including those from a previous session. Never record a result that
   did not happen.
7. Set the status and run `sdd validate`:
   - `done` when the work is implemented, every criterion has a passing check,
     every listed and every `**` config check passed and nothing recorded is failing;
   - `blocked` with `blocked_reason` when a check cannot run, a dependency is
     open or a decision belongs to the developer;
   - otherwise keep `in-progress` and report what remains.
8. Report the changed behavior, the checks with their results, limits and
   remaining risk. Done covers the AI's part only; the developer reviews the
   diff and owns the feature. Suggest `/sdd-deliver TICKET-042` when they want
   it committed.
