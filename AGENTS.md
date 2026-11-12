# Beligent SDD contributor instructions

This repository contains the portable framework and optional npm tooling, not a
consumer application. Keep exactly five Agent Skills-compatible packages:
`sdd-init`, `sdd-define`, `sdd-implement`, `sdd-audit`, `sdd-deliver`.
Follow the README, which documents the design.

- Methodology and workflows live in Markdown. The TypeScript CLI supports
  deterministic installation, validation, diagnostics and explicit local usage
  accounting, not a workflow runtime.
- Edit canonical shared assets, then run `npm run sync:assets`; never edit generated copies.
- Keep one configuration schema in `schema/config.schema.json`, marked by
  `"schema": "beligent-sdd/config"`. Reject earlier configurations and records
  with an actionable message; there is no conversion or backward compatibility.
- The framework is command-only: skills run only when a prompt starts with
  `/sdd-<name>` (or `$sdd-<name>` in Codex) and disable automatic loading where
  the host supports it. Without a command only the selected stack guides apply.
- Keep `package.json` authoritative; update the lockfile with it. Do not add a duplicate `VERSION` file.
- `.sdd/beligent/` config, records and assistant instructions outside the marked
  Beligent SDD section are project-owned. `sdd install` replaces only inventory-managed
  skill files, selected stack guides and the marked section; `sdd-init` inspects and proposes.
- Keep usage accounting local, explicit and free of prompt/tool content. No hosted
  telemetry, accounts or agent-specific runtime.
- Run `npm run typecheck`, `npm run lint`, `npm test`,
  `npm run sync:assets -- --check`, `npm run validate:framework`,
  `npm run check:version` and `npm run validate:package`. Report actual results/limits.
- Do not publish from CI. Package validation uses `npm pack --dry-run`.

- Follow the README and the ticket contract in
  `skills/sdd-define/references/records.md`. A ticket is the only record; it is an
  AI work unit, done when its criteria and required checks pass. Cancelled
  tickets are never reopened; a done ticket reopens only through
  `sdd-implement`; audit is read-only.
