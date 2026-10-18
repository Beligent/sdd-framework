# Terminology

| Term | Meaning in Beligent SDD |
| --- | --- |
| Methodology | The principles connecting approved behavior, engineering work and evidence |
| Lifecycle | The adjustable path from discovery to human acceptance, including iteration |
| Workflow | An invocable procedure with inputs, outputs, validation and decision points |
| Agent/assistant | The tool or model performing requested work; no fixed persona is required |
| Skill | A distributable directory containing `SKILL.md` and needed resources |
| Instructions | Persistent repository guidance such as `AGENTS.md`; keep it concise |
| Artifact | A versioned record such as a requirement, specification, ticket, plan or report |
| Adapter | The small assistant-specific instruction/discovery bridge, or a ticket-provider mapping; these are different integration concerns |
| Provider | The storage implementation for normalized epic/ticket operations |
| Acceptance criterion | A stable, observable condition used to assess expected behavior |
| Approval | A human decision covering specified artifact revisions and scope |
| Readiness | Whether a ticket has sufficient planning detail; it is separate from approval |
| Framework update | Replacement of installed skill resources and installer provenance |
| Configuration migration | An approved transformation between project configuration schemas |
| Integration refresh | An approved change to framework-managed project instruction sections |

A PRD is the product-oriented requirements document. A behavioral specification
states expected behavior and contracts. An implementation plan explains how to
deliver that behavior. An ADR records a consequential technical decision and its
tradeoffs; small changes need not create one.
