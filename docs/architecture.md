# Architecture

Beligent is a portable Markdown engineering framework with optional ticket
tracking. The [v2 contract decision](decisions/002-v2-contract.md) records the
design; the [record contract](../skills/sdd-define/references/records.md) is the
normative reference for tracked records.

| Skill | Responsibility |
| --- | --- |
| sdd-init | Inspect the project and install selected host integrations through a reviewed proposal |
| sdd-define | Define behavior, standalone tickets, shared specs and optional epics; useful planning |
| sdd-implement | Implement, add/update useful tests, verify every criterion and record completion |
| sdd-audit | Read-only review, verification, diagnosis or status before/after closure |
| sdd-deliver | Independently authorized scoped Git delivery |

## Project layout and default guidance

`.sdd/beligent/config.json` holds settings. `.sdd/beligent/guidance/` holds installed
general/testing/review and selected stack guidance, linked by AGENTS.md and native
bridges so ordinary requests inherit standards without invoking a workflow skill.
Tickets, epics and specs live in fixed on-demand directories under `.sdd/beligent/`.
No frameworks.json is used. One main assistant is default; optional native
specialists use bounded assignments and the same guidance.

Config requires `schema` and `hosts`; `stacks`, project `checks`, `tracking` and
`delivery` are optional. Tracking starts only on explicit intent; read-only ticket
mentions or audits never authorize implementation or record writes. Missing config
does not block ordinary authorized code work. Earlier configurations are rejected.

## Records, evidence and lifecycle

A standalone ticket holds local `### AC-001` criteria; shared specs provide
behavior spanning tickets through `spec_criteria`. Epics are optional. Each check
records criteria, command or manual procedure, outcome, revision and `git-tree:`
snapshot. Done requires every criterion and configured required check to pass at
the current revision and snapshot; failed, blocked, unrun or stale checks keep work open.

Done and cancelled are final; only delivery may change afterwards. Audit is
optional and read-only; a later fix is ordinary work, or a new ticket when
tracking is requested. Changing an open ticket's criteria increments its
revision and appends history. Delivery has its own states and permissions and
never gates completion.

## Packaging, setup and ownership

Canonical resources are registered in `src/packaging/sync-assets.ts`. Generated
PACKAGED.json files identify exact shared-source copies. Each skill is standalone;
sdd-init carries packaged guidance assets for consumer installation. Read-only
`src/packaging/hosts.ts` prepares selected-host file plans and preflights unsafe or
locally modified destinations. Setup inspects duplicate skill discovery, pre-v2
installations and handwritten instructions before writes, and never silently
overwrites them. Identical setup is a byte/timestamp no-op. The consumer owns
`.sdd/beligent/`, instructions and records.

## Tooling and limits

The optional CLI validates configuration and records (`sdd validate`, with
`--since` for final states and `--snapshot` for closure), prints the implementation
snapshot (`sdd snapshot`), diagnoses installations (`sdd doctor`) and imports
explicit local numeric usage. There is no hosted telemetry, ticket service or
workflow engine. Structural validation checks declared evidence; it never proves
test truth or consent. See [host evidence](agents.md) and [validation](validation.md).
