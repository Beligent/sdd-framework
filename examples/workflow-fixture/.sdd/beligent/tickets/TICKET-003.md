---
schema: beligent-sdd/ticket/v2
id: TICKET-003
title: Clamp negative task counts
status: done
revision: 1
epic: EPIC-001
spec_criteria: [SPEC-001/AC-002]
implementation:
  base: 778afa1f3c24
  snapshot: git-tree:5aea53cc86db3e41bf77c98e15550bf3f5f951a8
checks:
  - id: spec-regression
    criteria: [SPEC-001/AC-002]
    required: true
    command: BELIGENT_FIXTURE_MODULE=./app.mjs node --test regression.test.mjs
    coverage: added
    tests: [regression.test.mjs]
    outcome: pass
    revision: 1
    snapshot: git-tree:5aea53cc86db3e41bf77c98e15550bf3f5f951a8
---

# Clamp negative task counts

Implements [SPEC-001/AC-002](../specs/SPEC-001.md) for [EPIC-001](../epics/EPIC-001.md).

## Acceptance criteria

Defined by the shared spec criterion listed in `spec_criteria`.
