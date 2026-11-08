---
schema: beligent-sdd/ticket
id: TICKET-003
title: Clamp negative task counts
status: done
depends_on: [TICKET-002]
checks:
  - id: count-regression
    criteria: [AC-001]
    command: BELIGENT_FIXTURE_MODULE=./app.mjs node --test regression.test.mjs
    outcome: pass
---

# Clamp negative task counts

## Context

Sync errors can produce negative task counts, which the badge shows as-is.

## Requirements

`count` never returns a negative number; zero and positive counts are unchanged.

## Acceptance criteria

### AC-001

Negative counts clamp to zero; positive counts are preserved.

## Out of scope

Fixing the sync error itself.
