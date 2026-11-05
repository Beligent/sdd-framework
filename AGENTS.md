# Beligent SDD contributor instructions

This repository contains the portable framework and optional npm tooling, not a
consumer application. Keep exactly five Agent Skills-compatible packages:
`sdd-init`, `sdd-define`, `sdd-implement`, `sdd-audit`, `sdd-deliver`.
Follow `docs/architecture.md`.

- Methodology and workflows live in Markdown. The TypeScript CLI supports
  validation, diagnostics and explicit local usage accounting, not a workflow runtime.
- Edit canonical shared assets, then run `npm run sync:assets`; never edit generated copies.
- Keep one unversioned default configuration schema in `schema/config.schema.json`.
  Reject old versioned configurations; conversions need a reviewed preservation plan.
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

- Follow the implementation runbook and docs/decisions/001-default-contract.md:
  ticket done requires current passing criterion checks, independent of delivery.
  Audit is read-only by default; preserve history on explicitly authorized reopen.
