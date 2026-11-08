---
schema: beligent-sdd/ticket
id: TICKET-002
title: Trim task titles
status: done
checks:
  - id: title-regression
    criteria: [AC-001]
    command: BELIGENT_FIXTURE_MODULE=./app.mjs node --test regression.test.mjs
    outcome: pass
---

# Trim task titles

## Context

Task titles keep stray whitespace from the import, so lists look misaligned.

## Requirements

`title` returns the task title without leading or trailing whitespace.

## Acceptance criteria

### AC-001

Titles are trimmed.

## Out of scope

Truncating long titles.
