---
schema: beligent-sdd/ticket
id: TICKET-001
title: Empty passport labels default to Passport
status: done
checks:
  - id: label-regression
    criteria: [AC-001]
    command: BELIGENT_FIXTURE_MODULE=./app.mjs node --test regression.test.mjs
    outcome: pass
---

# Empty passport labels default to Passport

## Context

The passport card shows an empty label when the stored label is blank.
`before.mjs` holds the original bug for reproduction.

## Requirements

`passportLabel` returns `Passport` for a missing, empty or whitespace-only label
and returns other labels trimmed.

## Acceptance criteria

### AC-001

A blank or whitespace-only label renders as `Passport`; other labels are trimmed.

## Out of scope

Label translations and the card layout.
