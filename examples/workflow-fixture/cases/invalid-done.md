---
schema: beligent-sdd/ticket/v2
id: TICKET-999
title: Invalid closure case
status: done
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
    outcome: fail
    revision: 1
    snapshot: git-tree:0dcea35218fca83eb5f837e5d80b9c7d38b5c576
---

# Invalid closure case

## Acceptance criteria

### AC-001

A blank label renders as `Passport`.
