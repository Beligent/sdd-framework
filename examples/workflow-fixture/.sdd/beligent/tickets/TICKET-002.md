---
{
  "id": "TICKET-002",
  "revision": 1,
  "status": "done",
  "implementation": "sha256:5d7655fd0abfcc8efb2c657c9e4c7f16f9e13acf48a91c4a8d952a23fcb6ed88",
  "checks": [
    {
      "id": "node-regression",
      "criteria": [
        "SPEC-001/AC-001"
      ],
      "required": true,
      "command": "BELIGENT_FIXTURE_MODULE=./app.mjs node --test regression.test.mjs",
      "outcome": "pass",
      "revision": 1,
      "snapshot": "sha256:5d7655fd0abfcc8efb2c657c9e4c7f16f9e13acf48a91c4a8d952a23fcb6ed88"
    }
  ],
  "specifications": [
    "SPEC-001"
  ],
  "epic": "EPIC-001",
  "acceptance_criteria": [
    "SPEC-001/AC-001"
  ]
}
---
# Trim task titles

## Objective

Trim task titles.

## Behavior

Implement only this bounded behavior.

## Acceptance criteria

### AC-001

Trim task titles.

## Fixture status

Illustrative record state; check commands are runnable in this example root.
The scenario runner executes actual pass/fail reproductions but does not write records or impersonate human decisions.
