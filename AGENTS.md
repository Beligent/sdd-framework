# Beligent SDD contributor instructions

This repository contains the portable framework and optional npm tooling, not a
consumer application. Keep exactly five Agent Skills-compatible packages:
`sdd-init`, `sdd-define`, `sdd-implement`, `sdd-audit`, `sdd-deliver`.
Follow `docs/architecture.md`.

- Methodology and workflows live in Markdown. The TypeScript CLI supports
  validation, diagnostics and explicit local usage accounting, not a workflow runtime.
- Edit canonical shared assets, then run `npm run sync:assets`; never edit generated copies.
- Keep one v2 configuration schema in `schema/config.schema.json`, marked by
  `"schema": "beligent-sdd/config/v2"`. Reject earlier configurations and records
  with an actionable message; there is no conversion or backward compatibility.
- Engineering guidance applies to ordinary code requests; ticket tracking defaults
  to opt-in. Do not create SDD artifacts merely to implement or review code.
- Keep `package.json` authoritative; update the lockfile with it. Do not add a duplicate `VERSION` file.
- `.sdd/beligent/` and assistant instructions are project-owned. Setup,
  adoption and refresh inspect existing content and propose scoped changes.
- Keep usage accounting local, explicit and free of prompt/tool content. No hosted
  telemetry, accounts or agent-specific runtime.
- Run `npm run typecheck`, `npm run lint`, `npm test`,
  `npm run sync:assets -- --check`, `npm run validate:framework`,
  `npm run check:version` and `npm run validate:package`. Report actual results/limits.
- Do not publish from CI. Package validation uses `npm pack --dry-run`.

- Follow docs/decisions/002-v2-contract.md and the record contract in
  `skills/sdd-define/references/records.md`: ticket done requires current passing
  checks for every criterion, independent of delivery. Done and cancelled are final;
  audit is read-only and never reopens.
