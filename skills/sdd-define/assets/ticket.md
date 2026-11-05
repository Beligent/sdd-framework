---
id: TICKET-001
revision: 1
kind: ticket
title: "Ticket outcome"
status: todo
readiness: preliminary
priority: medium
requirements: []
specifications: []
acceptance_criteria: []
dependencies: []
approval_refs: []
evidence: []
---

# Ticket outcome

## Scope and expected behavior

Describe the result, motivating context and explicit exclusions. Link the parent
epic if applicable. The frontmatter lists stable contract references.

## Acceptance criteria

Link defining specification criteria. A lightweight ticket may define local
criteria under stable headings such as `AC-001`, referenced as TICKET-001/AC-001.

## Plan and validation

Link the implementation plan, or include the short plan and meaningful checks
for a lightweight ticket. Explain any dependencies and prerequisite conditions.

## Assumptions and open questions

Record missing references and unresolved decisions; keep preliminary until the
current task's behavior and blocking questions are satisfied.

## Changes, evidence and completion

Explain material refinements and approval effects. Map criteria to actual
evidence, failures/unverified claims and current criterion check results and implementation snapshot.

## Structured verification

Before done, set implementation to the reviewed snapshot/diff digest and add checks
in frontmatter. Each check identifies id, criteria, required, command/procedure,
outcome, revision and snapshot. Required failed/blocked/unverified or stale checks
keep work open. Do not invent passing data in a template. Keep old scope/checks
in history on revision. Git delivery is independent of ticket completion.
