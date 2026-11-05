---
schema: beligent-sdd/ticket/v2
id: TICKET-004
title: Empty passport labels default to Passport (failing check)
status: in-progress
revision: 1
implementation:
  base: 778afa1f3c24
  snapshot: git-tree:0dcea35218fca83eb5f837e5d80b9c7d38b5c576
checks:
  - id: label-regression
    criteria: [AC-001]
    required: true
    command: BELIGENT_FIXTURE_MODULE=./before.mjs node --test regression.test.mjs
    coverage: added
    tests: [regression.test.mjs]
    outcome: fail
    revision: 1
    snapshot: git-tree:0dcea35218fca83eb5f837e5d80b9c7d38b5c576
---

# Empty passport labels default to Passport (failing check)

The required regression fails against `before.mjs`, so the ticket stays
`in-progress`; `sdd validate` rejects it as `done`.

## Acceptance criteria

### AC-001

A blank or whitespace-only label renders as `Passport`.
