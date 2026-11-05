---
{
  "id": "EPIC-001",
  "revision": 1,
  "status": "done",
  "tickets": [
    "TICKET-002",
    "TICKET-003"
  ],
  "implementation": "sha256:5d7655fd0abfcc8efb2c657c9e4c7f16f9e13acf48a91c4a8d952a23fcb6ed88",
  "checks": [
    {
      "id": "node-regression",
      "criteria": [
        "EPIC-001/AC-001"
      ],
      "required": true,
      "command": "BELIGENT_FIXTURE_MODULE=./app.mjs node --test regression.test.mjs",
      "outcome": "pass",
      "revision": 1,
      "snapshot": "sha256:5d7655fd0abfcc8efb2c657c9e4c7f16f9e13acf48a91c4a8d952a23fcb6ed88"
    }
  ]
}
---
# Shared task presentation

## AC-001

Titles and counts satisfy the linked shared spec through both completed child tickets.
