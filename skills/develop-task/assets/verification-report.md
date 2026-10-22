---
id: VERIFY-001
revision: 1
status: draft
---

# Verification report: [work title]

Replace the illustrative ID, bracketed fields and sample row before use. Store
this report in the configured verification location; a lightweight ticket may
contain these sections directly. Frontmatter status is the document lifecycle,
not proof of technical success or human acceptance.

## Scope and reviewed inputs

- Ticket: [stable ID and relative Markdown link]
- Requirements/specification: [stable IDs, revisions and relative links]
- Plan/ADRs where applicable: [IDs, revisions and relative links, or reason omitted]
- Applicable authorization: [approval record/source and covered revisions]
- Reviewed implementation: [commit, immutable diff reference or clearly described
  working-tree snapshot; identify uncommitted changes]
- Environment: [runtime, relevant dependencies/configuration and test data]
- Evidence collected by/date: [actual reviewer and date; distinguish reports by others]

## Acceptance criterion evidence

Use one row per criterion, adding rows for distinct checks where needed. Keep
criterion text in its canonical artifact and link it here. A test that was not
run has no passing outcome. Record not-applicable only with a justified decision.

| Criterion reference/link | Test or review ID | Command or reproducible procedure | Observed result/evidence link | Outcome |
| --- | --- | --- | --- | --- |
| SPEC-001/AC-001 — [relative link to criterion] | [test name or review finding] | [actual command/procedure, or not run and why] | [observed output, sanitized artifact or review rationale] | unverified |

## Executed checks

| Check | Reviewed revision/environment | Actual outcome | Evidence or limitation |
| --- | --- | --- | --- |
| [test/build/typecheck/manual procedure] | [revision and relevant environment] | [pass/fail/not run] | [result and evidence; do not imply an unrun check passed] |

## Review findings and unresolved failures

| Finding | Affected location/criterion | Impact/severity | Evidence | Next action/owner | State |
| --- | --- | --- | --- | --- | --- |
| [finding ID] | [link/reference] | [observed impact] | [reproduction/review evidence] | [fix, investigate or human decision] | [open/resolved] |

State pre-existing failures, new regressions, unavailable checks, unverified
criteria and remaining limitations explicitly. Write `None observed within the
reviewed scope` only when supported by the actual review; do not delete an open
finding because a different check passed.

## Technical verification outcome

- Outcome: [pass / incomplete / fail]
- Criterion totals: [passed, failed, unverified, and justified not-applicable]
- Rationale: [what the evidence establishes and its limits]
- Required follow-up: [work needed before an acceptance decision, or none]

## Human acceptance — separate decision

- State: pending
- Decision/approver/date: [fill only from an actual applicable human decision]
- Covered artifacts/revisions and implementation: [exact accepted scope]
- Authorization source/approval record: [relative link or explicit decision reference]
- Accepted limitations/conditions: [record the real decision; preserve findings above]
- Ticket completion: [remain non-done until the configured completion gate is satisfied]

Passing checks or a review recommendation do not fill this section on behalf of
the human. Existing explicit acceptance for the same concrete scope counts; do
not request it again.
