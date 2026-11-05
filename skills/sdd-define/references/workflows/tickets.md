# Tickets workflow

Invoke with an operation and context: create, read, list, refine, link, block or
cancel. Follow the [record contract](../records.md) and the
[ticket template](../../assets/ticket.md). Existing context is enough to draft a
ticket; a spec, an epic or detailed architecture is not a prerequisite.

1. For a query, read the records and report actual matches or missing IDs. A
   query, status request or mention never creates or changes a record.
2. For creation, check existing tickets for duplicate scope, then write one
   deliverable with an objective, scope, exclusions and testable `### AC-001`
   criteria. Reference shared behavior through `spec_criteria` instead of
   copying it. Use the next unused `TICKET-NNN` and status `todo`.
3. For refinement of an open ticket, re-read it, then update scope, criteria,
   dependencies or notes. A criteria change increments `revision` and appends a
   `revised` history entry preserving the previous criteria and evidence. Do not
   silently edit shared behavior to fit a proposed solution.
4. For links, verify that referenced tickets, epics and specs exist and reject
   self-links and cycles. `blocked` needs a `blocked_reason`; `cancelled` needs a
   `cancelled_reason` and the developer's explicit decision.
5. Done and cancelled tickets are final. New scope after closure is a new ticket.

Run `sdd validate` after writing. Report unresolved questions separately from
status. A ticket never authorizes implementation by itself. If
`tracking.required_for` matches the requested change, say so before any edit.
