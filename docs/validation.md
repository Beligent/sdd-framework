# Validation and development checks

Node.js 22 or later is the only development runtime required by this repository.
Consumer projects do not install development dependencies or need Python to use
the skills or CLI.

## Set up development

```sh
npm ci
npm run typecheck
npm run lint
npm test
```

These commands typecheck the TypeScript source, lint tooling and tests, and run
the behavioral suite. Tests use temporary repositories and fixtures; they do
not modify project files.

## Maintain canonical skill resources

Shared resources have one canonical authoring location, registered in
`src/packaging/sync-assets.ts`. Edit the canonical resource, then synchronize
the deterministic packaged copies and review the diff:

```sh
npm run sync:assets
npm run sync:assets -- --check
```

`--check` is read-only. It reports missing or changed copies and manifest drift.
Installed skills remain self-contained after copying.

## Validate the framework and package

```sh
npm run validate:framework
npm run check:version
npm run validate:package
```

Framework validation checks five skill entrypoints, metadata, required templates,
local Markdown links, package-manifest byte consistency, config templates, and
the worked example's artifact graph. Version validation checks `package.json` against both lockfile version entries.
Package validation builds the CLI and checks the `npm pack --dry-run`
file list against the publishing allowlist. It does not publish.

The npm CLI can validate a consumer project from that project's directory:

```sh
npx @beligent/sdd-framework validate
npx @beligent/sdd-framework doctor
```

`validate` checks the v2 `.sdd/beligent/config.json`, duplicate JSON keys, record
identity, markers, references, dependency cycles and structured check coverage,
outcomes, revision and snapshot at closure; `--since <ref>` adds final-state and
revision rules and `--snapshot <TICKET-ID>` compares the recorded snapshot with the
working tree. It is read-only. `doctor` reports config status, pre-v2 leftovers and
whether core skills exist in known project locations. Missing skill copies are
warnings because installations vary by agent; malformed or missing config is an
error. These commands do not initialize, adopt, migrate, or modify a project.

The configuration schema is in `schema/config.schema.json`. TypeScript checks
filesystem conditions that JSON Schema cannot express. Earlier configurations are rejected, never converted or rewritten.

## Test boundaries

Structural checks can establish valid files, references, path containment, and
record consistency. They cannot prove that an assistant followed a skill, a
human made a recorded decision, or the application's tests passed. Keep these
claims tied to evidence and test assistant discovery separately in a disposable
project.

The external `skills@1.7.2` installer has been exercised locally for Codex,
Claude Code, GitHub Copilot, and Cursor. Those checks establish installation layout and
resource completeness, not live assistant behavior.

## Runnable scenarios and installation smoke

Run node examples/workflow-fixture/run-scenarios.mjs for real regression and
post-close reproductions. Maintainer tests invoke this node:test fixture as a
subprocess and validate its structured record graph and invalid closure case.
Vitest collects only tests/; the fixture is not a Vitest module.

Run node scripts/smoke-installer.mjs /path/to/skills-1.7.2/bin/cli.mjs with an
available pinned installer. It uses disposable projects, installs twice, compares
all five packages and protects existing app/instruction/config/state/ticket bytes
and timestamps. A separate host-package plan test checks selected shared guidance,
stack modules, idempotency, conflicts and unsafe paths. Neither test launches a
host application or proves native instruction loading.
