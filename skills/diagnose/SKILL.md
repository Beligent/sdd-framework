---
name: diagnose
description: Investigate the root cause of a failure, regression, contradictory implementation evidence, or repeated ineffective fixes in a Beligent SDD project. Use independently or from develop-task; diagnosis recommends corrective work but does not silently implement it.
---

# Diagnose a failure

Determine the best-supported root cause and smallest corrective direction without
turning investigation into implementation or project-wide planning.

## Inputs and scope

Read applicable project instructions and configuration when present, then
[governance](references/shared/governance.md) and the canonical
[diagnosis contract](references/shared/diagnosis-and-simplicity.md). A ticket,
requirement, or specification can supply useful context but is not required.
Accept direct requests such as a failing test, deployment failure, rendering
problem, or regression investigation without forcing new SDD artifacts.

Use the developer's named failure and scope. If the request also explicitly
authorizes implementation, keep diagnosis evidence and corrective changes
distinct. Otherwise do not change product behavior or perform unrelated cleanup.

## Procedure

1. Restate the observed failure, affected environment, available reproduction,
   and expected behavior. Identify missing evidence without inventing it.
2. Inspect only relevant code, tests, logs, configuration, and runtime state.
   Separate observations from hypotheses and test the cheapest distinguishing
   hypotheses where available and authorized.
3. Apply the contract's outcome taxonomy, design-depth boundary, and
   ask-before-expansion rule. Do not broaden architecture to make the diagnosis
   feel complete.
4. Identify the most likely root cause with supporting and contradictory
   evidence. State uncertainty and untested alternatives.
5. Recommend the smallest corrective action. State whether the current task,
   acceptance criteria, specification, or consequential decision must change.
   If the finding is unrelated, record a future candidate without creating a
   ticket unless requested.

## Output

Report observations, hypotheses tested, root-cause conclusion or remaining
unknowns, the specific outcome state, recommended correction, affected task or
specification, and any gated expansion decision. If evidence is insufficient,
leave `diagnosis-required` with the next discriminating check.

Diagnosis does not commit, push, create or merge a pull request, select another
task, or claim verification or human acceptance. Recommend an appropriate next
task when actual follow-up work is discovered.
