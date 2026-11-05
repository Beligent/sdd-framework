# Architecture

Beligent is a portable Markdown engineering framework with optional tracking.
Release 1.0.0 follows the implementation runbook with one unversioned configuration;
see the [default contract decision](decisions/001-default-contract.md).

| Skill | Responsibility |
| --- | --- |
| sdd-init | Inspect/install selected host integrations through a reviewed setup/adoption proposal |
| sdd-define | Define behavior, standalone tickets, shared specs, optional epics and useful planning |
| sdd-implement | Implement, add/update useful tests, verify every criterion and record completion |
| sdd-audit | Read-only review, verification, diagnosis or status before/after closure |
| sdd-deliver | Independently authorized scoped Git delivery |

## Project layout and default guidance

`.sdd/beligent/config.json` holds settings. `.sdd/beligent/guidance/` holds installed
general/testing/review and selected stack guidance, linked by AGENTS.md and native
bridges so ordinary requests inherit standards without invoking a workflow skill.
Tickets, epics and specs are on-demand paths. No frameworks.json is used.
One main assistant is default; optional native specialists use bounded assignments,
relevant criteria/evidence expectations and the same local/project/stack guidance.

Config includes project, assistants, technologies, workflow, testing, Git, tracking,
artifact paths and ticket paths. Legacy profiles/mandatory completion gates are
removed. Tracking is opt-in; readonly ticket mentions or audits never authorize
implementation or record writes. Surface project-wide tracking policy before edits.
Missing config does not block ordinary authorized code work.

## Records, evidence and lifecycle

Records use stable IDs and positive integer scope revisions. A standalone ticket
can hold local criteria; linked specs provide canonical behavior spanning tickets.
Epics are optional. `checks` maps criteria to command/procedure, actual outcome,
required flag, ticket revision and implementation snapshot. Every required check
must pass and every criterion must be covered by current required evidence before
done. Stale, unrun, blocked or failed required checks keep work open.

Completion is independent of audit, human acceptance and Git delivery. Honor
actual project-specific scope authorization; do not invent universal extra gates.
Audit is read-only by default and may recommend reopening for missed original
criteria. Authorized reopening preserves old evidence/history and requires fresh
checks. Newly requested scope is separate work. Delivery uses its own states,
permissions and `git.delivery_complete_at`; an open PR never establishes a merge.

## Packaging, setup and ownership

Canonical resources are registered in `src/packaging/sync-assets.ts`. Generated
PACKAGED.json files identify exact shared-source copies. Each skill is standalone;
sdd-init carries packaged guidance assets for consumer installation. Read-only
`src/packaging/hosts.ts` prepares selected-host file plans and preflights unsafe or
locally modified destinations; it does not apply consumer setup. The external
pinned skills installer or reviewed exact file copies install native packages.
The assistant executes the Markdown setup procedure with ordinary file tools.

Only selected host bridges/copies and common guidance are proposed. Inspect duplicate
skill discovery, old .beligent/docs/sdd installations, current bytes/ownership and
handwritten instructions before writes. Review clean-break conversion separately;
never silently overwrite legacy/local content. Identical setup is a byte/timestamp
no-op. The consumer owns .sdd/beligent, instructions and artifacts. Setup-state and
usage retain independent format markers; installer provenance stays in its lock.

## Tooling and limits

The optional CLI validates configuration and tracked records, diagnoses missing/
duplicate discovery and legacy config, and imports explicit local numeric usage.
YAML is a runtime dependency only for record validation; no Python is needed.
There is no hosted telemetry, ticket service or agent-specific workflow engine.
Digest conflict checks are observed-change protection, not transactional CAS.
Structural validation checks declared evidence, never proves test truth or consent.
See [host evidence](agents.md) and [validation](validation.md).
