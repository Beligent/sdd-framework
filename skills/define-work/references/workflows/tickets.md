# Tickets workflow

Invoke directly with an operation and relevant context: create, read, list/filter,
update/refine/prioritize, link or transition. Existing context is enough to draft
a preliminary ticket; completed specifications, an epic and detailed architecture
are not prerequisites for drafting.

Load the [provider contract](../ticket-management/contract.md) and configured
provider. All storage mechanics belong to that provider, including ID lookup,
conflict detection and serialization.

1. For a query, read/list/filter through the provider and report actual matches,
   missing IDs or unsupported filters. Do not create artifacts as a side effect.
2. For creation, check existing records for duplicate scope, then form one useful
   deliverable with criteria, explicit exclusions and unresolved questions. Use
   `kind: ticket`, a `TICKET-001` style ID, `todo` and `preliminary` initially.
3. For refinement, read the current record and its content revision. Compare
   requirements/specifications and any technical plan; update scope, criterion
   references, dependencies, priority and test approach where justified. Record
   assumptions or changes in scope/details. Do not silently edit canonical
   behavior to fit a proposed solution.
4. For dependency linking, verify referenced records and reject self-links/cycles.
   For status transitions, satisfy contract preconditions. Use `ready` only when
   profile-specific planning needs and behavioral references are satisfied;
   readiness never substitutes for implementation approval.
5. Apply changes against the expected content revision and read back the result.
   Stop and report conflicts, unsupported operations or broken references.
   Apply [change control](../change-control.md) to material scope/plan changes.

Output: query results or updated normalized records with IDs, locators and content
revisions. Report unresolved readiness/approval blockers separately from status.
Validate acceptance criteria can be checked, missing references are explicit for
preliminary records, and ready records meet the selected profile. Do not mark
`done` without verified evidence and the required human completion decision.
