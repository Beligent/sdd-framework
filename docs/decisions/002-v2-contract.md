# 002 · Beligent v2 contract

Status: accepted. Supersedes the interim 1.0 contract. The release number is a
separate decision; `v2` names the contract generation.

## Constraints

- Clean break: one new schema; earlier configurations and records are rejected
  with an actionable message. No compatibility shims, conversion or migration.
- Engineering standards apply to ordinary requests. Tracking starts only on
  explicit intent. The main assistant is the default; specialists are optional.
- Five skills: `sdd-init`, `sdd-define`, `sdd-implement`, `sdd-audit`,
  `sdd-deliver`. No `frameworks.json`. Settings live in `.sdd/beligent/config.json`.
- A ticket is done when its agreed work is complete and its required checks pass.
  Delivery state and permissions are separate from completion.

## Decisions

| Area | Decision |
| --- | --- |
| Version marker | `"schema": "beligent-sdd/config/v2"` in config; `schema: beligent-sdd/{ticket,epic,spec}/v2` in records. Not `schema_version`, which earlier schemas used |
| Config | Required `schema` and `hosts`; optional `project.name`, `stacks`, `checks`, `tracking` (`required_for`, `authorization`) and `delivery` (`commit`, `push`, `pull_request`, `delivered_at`). Record paths are fixed |
| Records | Fixed directories `.sdd/beligent/{tickets,epics,specs}/<ID>.md`; criteria are `### AC-001` headings; a ticket's required criteria are its local headings plus `spec_criteria` |
| Lifecycle | Ticket `todo`, `in-progress`, `blocked`, `done`, `cancelled`. Done and cancelled are final: no reopening; only `delivery` may change after closure. A later problem is fixed as ordinary work, or as a new ticket when tracking is requested |
| Revisions | Tickets carry a scope `revision`. Changing criteria while open increments it and appends a `revised` history entry; earlier checks and authorization stop counting. Specs have no revision and are refined freely; done tickets are not re-validated against later spec edits |
| Verification | Checks record criteria, command or manual procedure (with observation and performer), outcome, revision and snapshot. Closure needs a passing current required check for every criterion and every configured required check |
| Snapshot | `git-tree:<sha>` of the working tree excluding `.sdd/beligent/`, from `sdd snapshot`; `sdd validate --snapshot` compares it with the working tree |
| Final states | `sdd validate --since <ref>` rejects changes to done or cancelled records, history removal, revision decreases and criteria changes without a new revision |
| Installation | A deterministic installer applies the mechanical writes (dry-run by default) and `sdd-init` inspects and proposes. Installer-owned guidance updates until a user edits it. Implemented separately |

## Removed

Requirements/PRD, ADR, plan, approval and verification-report records; compact
and expanded ticket forms; the ticket-provider abstraction; profiles, rigor,
design depth and readiness; `tracking.mode`; the `git` policy block. Plans and
decisions stay in chat, ticket notes or ordinary project documentation.

## Validator boundary

`sdd validate` checks shape, identity, references, cycles, final states,
revision history and the closure rule. It cannot establish that criteria capture
the agreed work, that tests exercise them, that commands really ran or that
manual observations happened; those remain the implementer's responsibility.
