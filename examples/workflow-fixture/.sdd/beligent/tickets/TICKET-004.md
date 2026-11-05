---
{
  "id": "TICKET-004",
  "revision": 1,
  "status": "blocked",
  "implementation": "sha256:7fc3abdbe4a5c01b37c865f59749d02229f21e17e1a63e06e37aa07650e44d05",
  "checks": [
    {
      "id": "node-regression",
      "criteria": [
        "TICKET-004/AC-001"
      ],
      "required": true,
      "command": "BELIGENT_FIXTURE_MODULE=./before.mjs node --test regression.test.mjs",
      "outcome": "fail",
      "revision": 1,
      "snapshot": "sha256:7fc3abdbe4a5c01b37c865f59749d02229f21e17e1a63e06e37aa07650e44d05"
    }
  ]
}
---
# Empty passport labels default to Passport

## Objective

Empty passport labels default to Passport.

## Behavior

Implement only this bounded behavior.

## Acceptance criteria

### AC-001

Empty passport labels default to Passport.

## Fixture status

Illustrative record state; check commands are runnable in this example root.
The scenario runner executes actual pass/fail reproductions but does not write records or impersonate human decisions.
