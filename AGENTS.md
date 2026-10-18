# Beligent SDD contributor instructions

This repository contains the portable framework and optional npm tooling, not
a consumer application. Keep exactly six core skills and preserve their
Agent Skills-compatible layout under `skills/`. Follow the approved framework
architecture in `docs/architecture.md`.

- Keep methodology and workflow logic in Markdown skills. The TypeScript CLI
  supports validation and diagnostics; it does not replace init/adopt workflows.
- Edit canonical shared assets, then run `npm run sync:assets`; never edit
  generated copies directly.
- Keep the configuration schema in `schema/config.schema.json` and preserve the
  schema-1 contract. Unknown versions require an explicit migration design.
- Keep `package.json` as the authoritative release version; update `VERSION`
  with it and run `npm run check:version`.
- Treat `.beligent/`, `docs/sdd/`, and assistant instruction files as project
  owned. Setup and adoption workflows inspect existing content and propose
  scoped changes for approval.
- Do not add telemetry, hosted services, accounts, or an agent-specific runtime.
- Run `npm run typecheck`, `npm run lint`, `npm test`,
  `npm run sync:assets -- --check`, `npm run validate:framework`, and
  `npm run validate:package` for relevant changes. Report checks actually run
  and their limits.
- Do not publish from CI. Package validation uses `npm pack --dry-run`.
