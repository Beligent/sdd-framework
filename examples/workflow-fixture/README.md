# Workflow walkthrough

A small Node.js example of the Beligent SDD framework flow: work without a command, a ticket
defined and implemented to done, failing and blocked checks, ticket removal
before delivery, and work without a command while a ticket is open. It has two parts:

- [`walkthrough.mjs`](walkthrough.mjs), which runs the real `sdd` CLI and real
  `node --test` runs in a disposable Git project and checks every outcome it prints;
- static sample tickets under [`.sdd/beligent/tickets/`](.sdd/beligent/tickets/),
  which `npm run validate:framework` validates.

## Run it

From the repository root, with Node.js 22 or later:

```sh
npm ci
npm run build
node examples/workflow-fixture/walkthrough.mjs          # add --keep to inspect the project
```

The script copies `app.mjs` and `regression.test.mjs` into a temporary
directory, seeds two defects, runs `sdd install --host codex --stack nodejs
--apply`, and deletes the directory at the end. It writes nothing in this
repository. `npm test` runs the same script against the TypeScript source.

The script stands in for the developer and the assistant: it edits code and
writes tickets the way the commands would. The quoted commands show what a
developer would type in a host; they are **illustrative** and were not sent to
an assistant. Host behavior is covered by the
[live test procedure](../../README.md#live-test-in-a-host).

## Scenarios

**0. `/sdd-init`.** `sdd install` writes the five skills to `.agents/skills/`, the
Node.js guide to `.sdd/beligent/guidance/` and the command-only Beligent SDD
section after the handwritten text in `AGENTS.md`; a repeat changes nothing. The
reviewed config edit then adds a project check covering the `.mjs` files:

```json
"checks": [{ "id": "test", "command": "node --test", "paths": ["**/*.mjs"] }]
```

**1. No command.** *"Fix the empty passport label."* This is ordinary work: the
regression fails before the fix and passes after it, and no ticket is created.

**2. `/sdd-define Clamp negative counts`.** A ticket without requirements or
with an empty criterion is rejected. TICKET-001 is written with Context,
Requirements, `AC-001` and Out of scope, status `todo`. The work touches `.mjs`
files, so the ticket lists `checks_required: [test]`.

**3. `/sdd-implement TICKET-001`.** The ticket moves to `in-progress`, the fix
lands, and the agent records the checks and sets `done`. Done is rejected until
the listed `test` check has passed:

```yaml
status: done
checks_required: [test]
checks:
  - { id: count-regression, criteria: [AC-001], command: node --test regression.test.mjs, outcome: pass }
  - { id: test, command: node --test, outcome: pass }
```

**4. Failing and blocked checks.** TICKET-002 ("Name blank titles") has a check
that fails because the behavior is not implemented. Marking it `done` is
rejected; `blocked` with a `blocked_reason` for the developer is accepted.

**5. `/sdd-deliver TICKET-001`.** The agent asks whether to delete the finished
ticket; the developer agrees, so it is deleted before the commit, and its criteria go into the commit message. TICKET-002 still validates
although it depends on the removed ticket, and the next ID is TICKET-003 because
IDs come from Git history and are never reused.

**6. Work without a command while a ticket is open.** TICKET-003 is in progress
when the developer asks for a change without a command. The change is made
without questions, the ticket file stays byte-for-byte unchanged and still
validates, and the change stays in the working tree for the usual workflow.

## Observed output

Recorded on 2026-11-11 by running the walkthrough against the TypeScript CLI
(Node.js 22, macOS).

```text
0. "/sdd-init": install for Codex with Node.js guidance, then the reviewed config edit
  observed: Applied 60 change(s).
  observed: repeat install reports only unchanged files and keeps config
  observed: AGENTS.md keeps its text and gains the command-only Beligent SDD section
  observed: config now has check `test` (node --test) covering **/*.mjs; sdd validate exits 0
1. No command: "Fix the empty passport label" is ordinary work
  observed: the label test passes after the fix and no ticket exists
2. "/sdd-define Clamp negative counts": one ticket, requirements first
  observed: a ticket without requirements or criterion text is rejected
  observed: TICKET-001 is todo with requirements, AC-001 and an out-of-scope list; sdd validate exits 0
3. "/sdd-implement TICKET-001": implement, record checks, set done
  observed: done is rejected until the listed check `test` passes
  observed: TICKET-001 is done: AC-001 and the listed project check pass
4. Failing and blocked checks keep a ticket open
  observed: done is rejected: check 'blank-title' is fail
  observed: TICKET-002 is blocked with a reason for the developer; sdd validate exits 0
5. "/sdd-deliver TICKET-001": the developer agrees to delete the finished ticket before the commit
  observed: TICKET-001 is removed, its criteria stay in the commit message, and TICKET-002 still validates
  observed: the next ID is TICKET-003, taken from Git history, so a removed ID is never reused
6. A change without a command while TICKET-003 is in progress
  observed: the change is made, TICKET-003 is unchanged and still validates
All walkthrough checks passed.
```

## Static sample tickets

Their check commands run from this directory: `regression.test.mjs` imports the
module named by `BELIGENT_FIXTURE_MODULE`.

- [TICKET-001](.sdd/beligent/tickets/TICKET-001.md): a done ticket with a
  regression check (`before.mjs` holds the original bug).
- [TICKET-002](.sdd/beligent/tickets/TICKET-002.md) and
  [TICKET-003](.sdd/beligent/tickets/TICKET-003.md): done tickets;
  TICKET-003 depends on TICKET-002.
- [TICKET-004](.sdd/beligent/tickets/TICKET-004.md) stays `in-progress` because
  its check fails against `before.mjs`.
- `cases/invalid-done.md` declares `done` with that failing check; the test suite
  copies it into a disposable project and confirms `sdd validate` rejects it.
- `audit-regression.mjs` is a later regression in done work, for `/sdd-audit` practice.
