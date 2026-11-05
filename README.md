# Beligent SDD

Beligent provides portable engineering standards for everyday AI-assisted code
work, with optional specifications and ticket tracking. Five Agent Skills carry
the methodology; an optional TypeScript CLI validates project configuration,
checks installation locations and accounts for explicitly imported local usage.

## Version

This release is a clean break with no backward compatibility: earlier skills and
configurations are not supported or converted. Set up existing projects afresh
with `sdd-init`. See [the changelog](CHANGELOG.md).

`package.json` is the release-version authority. There is no separate `VERSION`
file; `npm run check:version` checks agreement with `package-lock.json`.
The 1.0.0 changes in this checkout do not imply registry publication.

## Target agents

| Target surface | Installer agent selector | Project integration candidates | Validation status |
| --- | --- | --- | --- |
| Codex in VS Code and CLI | `codex` | `AGENTS.md`, `.agents/skills/` | 1.0 local installer/reinstall checked; live workflow pending on both surfaces |
| Claude Code in VS Code and CLI | `claude-code` | `CLAUDE.md` importing `AGENTS.md`, `.claude/skills/` | 1.0 local installer/reinstall checked; live workflow pending on both surfaces |
| Copilot in VS Code Agent mode and CLI | `github-copilot` | `.github/copilot-instructions.md`; supported project skill locations | 1.0 local installer/reinstall checked; live workflow pending on both surfaces |
| Copilot cloud agent | Confirm cloud resource discovery separately | Committed supported project instructions and skills | Cloud installation/discovery and live workflow pending |
| Cursor Agent | `cursor` | `AGENTS.md`; `.agents/skills/` or `.cursor/skills/`, depending on configuration | 1.0 local installer/reinstall checked; live workflow pending |
| Devin Desktop with Devin Local | Not established; do not assume an installer selector | Confirm the installed product's local discovery mechanism | New target; installation and live workflow pending |

Targets are intended integration surfaces, not a claim that all hosts have been
tested. Current external-installer checks cover all five skills for Codex, Claude,
Copilot and Cursor, including two local installs and protected-file preservation.
Copied-package tests also check shared guidance and resource containment.
See [agent integration and host test scenarios](docs/agents.md) for evidence,
settings, discovery limitations and the full per-surface matrix.

## Install

From the target project, install all five packages from a reviewed local framework
checkout (replace the source path and agent selector):

```sh
cd /path/to/target-project
npx skills@1.7.2 add /path/to/beligent-sdd-framework --skill '*' --agent codex --copy -y
```

The source repository's `skills/` directory is packaging input; it is not itself
an installed discovery location. Copy the complete skill directories, including
references and assets. For Git-source installation and other layouts, see
[installation](docs/installation.md). Use the actual reviewed Git repository;
verify provisional distribution metadata before a public release.

Start a fresh session at the target project root and request:

> Use sdd-init here. Inspect the existing project, preserve its instructions and
> artifacts, and show the exact setup/adoption proposal before applying it.
> Keep tracking opt-in and install engineering guidance for ordinary code requests.

Review the proposal, then authorize the concrete changes. Setup renders installed
engineering resource paths into project instructions, validates the default config
and records managed-section ownership. It does not implement application code.
Repeat setup should leave identical output unchanged.

## Skills and invocation

| Skill | Responsibility | Example request |
| --- | --- | --- |
| `sdd-init` | New-project setup or adoption of an existing repository | `Use sdd-init to review setup for this project.` |
| `sdd-define` | Shared specs, optional epics, explicitly tracked tickets and planning | `Use sdd-define ticket for this tracked change.` |
| `sdd-implement` | One bounded implementation with useful tests and verification | `Use sdd-implement to fix the retry behavior.` |
| `sdd-audit` | Code review, integration audit or independent root-cause diagnosis | `Use sdd-audit to diagnose this failing test.` |
| `sdd-deliver` | Authorized scoped commit, push and PR delivery after verification | `Use sdd-deliver to commit this verified change.` |

In Codex, explicit skill syntax is `$sdd-init` (substitute the desired skill).
In Claude Code, use `/sdd-init`. Copilot's documented chat/CLI skill syntax uses
`/sdd-init`; verify discovery in the selected surface. In Cursor, invoke the
discovered skill by name in chat. Devin invocation remains to be validated.
These are agent invocations, not shell commands. `sdd-define` route selectors
such as `ticket`, `spec` and `epic` are prompt selectors, not additional CLI or
slash commands.

## Ordinary work and opt-in tracking

Ask for a feature, fix or refactor normally. Project instructions direct the agent
to shared .sdd/beligent/guidance engineering, testing and review guidance even without explicit skill invocation.
The agent scopes the change, adds useful tests, runs relevant checks during
implementation, inspects the final diff and reports actual outcomes and limits.
Missing configuration does not block ordinary authorized code work. Confirm
actual instruction loading in the selected host.

Tracking starts only on explicit intent. Ordinary code, review and delivery
requests keep definition, plans and evidence in chat; they do not create tickets
or follow-up tasks. Ask to track the change or name an existing ticket to
implement. Config `tracking.required_for` lists kinds of change the assistant
flags before editing.

Tracked work becomes done when agreed work and every required check pass at the
current revision and implementation snapshot. Failed, blocked, unrun or stale
required checks keep it open. Done is final: audit is optional and read-only, and
a later fix is ordinary work or a new ticket. Git delivery has its own state and
permissions and does not gate ticket done.

The [runnable fixture](examples/workflow-fixture/README.md) demonstrates a direct
regression fix, standalone ticket, epic/shared spec, failed required check and
post-close audit. Run `node examples/workflow-fixture/run-scenarios.mjs`.

