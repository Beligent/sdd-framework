# Specification workflow

Write a shared spec only for behavior that spans tickets or outlives them; a
standalone ticket keeps its own criteria. Follow the [record contract](../records.md)
and the [spec template](../../assets/spec.md).

1. Read existing behavior, interfaces and specs. Ask about missing behavioral
   inputs instead of guessing them.
2. Describe actors, actions, observable results, interfaces, state and failure
   behavior. Distinguish existing interfaces from proposals.
3. Give the spec the next unused `SPEC-NNN` and its criteria `### AC-NNN`
   headings, referenced from tickets as `SPEC-NNN/AC-NNN`.
4. Specs have no revision: refine them freely while work is being defined. Keep
   criterion IDs stable while open tickets reference them; done tickets are
   historical and unaffected by later edits.
5. Set status `active` once tickets may rely on it, and `retired` when it no
   longer describes intended behavior.

Run `sdd validate` after writing. Report open questions. A spec does not require
tickets or architecture and does not authorize implementation.
