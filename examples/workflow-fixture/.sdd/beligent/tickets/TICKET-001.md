---
schema: beligent-sdd/ticket/v2
id: TICKET-001
title: Empty passport labels default to Passport
status: done
revision: 1
implementation:
  base: 778afa1f3c24
  snapshot: git-tree:5aea53cc86db3e41bf77c98e15550bf3f5f951a8
checks:
  - id: label-regression
    criteria: [AC-001]
    required: true
    command: BELIGENT_FIXTURE_MODULE=./app.mjs node --test regression.test.mjs
    coverage: added
    before: fail
    tests: [regression.test.mjs]
    outcome: pass
    revision: 1
    snapshot: git-tree:5aea53cc86db3e41bf77c98e15550bf3f5f951a8
---

# Empty passport labels default to Passport

A standalone ticket: local criteria, no epic or shared spec.

## Acceptance criteria

### AC-001

A blank or whitespace-only label renders as `Passport`; other labels are trimmed.