## Folder structure

Framework source repository:

```text
skills/
  sdd-init/           # setup/adoption, configuration and instruction templates
  sdd-define/         # definition/planning, governance, record contract and templates
  sdd-implement/      # engineering, testing and selected technology guidance
  sdd-audit/          # review and diagnosis
  sdd-deliver/        # scoped Git delivery policy
schema/
  config.schema.json # the only configuration schema (beligent-sdd/config/v2)
src/
  cli/               # optional sdd diagnostic and usage commands
  validation/        # config, record, framework and release checks
  packaging/         # shared-resource sync and read-only selected-host plans
  usage/             # local numeric usage parsing and aggregation
scripts/             # npm package allowlist check
examples/
  workflow-fixture/   # runnable direct/tracked/blocked/audit scenarios
tests/               # tooling, packaging, safety and artifact validation tests
docs/                # architecture, lifecycle, integration and maintenance
.github/workflows/   # validation CI; no publishing
package.json         # authoritative release version and npm commands
package-lock.json    # pinned dependencies and package-version metadata
dist/                # generated CLI build; ignored by Git
```

Each skill has `SKILL.md`, runtime `references/`, optional template `assets/`, and
`PACKAGED.json` identifying generated shared resources. Edit canonical sources
registered in `src/packaging/sync-assets.ts`, then synchronize copies.

A configured consumer project may contain:

```text
.agents/skills/sdd-*/  # example Codex/Copilot copy location; host paths vary
.claude/skills/sdd-*/  # example Claude copy location when selected
.sdd/beligent/
  config.json         # project-owned v2 configuration
  guidance/           # engineering/testing/review and selected stack rules
  tickets/            # on demand, for explicitly tracked work
  epics/              # on demand, optional grouping
  specs/              # on demand, optional shared behavior
  setup-state.json    # integration ownership/hashes; separate state format
  usage.jsonl         # optional, only after an explicit usage import
AGENTS.md             # shared engineering guidance and project instructions
CLAUDE.md             # optional Claude import adapter
.github/
  copilot-instructions.md # optional Copilot bootstrap
skills-lock.json      # provenance maintained by the external installer
```

Record directories are fixed and created only with their first record; ordinary
code work creates none of them. See the [record contract](skills/sdd-define/references/records.md).
Setup state and usage have their own format markers, independent of the configuration.

## Optional CLI commands

Node.js 22+ is required for npm tooling. For a published package, invoke commands
with `npx @beligent/sdd-framework <command>`; pin the published version when needed.
The skill installer takes a Git/local source, not the npm package name.

| CLI command | Purpose / writes |
| --- | --- |
| `validate [project-path] [--since <ref>] [--snapshot <TICKET-ID>]` | Validate config, records and closure evidence; `--since` enforces final states and revisions against a Git revision; read-only |
| `snapshot [project-path]` | Print the implementation snapshot to record before closing a ticket; read-only |
| `doctor [project-path]` | Inspect config, pre-v2 leftovers and duplicate/missing skills; read-only |
| `version` | Print the version from `package.json` |
| `usage report [--json]` | Summarize existing local usage; read-only |
| `usage footer --agent <codex\|claude> --skill <name> --file <path>` | Format exact usage from host output; no store write |
| `usage import --agent <codex\|claude> --skill <name> --file <path>` | Explicitly append deduplicated numeric usage to the local store |

Examples for a published package:

```sh
npx @beligent/sdd-framework validate
npx @beligent/sdd-framework doctor /path/to/target-project
npx @beligent/sdd-framework version
npx @beligent/sdd-framework usage report --json
```

To use this checkout before publication, build it and run the local CLI:

```sh
npm ci
npm run build
node dist/cli/index.js version
node dist/cli/index.js validate /path/to/target-project
node dist/cli/index.js doctor /path/to/target-project
```

The CLI does not install skills, initialize/adopt a project or execute development
workflows. Exact usage import is opt-in and stores no prompt/tool content.
See [CLI details](docs/cli.md), [customization](docs/customization.md),
[architecture](docs/architecture.md), [lifecycle](docs/lifecycle.md),
[artifact model](docs/artifact-model.md), and the runnable
[workflow fixture](examples/workflow-fixture/README.md).

## Maintainer commands

Run from the framework source root after `npm ci`:

| Command | Purpose |
| --- | --- |
| `npm run build` | Compile optional tooling into `dist/` |
| `npm run typecheck` | Check TypeScript without emitting files |
| `npm run lint` | Lint source, scripts and tests |
| `npm test` | Run the behavioral suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run sync:assets` | Update generated resources from canonical sources |
| `npm run sync:assets -- --check` | Check packaged-resource drift without writes |
| `npm run validate:framework` | Validate five skills, templates, links and example graph |
| `npm run check:version` | Compare package version with both lockfile entries |
| `npm run validate:package` | Build and check `npm pack --dry-run` contents; no publishing |

Before submitting changes, run typecheck, lint, tests, asset drift, framework,
version and package validation. See [validation](docs/validation.md) for exact
checks and their limits. Deterministic checks do not certify live host behavior.

## Optional specialists

Use one main agent by default. If the selected host has a configured native
specialist/delegation mechanism, optionally assign a React accessibility reviewer
or Python API reviewer a bounded task. Include the relevant criteria, shared
.sdd/beligent/guidance files, scoped diff and expected check/evidence format.
For example: "Review only the changed form against SPEC-001/AC-002; use project
React/accessibility guidance; return findings and executed checks without edits."
Do not auto-create specialists or assume identical host configuration syntax.
Specialist recommendations do not authorize implementation, closure or Git actions.
