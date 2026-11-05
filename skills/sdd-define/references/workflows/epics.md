# Epics workflow

Invoke directly with an outcome/delivery grouping and available context. Existing
requirements/specifications improve precision, but detailed architecture is not
required to draft preliminary epics or candidate tickets.

Load the [provider contract](../ticket-management/contract.md) and configured
provider. Use semantic operations and normalized records throughout.

1. Read/list existing records relevant to the outcome before creating a grouping.
   Prefer refining an existing epic to duplicating the same scope.
2. Define one coherent outcome, exclusions, requirement/specification references
   where available, and criteria sufficient to assess the epic outcome. Use
   `kind: epic` and an `EPIC-001` style stable ID.
3. Create or update through the provider. Mark unresolved technical questions and
   missing references in scope/details; use `readiness: preliminary` while they
   block planning readiness. Keep status and approval references separate.
4. Identify candidate ticket slices with independently verifiable results. Create
   tickets only when the user requested backlog creation or that work is within
   the current authorized scope. Refer to child ticket IDs in epic scope/details;
   use `dependencies` only for actual prerequisites, not parent/child membership.
5. After technical planning, refine delivery boundaries, dependencies and criteria
   through provider updates. Apply [change control](../change-control.md) to any
   approved scope affected by these changes.

Output: normalized epic records and candidate or created ticket references.
Validate coherent scope, clear membership, no dependency cycles, resolvable
available references and explicit gaps. An epic does not require an architecture
document merely to exist; `ready` and human approval are separate decisions.
