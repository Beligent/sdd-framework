# Implementation, documentation and refactoring

Use this reference for engineering execution. Product behavior remains in the
approved ticket and its linked specification; link to it instead of rewriting it.

## Establish the change boundary

- Inspect applicable instructions, package/build configuration, nearby code and
  existing tests before choosing an implementation. Identify public APIs,
  persistence, authentication and external integrations the change touches.
- Check current working changes and preserve them. Establish the relevant
  baseline with an existing command when practical; do not run every expensive
  suite merely to begin a small change.
- Record a short execution plan if the ticket does not already provide one.
  Lightweight work can keep it in the ticket. For standard work, follow the
  approved plan and ADRs, raising feasibility issues before changing the contract.
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

Keep refactoring proportional to the ticket. For a behavior-preserving refactor,
identify the observable behavior to preserve and use existing tests or a useful
characterization test. Separate essential restructuring from optional cleanup
so reviewers can assess the functional change. Record unrelated debt as follow-up
work rather than expanding the approved scope.

## Documentation

Update documentation when usage, configuration, API behavior, operations or
recovery steps change. Examples must match the implemented contract. Explain a
non-obvious constraint or tradeoff near the affected code, while durable
architecture decisions belong in an ADR when warranted. Do not duplicate the
requirements document in code comments or invent completion evidence in a guide.

## Review before handoff

Inspect the diff for unintended files, generated outputs, exposed credentials,
debugging code, incompatible contracts and missing error paths. Check the changed
trust boundaries: server-side authorization, injection, output exposure and
cross-user isolation when applicable. Run the project's relevant static checks
and tests, then record commands, environment assumptions and actual outcomes.

A green build alone cannot establish a criterion that the build does not exercise.
Link test cases, an observed manual check or a reasoned code review to each
criterion. Mark untested behavior explicitly. Keep the ticket ready for review
until the configured acceptance decision is recorded.
