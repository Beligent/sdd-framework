# Diagnosis and simplicity contract

Canonical source:
`skills/sdd-audit/references/shared/diagnosis-and-simplicity.md`. Packaged copies
let the skills apply one contract without duplicating it.

## Diagnosis boundary

Use diagnosis when explicitly requested, the cause is unclear, evidence
contradicts the ticket's requirements, a regression crosses layers, further
patching would add complexity, or the repeated-fix threshold is reached.
Diagnosis investigates root cause; it does not authorize corrective
implementation, unrelated refactoring or broader design. A developer may
explicitly authorize diagnosis and implementation together.

Restate the observed failure and environment first. Keep observations—reproduced
behavior, logs, test output, state, and inspected code—separate from hypotheses.
Rank plausible causes, identify evidence that would distinguish them, and test
the cheapest relevant hypotheses with existing tools where possible. State what
was not inspected. Recommend the smallest corrective action supported by the
evidence and whether the current ticket's requirements need refinement.

### Repeated-fix threshold

Count ineffective corrective attempts against the same observed behavior, not
ordinary implementation iterations or successful fixes followed by a different
failure.

| Ineffective symptom-level fixes | Required action |
| --- | --- |
| 0 or 1 | An ordinary bounded correction and reverification remain allowed |
| 2 or more | Stop corrective attempts and diagnose. Keep the ticket `in-progress` while diagnosis can proceed; set `blocked` with a `blocked_reason` naming the unchanged failure when the developer must decide |

Report the attempts and the unchanged failure that triggered the threshold.

## Reporting a failure

Name the failure precisely in the report; these are wording, not ticket statuses:

- the implementation could not be completed;
- an automated check failed, and whether its cause is known;
- observed behavior contradicts a criterion;
- a manual observation did not match the expected result;
- the requirements contradict each other or the code's constraints;
- the cause lies outside the ticket's scope;
- an unrelated issue was found that does not block the ticket.

An unrelated discovery stays a short note in the report; do not create a ticket
unless asked. A contradiction or an out-of-scope cause is a developer decision:
ask, or set `blocked`.

## Scope boundary

Diagnosis does not expand architecture by default. When a consequential cause
lies outside the ticket's scope, identify the boundary and why it matters, stop
that investigation branch and ask. Continue independent work within the scope.

## Simplicity and drift review

Ask: **Is there a materially simpler implementation that still satisfies the
acceptance criteria?** Review the actual diff for:

- speculative abstractions or infrastructure, excessive layers or indirection,
  and generalization without a current criterion or concrete project need;
- duplicate logic, workaround accumulation, dead or unused code, and unnecessary
  dependencies introduced during iteration;
- divergence from established project patterns without a stated reason;
- changes that make the expected next modification harder;
- behavior outside the ticket's requirements or criteria.

Directly necessary support code is not drift merely because criteria do not name
each internal change; explain its connection to the required behavior. Report
unrelated enhancements as unrelated discoveries. Significant unapproved drift
keeps the ticket open until it is removed or the developer accepts it.
