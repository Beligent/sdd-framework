# Testing and evidence

Choose checks from the changed behavior and failure modes, using the project's
existing tools. This framework does not select a test runner or demand a new
suite for every edit.

## Select useful checks

| Change or risk | Useful evidence |
| --- | --- |
| Domain rule or bug fix | A focused example that would fail for the wrong behavior; include relevant boundary/error cases |
| API, storage or integration boundary | Contract/integration checks using controlled resources and representative invalid input |
| User interaction | Behavior through the existing component/browser tools or a recorded manual walkthrough |
| Authorization or sensitive data | Negative cases, ownership/isolation checks and review of the enforcement point |
| Refactor | Existing behavioral tests or a focused characterization check showing preserved outcomes |
| Configuration, docs or small static edit | The relevant parser/build/link check or direct inspection; avoid tests that only repeat the changed text |

Unit, integration and end-to-end checks answer different questions. Use enough
levels to cover the affected boundaries without reproducing the same assertion
through every layer. Do not replace boundary coverage with extensive mocks of
the implementation being tested.

## Test-driven development when useful

For a defect or new deterministic behavior, first express the expected outcome in
a small test and run it. Confirm it fails because of the intended behavior, not
missing fixtures, imports or an unrelated outage. Implement the minimal working
change, rerun the test, then refactor while preserving the result. Record the
meaningful before/after result; a red test caused by a broken test harness is not
regression evidence.

If the code already changed, do not fabricate a failing pre-change run. A useful
regression test can still be added and described honestly. For reversible,
low-impact changes, direct validation may be more useful than creating a test
that mirrors the implementation.

## Keep runs trustworthy

- Discover commands from existing scripts, CI and instructions; do not claim
  that an assumed `npm test` or Python command ran.
- Isolate mutable test data and clean up resources. Control clocks, randomness
  and network dependencies where determinism matters. Avoid production data and
  external side effects unless explicitly authorized.
- Distinguish the required runtime and dependencies from unavailable tooling.
  A missing service, skipped test or timeout is not a pass. Record the exact
  limitation and a way to finish the check.
- For a failure, identify whether it is introduced, pre-existing or unresolved.
  Do not disable checks, weaken assertions or hide failures to create a green run.
- After fixing relevant failures, run the checks appropriate to the final diff.
  Broaden only when changed scope or unresolved concerns justify it.

## Record acceptance evidence

For each stable criterion reference such as `SPEC-001/AC-001`, record the test or
review identifier, command or procedure, inspected revision, observed result and
link to available evidence. A concise terminal outcome may be enough for a
small local test; use a report artifact for longer results. Sanitize logs before
storing them. Use `pass`, `fail` or `unverified`; a test being written is not a
test passing. Note a criterion as not applicable only with its reason and the
applicable decision.

Keep technical verification distinct from human acceptance. The person deciding
completion needs to see failures, skipped coverage and residual limitations.
