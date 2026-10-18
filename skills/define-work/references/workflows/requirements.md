# Requirements workflow

Invoke directly with project context and an outcome, problem, change request or
existing requirements. Use the configured requirements directory and the
[requirements template](../../assets/requirements.md); architecture, epics and
tickets are not prerequisites.

1. Identify users, the problem, evidence, desired outcomes and existing behavior.
   For established projects, inspect relevant code/docs before asking the user
   to repeat facts already available.
2. Capture functional requirements and measurable non-functional constraints.
   Separate business needs from a proposed technical solution. Record explicit
   exclusions and source decisions, including uncertainties that affect scope.
3. Assign a unique `REQ-001` style ID, reusing an existing document when refining
   the same requirement. Define document-local `AC-001` criteria with observable
   outcomes and relevant failure cases. Criteria may be refined into
   specification criteria later without losing their source links.
4. Check contradictory requirements, inaccessible user assumptions and relevant
   privacy/security/accessibility constraints only to the depth the work warrants.
   Record unresolved points and their consequence instead of presenting guesses
   as settled requirements.
5. Save a draft within authorized scope, or present a proposed change where a
   required decision is missing. Apply [change control](../change-control.md)
   when revising approved content.

Output: requirements/PRD with outcome, scope, functional/non-functional behavior,
criteria, source evidence and open questions. Validate that a reviewer can tell
what success means without reading a technical implementation plan. Report
whether the configured scope decision is present; drafting does not grant it.
