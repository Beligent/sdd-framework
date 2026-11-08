---
schema: beligent-sdd/ticket
id: TICKET-999
title: Invalid closure case
status: done
checks:
  - id: label-regression
    criteria: [AC-001]
    command: BELIGENT_FIXTURE_MODULE=./before.mjs node --test regression.test.mjs
    outcome: fail
---

# Invalid closure case

## Requirements

A blank label renders as `Passport`.

## Acceptance criteria

### AC-001

A blank label renders as `Passport`.
