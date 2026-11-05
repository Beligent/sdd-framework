---
name: sdd-implement
description: Implement ordinary code requests or a selected tracked task using project engineering standards, useful tests, implementation-time verification and root-cause safeguards; stop ready for delivery.
---

# Implement and verify one change

Engineering standards apply to every code request. Ticket tracking is optional.
Read applicable instructions, relevant code/tests/conventions, configuration when
present, [engineering guidance](references/implementation.md),
[testing](references/testing.md), [review](references/review.md),
[governance](references/shared/governance.md), the
[lifecycle](references/shared/current-task-lifecycle.md), and
[diagnosis safeguards](references/shared/diagnosis-and-simplicity.md).
Load only relevant technology modules from `references/technology/`.
Prefer shared `.sdd/beligent/guidance/` when installed; packaged references are
the portable fallback. Missing configuration does not block ordinary authorized
code work. Earlier configurations are rejected, not converted.

1. Establish one current change, the user's authorization, observable behavior,
   criteria, boundaries and existing working changes. Reuse a named task when
   supplied; ask only if multiple tasks are ambiguous. Without tracking, keep
   sufficient definition and verification in chat; do not allocate IDs or write
   `.sdd/beligent/` records just to implement.
2. Skip already satisfied definition/planning. Clarify blocking gaps together.
   Use concise notes for obvious work. Plan only when complexity, sequencing,
   risk or explicit intent warrants it. Do not plan later backlog work.
3. Discover actual project commands and establish a relevant baseline. Select a
   useful regression test or observable check. Add necessary tests for changed
   behavior; TDD is useful when a meaningful failure can be demonstrated. Do not
   fabricate pre-change failures or add tests that merely repeat static text.
4. Implement the smallest coherent change. Preserve unrelated edits and resolved
   decisions. Review trust boundaries, errors, compatibility, documentation,
   maintainability and unnecessary abstraction. Ask before consequential scope
   expansion; defer unrelated findings without creating tickets.
5. Run relevant checks during implementation: the project checks in config
   `checks` (always those marked `required`) and other tests proportionate to
   changed behavior and risk. Record commands and results. Fix introduced failures and
   rerun affected checks for the final diff. Missing tooling/services, skipped
   checks and pre-existing failures remain visible and never become passes.
6. After two ineffective symptom-level fixes for the same behavior, stop patching
   and apply the diagnosis contract before another corrective attempt. Diagnosis
   does not authorize broader behavior or design changes.
7. Review the final diff and map each criterion to pass, fail, blocked, not-run or a
   justified not-applicable result. Request only relevant manual validation not
   already established. Report changed behavior, tests, limits and remaining risk.
8. For explicitly tracked work, follow the [record contract](references/records.md).
   Run `sdd snapshot` on the final implementation, record `implementation` and
   one check per actual result at the current revision and snapshot, then run
   `sdd validate --snapshot <TICKET-ID>`. Mark done only when agreed work and
   every required check pass; a failed check keeps it `in-progress`, an external
   blocker makes it `blocked`. A done ticket is final; never reopen it.

Stop done/verified, pending required manual validation, blocked, or
`diagnosis-required`. A separate audit is optional unless project policy requires
it; it never substitutes for implementation-time checks. Do not commit, push,
open/merge a PR or make unrelated record updates. Use `sdd-deliver` for delivery.
