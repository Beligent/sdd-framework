---
schema: beligent-sdd/ticket
id: TICKET-004
title: Empty passport labels default to Passport (failing check)
status: in-progress
checks:
  - id: label-regression
    criteria: [AC-001]
    command: BELIGENT_FIXTURE_MODULE=./before.mjs node --test regression.test.mjs
    outcome: fail
---

# Empty passport labels default to Passport (failing check)

## Context

The regression still fails against `before.mjs`, so the ticket stays
`in-progress`; `sdd validate` rejects it as `done`.

## Requirements

`passportLabel` returns `Passport` for a blank label.

## Acceptance criteria

### AC-001

A blank or whitespace-only label renders as `Passport`.

## Out of scope

Other label rules.
