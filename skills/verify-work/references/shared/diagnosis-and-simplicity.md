# Diagnosis, simplicity, and proportionality contract

Canonical source:
`skills/diagnose/references/shared/diagnosis-and-simplicity.md`. Packaged copies
let lifecycle skills apply one contract without duplicating it.

## Diagnosis boundary

Use diagnosis when explicitly requested, the cause is unclear, evidence
contradicts the plan or specification, a regression crosses layers, further
patching would add complexity, or the repeated-fix threshold is reached.
Diagnosis investigates root cause; it does not authorize corrective
implementation, unrelated refactoring, broader design, or new project-planning
artifacts. A developer may explicitly authorize diagnosis and implementation
together.

Restate the observed failure and environment first. Keep observations—reproduced
behavior, logs, test output, state, and inspected code—separate from hypotheses.
Rank plausible causes, identify evidence that would distinguish them, and test
the cheapest relevant hypotheses with existing tools where possible. State what
was not inspected. Recommend the smallest corrective action supported by the
evidence and whether the current task or specification needs revision.

### Repeated-fix threshold

Count ineffective corrective attempts against the same observed behavior, not
ordinary implementation iterations or successful fixes followed by a different
failure.

| Ineffective symptom-level fixes | Required action |
| --- | --- |
| 0 or 1 | An ordinary bounded correction and reverification remain allowed |
| 2 or more | Stop corrective implementation; set `diagnosis-required` before another attempt |

Do not build a semantic bug classifier. Record the attempts and unchanged
failure that triggered the threshold.

## Distinct outcomes

| State | Meaning |
| --- | --- |
| `implementation-failure` | The implementation step could not complete |
| `test-failure` | An automated check failed; its relation to criteria may still need diagnosis |
| `acceptance-criterion-failure` | Observed behavior contradicts a stable criterion |
| `manual-validation-failure` | A requested human observation did not match the expected result |
| `diagnosis-required` | Evidence is insufficient or repeated symptom fixes reached the threshold |
| `specification-contradiction` | Implementable behavior conflicts with the current specification or decisions |
| `scope-expansion-required` | A consequential cause lies outside configured design depth or approved scope |
| `unrelated-discovery` | The issue is real but does not block the current task |

Report the most specific supported state and its evidence rather than a generic
failure. An unrelated discovery remains a concise future candidate; do not
create a ticket unless requested.

## Design-depth boundary

Diagnosis does not expand architecture by default. When a consequential cause
lies outside `workflow.design_depth`, identify the boundary and why it matters.
If `workflow.ask_before_expansion` is true, stop that investigation branch and
ask before creating broader specification or design. Continue independent
in-depth work within the selected scope.

## Simplicity and drift review

Ask: **Is there a materially simpler implementation that still satisfies the
acceptance criteria?** Review the actual diff for:

- speculative abstractions or infrastructure, excessive layers or indirection,
  and generalization without a current criterion or concrete project need;
- duplicate logic, workaround accumulation, dead or unused code, and unnecessary
  dependencies introduced during iteration;
- divergence from established project patterns without a recorded reason;
- changes that make the expected next modification harder;
- behavior outside the task objective or acceptance criteria.

Directly necessary support code is not feature drift merely because criteria do
not name each internal change. Explain its causal connection to required
behavior. Classify unrelated enhancements as `unrelated-discovery`. Significant
unapproved drift pauses or fails the current task until removed or explicitly
accepted; documentation alone does not cure it.

## Process-cost warning

Apply one qualitative proportionality check when a small task accumulates many
artifacts, specification cycles, formal decisions, approval rounds, competing
plans, extensive future design, or more lifecycle management than implementation.
When clearly disproportionate, report:

> Process overhead appears disproportionate to the current task. Consider collapsing remaining specification/planning into the compact task or proceeding to implementation.

This is a recommendation. Do not delete, compact, rewrite, or bypass required
artifacts and decisions automatically. Do not add token accounting, telemetry,
or process benchmarking.
