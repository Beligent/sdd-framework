---
{
  "id": "TICKET-999",
  "revision": 1,
  "status": "done",
  "implementation": "sha256:7fc3abdbe4a5c01b37c865f59749d02229f21e17e1a63e06e37aa07650e44d05",
  "checks": [
    {
      "id": "node-regression",
      "criteria": [
        "TICKET-999/AC-001"
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
# Invalid closure case

## AC-001

Empty label defaults to Passport.
