---
name: verify-work
description: Review a Beligent SDD implementation against approved acceptance criteria, record test and review evidence, and prepare a human completion decision. Use for acceptance verification or scoped code and security review.
---

# Verify work against its approved contract

Establish what the implementation demonstrates, what remains uncertain, and
whether the work is ready for a human acceptance decision.

## Preconditions and inputs

Read applicable instructions and `.beligent/config.json`. This skill supports
`schema_version: 1`; use its artifact paths, profile, conventions and provider.
Missing configuration permits an explicitly unconfigured review/proposal without
persisted artifacts; otherwise use setup first. Unsupported schemas require a
migration proposal before affected writes. Do not initialize or reconfigure the
project implicitly.

Inputs are the ticket and its linked behavioral contract, the implementation
revision or working diff, applicable approvals, existing test/check evidence,
and a plan/ADRs where relevant. A lightweight ticket may contain its contract,
plan and verification; it does not require separate empty artifacts.

Read [governance](references/shared/governance.md), the
[ticket contract](references/ticket-management/contract.md), and the configured
provider guidance, initially [Markdown tickets](references/ticket-management/markdown.md).
Check that approvals still cover the implemented behavior, criteria, constraints
and plan. A scoped review can investigate gaps before implementation is approved;
it must not present unapproved work as accepted.

## Procedure

1. Identify the exact scope and revision under review. Resolve the ticket's stable
   criteria and approved sources. Compare the diff with that contract and note
   unapproved scope, stale approvals, missing links and unresolved dependencies.
2. Read [review guidance](references/review.md) for the relevant code, security,
   documentation and maintainability checks. Inspect behavior and the actual
   evidence rather than trusting a previous agent's summary. Focus security
   review on changed trust boundaries and stated requirements.
3. Build a criterion-to-evidence matrix. Use existing trustworthy results where
   they cover the reviewed revision. Run or reproduce the meaningful missing
   checks when available and authorized. Record commands/procedures, results and
   environment limitations. Treat absent, stale or failed evidence honestly.
4. Produce a [verification report](assets/verification-report.md) in the configured
   location, or equivalent sections in a lightweight ticket. Preserve failures,
   unverified criteria, review findings and follow-up work. Separate technical
   verification outcome from the human completion decision.
5. Report findings with severity, affected criterion or code location, observed
   impact and a concrete next action. An ordinary review does not authorize
   unrequested code/configuration changes. If fixes are authorized, keep them
   scoped and rerun affected verification for the final revision.
6. Update ticket evidence and review state through its provider with the required
   revision/conflict checks. Prepare the concrete completion decision under the
   configured approval policy. Record an existing applicable human decision;
   otherwise leave acceptance pending. Never infer acceptance from silence,
   a green suite, a review recommendation or an agent-authored approval record.

## Outputs and validation

Produce an evidence-backed report and provider-safe ticket update. Every
applicable criterion must map to `pass`, `fail` or `unverified`, or have a justified
not-applicable decision. The report names the reviewed revision, outstanding
failures and limitations, and the human acceptance state/source separately.
Allocate an unused stable verification ID for a new report. Increment an existing
report's document revision when its content changes; preserve ID and revision on
a no-op, and preserve human acceptance history when a new result supersedes it.
If any required criterion fails or lacks evidence, technical verification is
incomplete; describe what would resolve it. A report being complete does not mean
the implementation is accepted or that the ticket can be marked done.
