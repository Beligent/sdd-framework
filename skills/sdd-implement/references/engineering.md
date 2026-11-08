# Engineering standards

Canonical source: `skills/sdd-implement/references/engineering.md`. It applies
inside framework commands; without a command only the selected stack guides apply.

Apply the [shared contract](shared/governance.md) for activation, scope and trust,
[testing](testing.md) for checks and evidence, [review](review.md) before handoff
and the [diagnosis contract](shared/diagnosis-and-simplicity.md) when evidence
contradicts the approach or two symptom fixes fail. Load only the stack modules
named in config `stacks` that the changed files use, and the local or subsystem
instructions that govern those files. Behavior comes from the ticket's
requirements; plans and follow-up observations stay in chat or the ticket's
Context. Reference existing project documentation rather than rewriting it.

## Establish the change boundary

- Inspect applicable instructions, package/build configuration, nearby code and
  existing tests before choosing an implementation. Identify public APIs,
  persistence, authentication and external integrations the change touches.
- Check current working changes and preserve them. Establish the relevant
  baseline with an existing command when practical; do not run every expensive
  suite merely to begin a small change.
- Plan only when useful for complexity, sequencing or risk. Keep concise notes
  in chat for untracked work or in an existing task for tracked work. Follow
  applicable project plans and decision records and raise consequential
  contradictions before changing scope.
- Reuse the project's database, state management, test runner, deployment and
  dependency choices. A new dependency needs a concrete benefit and review of
  its maintenance, license and integration cost; it is not a default solution.

## Implement and maintain

Prefer a complete vertical behavior over disconnected abstractions. Keep domain
rules testable without framework bootstrapping when that fits existing structure;
do not reorganize the repository to impose a preferred architecture.

Validate external inputs at boundaries and preserve meaningful errors. Handle
partial failure, cleanup and cancellation where the changed behavior can encounter
them. Limit retries to operations safe to repeat, with a bounded policy. For
data changes, establish migration/backward compatibility and recovery requirements
before altering stored information. A plan for a destructive migration is not
authorization to run it against a live environment.

Keep refactoring proportional to the authorized change. For a behavior-preserving refactor,
identify the observable behavior to preserve and use existing tests or a useful
characterization test. Separate essential restructuring from optional cleanup
so reviewers can assess the functional change. Mention unrelated debt briefly in chat; create follow-up records only when
requested rather than expanding the approved scope.

## Documentation

Update documentation when usage, configuration, API behavior, operations or
recovery steps change. Examples must match the implemented contract. Explain a
non-obvious constraint or tradeoff near the affected code; durable architecture
decisions belong in the project's own decision records when warranted. Do not
copy specifications into code comments or invent completion evidence in a guide.

## Review before handoff

Inspect the diff for unintended files, generated outputs, exposed credentials,
debugging code, incompatible contracts and missing error paths. Check the changed
trust boundaries: server-side authorization, injection, output exposure and
cross-user isolation when applicable. Run the project's relevant static checks
and tests, then record commands, environment assumptions and actual outcomes.

A green build alone cannot establish a criterion that the build does not exercise.
Link test cases, an observed manual check or a reasoned code review to each
criterion. Mark untested behavior explicitly. Report verification separately from the
developer's acceptance and Git delivery. Create follow-up tickets only when the
developer asks.
