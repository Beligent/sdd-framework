---
name: sdd-define
description: Use only when the prompt starts with /sdd-define or $sdd-define. Defines one bounded piece of AI work as a ticket with clear requirements and testable criteria, or refines an open ticket. Never implements code.
disable-model-invocation: true
---

# Define a ticket

Read project instructions, `.sdd/beligent/config.json` when present, the
[shared contract](references/shared/governance.md) and the
[ticket contract](references/records.md). This command authorizes creating or
refining open tickets only; it never changes code.

## Create

1. Read the affected code, tests and conventions, and only the relevant stack
   guidance: [React/TypeScript](references/technology/react-typescript.md),
   [Next.js](references/technology/nextjs.md), [Node.js](references/technology/nodejs.md),
   [Python](references/technology/python.md) or [FastAPI](references/technology/fastapi.md).
2. Check existing open tickets for the same scope; refine one instead of
   duplicating it.
3. Make the requirements precise before writing. Ask blocking questions together.
   A good ticket is:
   - one bounded piece of AI work, small enough for one implementation session.
     Split a larger feature into several tickets and record the order with
     `depends_on`, so each ticket names the tickets it builds on;
   - written as observable behavior, not as a solution, unless the developer
     chose the solution;
   - testable: each `### AC-NNN` criterion names a result a test or a short
     manual procedure can confirm;
   - explicit about what is out of scope, so the agent does not wander;
   - honest about context: constraints, affected areas and links to existing docs.
4. Allocate the next ID as described in the
   [shared contract](references/shared/governance.md#tickets) and write the ticket
   from the [template](assets/ticket.md) with status `todo`.
5. Run `sdd validate` and report the ticket, open questions and the suggested
   next prompt, e.g. `/sdd-implement TICKET-042`.

## Refine, block or cancel

Re-read the ticket immediately before writing. Refine only `todo`,
`in-progress` or `blocked` tickets; done and cancelled tickets are final, so new
scope is a new ticket. Set `blocked` with `blocked_reason` when the developer
must decide something first. Cancel only on the developer's explicit decision,
with `cancelled_reason`. Validate `depends_on` links: no self-links or cycles.

## Planning

An obvious change needs no written plan. For risky or multi-step work, compare
consequential choices in chat, map each criterion to how it will be checked,
and note sequencing in the ticket's Context. Use the
[diagnosis safeguards](references/shared/diagnosis-and-simplicity.md) when the
problem is a failure whose cause is unknown.
