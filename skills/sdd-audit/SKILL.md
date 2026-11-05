---
name: sdd-audit
description: Audit a scoped implementation or project integration, or diagnose a failure using evidence and root-cause analysis, without silently implementing fixes or requiring ticket tracking.
---

# Audit or diagnose

Select implementation review, integration audit, or diagnosis from the request.
Read relevant project instructions/configuration,
[governance](references/shared/governance.md), [review](references/review.md),
[testing](references/testing.md), and
[diagnosis](references/shared/diagnosis-and-simplicity.md) when investigating a
failure. Tracking and prior skill invocation are not prerequisites.

For implementation review, identify the exact diff/revision, required behavior,
criteria, authorization and existing evidence. Review correctness, scope drift,
security, simplicity, compatibility, documentation and maintainability. Reuse
trustworthy checks covering that revision and run meaningful missing checks.
Record pass/fail/blocked/not-run per criterion and distinguish automated evidence,
manual observations, pre-existing failures and unavailable environments.

For diagnosis, separate observations from hypotheses, reproduce the failure when
possible, and test the cheapest distinguishing hypotheses. Report supporting and
contradictory evidence, uncertainty, most likely root cause and smallest useful
correction. A ticket or planning artifact is not required. Do not silently fix
behavior unless the developer has authorized that correction.

For integration audit, inspect configuration, discovery, managed instructions,
existing conventions and preservation risks. Return findings and a proposal in
chat; use `sdd-init` for reviewed integration changes. Installation layout and
live host execution are separate claims.

Report severity, affected criterion/location, evidence and next action in chat.
Audit is read-only by default, including tracked and closed work. Naming a ticket
for review/status does not authorize implementation or record mutation. Invoke
`verify` for criterion verification, `diagnose` for causes, `review` for a diff,
or `status` to summarize existing facts; selectors are prompt intents.

Read tracked records through the [record contract](references/records.md). Done
and cancelled tickets are final: if a done ticket misses a criterion, report the
finding and leave the record unchanged. The fix is an ordinary request, or a new
ticket only when the developer explicitly asks for tracking. Do not silently fix
code, change config or records, create tracking, perform Git delivery, or invent
check results. Audit can run before or after done and is not a universal gate.
