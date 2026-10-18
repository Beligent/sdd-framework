# Specification workflow

Invoke directly with relevant requirements, existing behavior to refine, or an
approved lightweight behavioral contract. Read those inputs and existing
interfaces. Missing behavioral inputs should produce explicit questions or a
marked draft, rather than silently starting requirements or architecture work.
Use the configured specifications directory and
[specification template](../../assets/specification.md).

1. Link the source requirements by stable IDs and local links. Describe actor
   actions, observable results, relevant state transitions and boundaries.
2. Specify inputs/outputs, validation and failure behavior at affected interfaces.
   Include consequential accessibility, security, performance or compatibility
   constraints from the requirements. Distinguish existing interfaces from new
   proposals; avoid selecting infrastructure without a behavioral reason.
3. Give the document a unique `SPEC-001` style ID and acceptance criteria stable
   document-local IDs such as `AC-001`. Full references are `SPEC-001/AC-001`.
   Preserve existing criterion IDs when refining wording; retire removed criteria
   explicitly rather than reassigning IDs to different behavior.
4. Map criteria to motivating requirements. Make both normal and relevant error
   outcomes verifiable. Mark unknowns and contradictions, then resolve only the
   ones blocking the requested result.
5. Apply [change control](../change-control.md) to existing approvals. Report any
   expected requirement changes instead of silently changing their meaning.

Output: behavioral specification and traceability, with decision status and open
questions. Validate criteria independently of a chosen implementation, references
to source behavior, and consistency with approved constraints. This route does
not require tickets or architecture and does not authorize implementation.
