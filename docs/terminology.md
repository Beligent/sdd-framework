# Terminology

| Term | Meaning in Beligent SDD |
| --- | --- |
| Methodology | The principles connecting agreed behavior, engineering work and evidence |
| Lifecycle | The bounded path from definition through implementation and required checks; delivery is separate |
| Workflow | An invocable procedure with inputs, outputs, validation and decision points |
| Agent/assistant | The tool or model performing requested work; no fixed persona is required |
| Skill | A distributable directory containing `SKILL.md` and needed resources |
| Instructions | Persistent repository guidance such as `AGENTS.md`; keep it concise |
| Record | A tracked ticket, epic or shared spec under `.sdd/beligent/` |
| Adapter | The small assistant-specific instruction/discovery bridge |
| Acceptance criterion | A stable, observable condition (`AC-001`) used to verify behavior |
| Check | One recorded verification result tied to criteria, a revision and a snapshot |
| Snapshot | The `git-tree:` identity of the verified implementation, from `sdd snapshot` |
| Revision | A ticket's scope version; it increases when open criteria change |
| Framework update | Replacement of installed skill resources and installer provenance |
| Integration refresh | An approved change to framework-managed project instruction sections |

A shared spec states behavior that spans or outlives tickets. Plans and design
decisions stay in chat, ticket notes or ordinary project documentation.
