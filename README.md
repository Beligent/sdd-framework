# Beligent SDD

Beligent is a vendor-neutral Specification-Driven Development framework for
teams that use coding agents. It gives product decisions, implementation work,
and verification a shared Markdown record, so work can be reviewed and traced
from a requirement through observable behavior and evidence.

The framework is delivered as nine portable Agent Skills. The methodology stays
in Markdown and works with Codex, Claude Code, GitHub Copilot, Cursor, and other
Agent Skills-compatible assistants. Optional TypeScript tooling validates
configuration and diagnoses a project; it does not replace the skills or run an
agent. Normal framework use is local and requires no Beligent account, hosted
service, telemetry, or application runtime.

## Install the skills

The primary distribution path is the public Git repository and the external
`skills` installer. The planned public source is `beligent/sdd`; replace it if
the final repository owner or name differs:

```sh
npx skills@1.7.2 add Beligent/sdd-framework --skill '*' --agent codex --copy -y
```

Choose the intended agent, for example `claude-code`, `github-copilot`, or
`cursor`. The installer puts the skill folders in the selected agent's project
discovery location. `skills add @beligent/sdd-framework` is not supported: the installer
accepts Git repositories, local paths, and supported URLs, while npm provides
the separate optional CLI below.

## Set up a project

For a new repository, ask the installed assistant:

> Use init-project here. Identify the project type and propose configuration
> and instruction changes before applying them.

For an existing codebase, ask it:

> Use adopt-project to audit our instructions, architecture, specifications,
> and backlog. Reuse what is already useful and show the exact integration plan
> before changing configuration.

Both workflows inspect existing files and propose changes. Human approval is
required for adoption/configuration changes and for implementation and
completion decisions. Setup may create `.beligent/config.json`,
`.beligent/setup-state.json`, configured `docs/sdd/` artifacts, and small
managed sections in assistant instruction files. It preserves existing content
outside approved sections; it does not replace an existing `AGENTS.md`,
`CLAUDE.md`, `.github/copilot-instructions.md`, or `docs/` tree wholesale.

## Follow the work

```text
Requirements → Specification → Epics and preliminary tickets
                    ↕ technical planning and refinement
              Implementation → Verification → Completion decision
```

This is an iterative path, not a mandatory checklist. `define-work` independently
supports requirements, specification, epics, and ticket workflows. Tickets can
start preliminary and be refined after planning. `plan-work` records consequential
architecture decisions and implementation plans. `implement-ticket` works only
within an approved scope; `verify-work` traces the result to evidence and prepares
a human completion decision.

The nine skills are `init-project`, `adopt-project`, `define-work`, `plan-work`,
`implement-ticket`, `verify-work`, `develop-task`, `diagnose`, and `deliver-work`. Use `develop-task` for the
normal one-task path through definition, optional planning, implementation, and
verification, stopping before Git delivery. Use `diagnose` for independent
root-cause investigation without silently implementing a correction. Use
`deliver-work` to commit, push, or open a PR within project policy after the task
is ready for delivery. Markdown tickets are the initial provider;
the documented provider contract leaves room for future issue trackers.

## Optional npm tooling

Node.js 22 or later is required for the CLI. The skills themselves have no
runtime dependency and do not require Python in consumer projects.

```sh
npx @beligent/sdd-framework validate
npx @beligent/sdd-framework doctor
npx @beligent/sdd-framework usage report
```

`validate` checks `.beligent/config.json` without changing it. `doctor` reports
configuration problems and whether core skills are discoverable in common
project locations. `usage footer`, `usage import`, and `usage report` provide
opt-in local token accounting from Codex or Claude structured output. The CLI
does not install skills or perform setup. The published npm package is an
optional companion to the GitHub collection.

## Project maturity

Version 0.2.1 is an early public-development release. The repository includes
the nine skills, a worked artifact example, deterministic skill packaging,
configuration/repository validation, and local installer checks. Actual behavior
still depends on the coding agent and its discovery surface; the framework does
not enforce human approval as a security boundary or certify application tests.

## Documentation

- [Installation and setup](docs/installation.md), [existing-project adoption](docs/adoption.md), and [agent compatibility](docs/agents.md)
- [Architecture](docs/architecture.md), [lifecycle](docs/lifecycle.md), [artifact model](docs/artifact-model.md), and [terminology](docs/terminology.md)
- [Customization](docs/customization.md), [maintenance](docs/maintenance.md), and [CLI validation](docs/cli.md)
  A worked task-tracker example is maintained under `examples/` in the source repository.

The framework version is recorded in `package.json` and checked against
[`VERSION`](VERSION). The project is licensed under [MIT](LICENSE); see
[`CHANGELOG.md`](CHANGELOG.md) for release notes.
