---
{
  "id": "TICKET-005",
  "revision": 2,
  "status": "todo",
  "implementation": "sha256:e924632c4e6893e54e3d37c63ab5908c2acad9db58fdac460e74a78d9fd0e07d",
  "checks": [
    {
      "id": "node-regression",
      "criteria": [
        "TICKET-005/AC-001"
      ],
      "required": true,
      "command": "BELIGENT_FIXTURE_MODULE=./audit-regression.mjs node --test regression.test.mjs",
      "outcome": "fail",
      "revision": 2,
      "snapshot": "sha256:e924632c4e6893e54e3d37c63ab5908c2acad9db58fdac460e74a78d9fd0e07d"
    }
  ],
  "history": [
    {
      "revision": 1,
      "reason": "Illustrative authorized reopen after post-close audit found original AC-001 unmet; old evidence retained",
      "snapshot": "sha256:5d7655fd0abfcc8efb2c657c9e4c7f16f9e13acf48a91c4a8d952a23fcb6ed88",
      "definition": "Negative counts clamp to zero",
      "checks": [
        {
          "id": "node-regression",
          "criteria": [
            "TICKET-005/AC-001"
          ],
          "required": true,
          "command": "BELIGENT_FIXTURE_MODULE=./app.mjs node --test regression.test.mjs",
          "outcome": "pass",
          "revision": 1,
          "snapshot": "sha256:5d7655fd0abfcc8efb2c657c9e4c7f16f9e13acf48a91c4a8d952a23fcb6ed88"
        }
      ]
    }
  ]
}
---
# Negative counts clamp to zero

## Objective

Negative counts clamp to zero.

## Behavior

Implement only this bounded behavior.

## Acceptance criteria

### AC-001

Negative counts clamp to zero.

## Fixture status

Illustrative record state; check commands are runnable in this example root.
The scenario runner executes actual pass/fail reproductions but does not write records or impersonate human decisions.
