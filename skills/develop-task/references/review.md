# Code, security and completion review

Review against the approved behavior and the actual changed code. Scale depth to
the change; a small documentation edit does not need an application security
audit. The review outcome describes evidence and limitations, not a blanket
guarantee that software is secure.

## Establish evidence quality

Identify the revision or working diff being reviewed, relevant configuration and
test environment. Distinguish an observed result from a reported one. Reuse a
recorded result only when its code, configuration and environment still support
the claim; rerun affected checks when the implementation has changed.

Use stable criterion IDs from the canonical contract. Test names or screenshots
should demonstrate the criterion, not merely show that a suite exists. For a
manual check, record the initial state, action and observed outcome. If services,
credentials or tools are unavailable, specify the unverified behavior and the
smallest follow-up needed to establish it. Do not invent successful results or
hide baseline failures.

## Review the changed behavior

Apply the packaged diagnosis and simplicity contract for its canonical
simplicity question, feature-drift rules, and process-cost check.

- Correctness: boundary/error cases, partial failure, state transitions, resource
  cleanup, concurrency and backward compatibility where applicable.
- Tests: assertions observe the intended behavior, negative cases match the risk,
  fixtures are isolated, and mocks do not bypass the boundary under test.
- Maintainability: responsibilities fit existing architecture; new abstractions
  solve a concrete need; refactoring preserves behavior and stays in scope.
- Documentation: public usage, configuration, API contracts and operational steps
  match the implementation; consequential decisions and unresolved tradeoffs are
  recorded in the appropriate existing artifact.
- Requirements: functional behavior and applicable accessibility, performance,
  reliability or other non-functional criteria have relevant evidence. A static
  check cannot establish a runtime property it never measures.

## Review changed trust boundaries

For input from users, files, network services or generated content, check validation
and safe use in queries, paths, commands, templates and logs. Verify authorization
where protected actions execute, including resource ownership or tenant isolation;
UI hiding and request validation do not establish access control.

Review exposed response fields, client bundles, error details and logs for secrets
or sensitive information. When affected, examine browser-origin/cookie controls,
file handling, outbound requests, resource limits, dependency changes and unsafe
deserialization. Apply the project's established security controls instead of
choosing a new auth system or security product by default. Perform active scanning
or attack simulation only within the requested scope and permitted environment.

## Findings and technical outcome

Each actionable finding needs an affected location/criterion, observable impact,
evidence, severity and next action. Distinguish a demonstrated defect from a
question or improvement suggestion. Use project severity definitions; if none
exist, explain practical impact rather than assigning an unexplained label.

Keep blockers and unresolved failures visible. A partial result remains incomplete
for criteria it does not establish. Proposed requirement changes, accepted risks
or scope deferrals require the corresponding real human decision; a reviewer
cannot remove a failing criterion merely to make verification pass.

## Human completion

Summarize implemented behavior, per-criterion outcome, unresolved findings and
what the human would be accepting. Link any applicable existing decision and
its exact scope/revision. Otherwise mark acceptance pending and leave the ticket
in its appropriate non-done state. A human may accept an explicitly documented
limitation under project policy; preserve both the technical finding and the
decision rather than rewriting the result as a passing test.
