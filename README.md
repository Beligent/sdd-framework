# Beligent SDD framework

Beligent's SDD framework supports AI-assisted code work with well-defined tickets, started only
by explicit commands. Five Agent Skills carry the method; a small TypeScript CLI
installs them for your coding assistant, validates project configuration and
tickets, and accounts for explicitly imported local token usage.

The framework is a support, not a mandatory route. The developer owns the
feature, its completeness and its acceptance; a ticket covers only the AI's part
of it. This README and the skills themselves are the complete documentation.

## Status

This version is an experiment. There is no guarantee about quality or security.
It is a clean break with no backward compatibility.

## How it works

### Commands

The framework runs only when a prompt starts with one of its commands. Codex uses
`$` instead of `/`. Plain language never starts it, even when it names a ticket.

| Command                     | Does                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `/sdd-init`                 | Reviewed setup or adoption of a repository; writes nothing before you approve the plan       |
| `/sdd-define <request>`     | Writes one ticket with context, requirements, testable criteria and an out-of-scope list     |
| `/sdd-implement TICKET-042` | Implements the ticket, runs and records its checks, sets done or blocked; never commits      |
| `/sdd-audit <request>`      | Optional read-only review of a ticket or diff, a setup audit, or a failure diagnosis         |
| `/sdd-deliver TICKET-042`   | Asks whether to delete the finished ticket, then commits; pushes or opens a PR only if asked |

Each command authorizes only its own workflow. Implementing never commits, and
only `/sdd-deliver` changes Git state. The skills are in [skills/](skills/); each
`SKILL.md` is the procedure the agent follows.

### Without a command

Ask for a feature, fix or refactor normally. The agent works as an ordinary
coding agent and applies only the stack guides your config selects, from
`.sdd/beligent/guidance/`. It does not read or write tickets, except as below.

If such a request continues an open ticket (`todo`, `in-progress` or `blocked`),
because it names the ticket or continues ticket work from the conversation, the
agent stops and asks whether to keep using the framework. It suggests the same
request starting with the command, for example `/sdd-implement TICKET-042 <request>`.

- **Yes:** resend the prompt with the command.
- **No:** the agent sets the ticket to `cancelled` with a reason and names any
  ticket that depends on it. Your code stays; you continue on your own. Delete
  the ticket yourself, or let `/sdd-deliver` ask you before committing.

The guard cannot recognize a fresh session that continues the work without
naming the ticket; start such a request with `/sdd-implement TICKET-042`.

Done and cancelled tickets are closed, so related work without a command is just
ordinary work.

### Tickets

A ticket is one bounded piece of AI work in `.sdd/beligent/tickets/TICKET-NNN.md`,
created only by `/sdd-define`.

`sdd validate` rejects a ticket without a Requirements section or with an empty
criterion.

A manual check uses `procedure` and `observed` instead of `command`. Outcomes are
`pass`, `fail`, `blocked` and `not-run`. The agent records results from the
final diff and replaces earlier ones after a later change.

Each config check names the files it covers in `paths`. `/sdd-define` lists in
the ticket's `checks_required` the checks matching the files the work touches,
so a frontend ticket runs frontend checks and a backend ticket backend checks.
A check with `paths: ["**"]`, such as a secrets scan, applies to every ticket.
A check without `paths` is yours to run. The agent iterates with focused tests
and runs the listed checks once, on the final diff.

A feature too large for one implementation session becomes several tickets;
each lists the tickets it builds on in `depends_on`, and `/sdd-implement` stops
while one of them exists and is not done.

| Status        | Meaning                                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `todo`        | Defined, not started                                                                                                              |
| `in-progress` | Being implemented, or a check failed that the agent can still fix                                                                 |
| `blocked`     | The agent cannot continue: a check cannot run, a dependency is open, or a decision is yours. `blocked_reason` says what is needed |
| `done`        | Every criterion has a passing check, every listed or `**` project check passed and no check is failing. The agent sets it         |
| `cancelled`   | Dropped on your decision, with `cancelled_reason`                                                                                 |

Done and cancelled tickets are never reopened or edited: a related change is a
new ticket, or a correction outside the framework, for example in a follow-up
commit. Deleting a ticket is your decision: before committing, `/sdd-deliver`
asks whether to delete a done or cancelled ticket and, if so, puts its title and
criteria in the commit message, so the repository stays clean and the
requirements stay in Git history. A `depends_on` entry for a deleted ticket
counts as satisfied, and new IDs take the highest ID in the folder or Git
history plus one, so a committed ID is never reused.

The normative rules are the [ticket contract](skills/sdd-define/references/records.md)
and the [shared contract](skills/sdd-define/references/shared/governance.md).

## Install

Requires Node.js 22 or later. The CLI does not need Git.

### From npm

```sh
npx @beligent/sdd-framework install --host codex --stack nextjs          # dry run: prints the plan
npx @beligent/sdd-framework install --host codex --stack nextjs --apply  # writes it

# Codex and Claude Code in a monorepo with a FastAPI backend and a Next.js frontend
npx @beligent/sdd-framework install --host codex,claude-code --stack python,fastapi,nextjs,react-typescript,nodejs --apply
```

npx may reuse a version it downloaded earlier. To upgrade a project, ask for the
newest one explicitly: `npx @beligent/sdd-framework@latest install --apply`.

Or install the CLI globally with `npm install -g @beligent/sdd-framework` and
run `sdd install …` in each project.

### From a local checkout

```sh
cd /path/to/beligent-sdd-framework
npm ci && npm run build
rm -rf /tmp/beligent-pack && mkdir -p /tmp/beligent-pack && npm pack --pack-destination /tmp/beligent-pack

cd /path/to/target-project
npx --yes --package /tmp/beligent-pack/beligent-sdd-framework-*.tgz -- sdd install --host codex --stack nextjs --apply
```

To type plain `sdd`, run `npm install -g /tmp/beligent-pack/beligent-sdd-framework-*.tgz` once.

### Options

- `--host`: one or more of `codex`, `claude-code`, `github-copilot`,
  `github-copilot-cloud`, `cursor`; repeat it or pass a comma-separated list.
  Other names are ignored with a note.
- `--stack`: one or more of `react-typescript`, `nextjs`, `nodejs`, `python`,
  `fastapi`, repeated or comma-separated; select only the stacks the project uses.
- `--name`: project name for a new config (default: the directory name).
- Without `--host` and `--stack`, the values in the existing config are reused.
  Install, reinstall and upgrade are the same command.

### What install writes

| Destination                                                                             | Behavior                                                                                                                      |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| The five skill folders in each selected skill root                                      | Replaced with the packaged files even if edited; files no longer in the package are removed from those folders                |
| `.sdd/beligent/guidance/<stack>.md` for each selected stack                             | Replaced with the packaged version even if edited                                                                             |
| `AGENTS.md`; `CLAUDE.md` for Claude Code; `.github/copilot-instructions.md` for Copilot | Only the text between `<!-- beligent-sdd:start -->` and `<!-- beligent-sdd:end -->` is replaced, or appended once when absent |
| `.sdd/beligent/config.json`                                                             | Created only when missing; an existing valid config is kept, an invalid or earlier one stops the install                      |
| Tickets, your own files in `guidance/`, other skills, everything else                   | Never written                                                                                                                 |

The dry run lists every change. Duplicate or broken markers, symlinked or
hard-linked paths, directory collisions and paths outside the project are
conflicts that stop the whole install before any write. A repeat writes
nothing; after a failed write, rerun the same command. No setup state is kept.
When a root `CLAUDE.md` is absent but `.claude/CLAUDE.md` exists, the Claude
section goes there instead. Guidance files from earlier versions
(`engineering.md`, `testing.md`, `review.md`, `shared/`), earlier skill names,
`.beligent/` and `epics/` or `specs/` folders are reported, never deleted.

A configured project then looks like this:

```text
AGENTS.md              # your text plus the Beligent SDD section
CLAUDE.md              # Claude Code: Beligent SDD section importing @AGENTS.md
.github/copilot-instructions.md   # Copilot: Beligent SDD section
.agents/skills/sdd-*/  # managed: Codex, Copilot, Cursor
.claude/skills/sdd-*/  # managed: Claude Code
.sdd/beligent/
  config.json          # yours from now on
  guidance/nodejs.md   # managed stack guide; add your own files beside it
  tickets/             # created by the first /sdd-define
  usage.jsonl          # only after an explicit usage import
```

### Finish setup

Start a fresh session in your assistant at the project root and type:

> /sdd-init Inspect the project and propose its checks.

`/sdd-init` reads your scripts and CI and proposes `checks` for review. For an
existing codebase it also inventories instructions, tests, conventions and
existing backlog, and proposes reuse rather than moving anything. After you
approve, it applies the plan and edits the config.

### Configuration

`.sdd/beligent/config.json`, described by [schema/config.schema.json](schema/config.schema.json):

```json
{
  "schema": "beligent-sdd/config",
  "hosts": ["codex"],
  "project": { "name": "demo" },
  "stacks": ["nodejs"],
  "checks": [
    { "id": "web-test", "command": "npm test", "paths": ["app/**", "site/**"] },
    { "id": "api-test", "command": "pytest", "paths": ["backend/**"] },
    { "id": "secrets", "command": "gitleaks detect", "paths": ["**"] },
    { "id": "build", "command": "npm run build" }
  ]
}
```

| Setting        | Effect                                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `hosts`        | Assistants to integrate. Unsupported names are ignored                                                                  |
| `project.name` | Display name                                                                                                            |
| `stacks`       | Stack guides applied to code requests, with or without a command. Project conventions override generic stack advice     |
| `checks`       | Project commands with the `paths` they cover. A ticket must pass its `checks_required` and every `**` check, recorded with this command |

Unknown keys and earlier configurations are rejected. Changing hosts or stacks
means rerunning `sdd install`; the installer never rewrites the config. Keep
project rules in `AGENTS.md` outside the Beligent SDD section or in your own files,
never in the installed skill copies.

### Skills only

The external `skills` CLI can copy the skill folders from a Git source
(`npx skills@1.7.2 add <git-source> --skill '*' --agent codex --copy -y`). It does
not write the config, the stack guides or the instruction sections, so the
continuation guard and stack guides are missing until `sdd install` adds them.

## Supported assistants

| Assistant                      | `--host`               | Skill root                   | Start a command                                                         |
| ------------------------------ | ---------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| Codex in VS Code and CLI       | `codex`                | `.agents/skills/`            | `$sdd-implement TICKET-042`, or pick from `/skills`                     |
| Claude Code in VS Code and CLI | `claude-code`          | `.claude/skills/`            | `/sdd-implement TICKET-042`                                             |
| Copilot in VS Code             | `github-copilot`       | `.agents/skills/`            | `/` in chat, then `sdd-implement`                                       |
| Copilot CLI                    | `github-copilot`       | `.agents/skills/`            | `/skills list`, then a prompt starting with `/sdd-implement TICKET-042` |
| Copilot cloud agent            | `github-copilot-cloud` | `.agents/skills/`, committed | Assign a task starting with `/sdd-implement TICKET-042`                 |
| Cursor Agent                   | `cursor`               | `.agents/skills/`            | `/` in Agent chat, then `sdd-implement`                                 |

Paths and starts come from host documentation, checked 2026-11-06 and 2026-11-08.
The installer is tested for every host in disposable projects; **no host has
been verified live yet**.

### Command-only activation

| Assistant                            | How automatic loading is turned off                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| Claude Code, VS Code Copilot, Cursor | `disable-model-invocation: true` in each `SKILL.md`                                        |
| Codex                                | `agents/openai.yaml` in each skill with `policy.allow_implicit_invocation: false`          |
| Copilot CLI and cloud agent          | Not documented; the skill descriptions and the `AGENTS.md` section are the only protection |

Every packaged skill carries both settings; `npm run validate:framework` fails
if one is missing.

### Host notes

- **Copilot in VS Code:** the Copilot harness documents `.github/skills/`; the
  Local harness also reads `.agents/skills/` and `.claude/skills/`. Name the
  harness when testing. If the Copilot harness does not list the skills, map
  the Copilot hosts to `.github/skills/`.
- **Copilot cloud agent:** commit the installed files first. GitHub documents
  that the agent picks skills from the prompt; a command at the start is
  untested there. Merging the draft PR is always your decision.
- **Cursor:** reads the root `AGENTS.md` automatically. `.cursor/rules/` stays yours.
- **Mixed installs:** `claude-code` with a Copilot host or Cursor writes both
  `.claude/skills/` and `.agents/skills/`. Those hosts also read `.claude/skills/`
  and may list each skill twice; the install plan and `sdd doctor` warn about it,
  and the copies are identical.

Sources: [Codex skills](https://learn.chatgpt.com/docs/build-skills),
[Claude Code skills](https://code.claude.com/docs/en/skills),
[VS Code agent skills](https://code.visualstudio.com/docs/agent-customization/agent-skills),
[Copilot CLI skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills),
[Copilot cloud agent skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills),
[Cursor skills](https://cursor.com/docs/context/skills),
[Codex explicit-only skills](https://github.com/zanellig/skills/issues/6).

### Live test in a host

Use a disposable repository and a fresh session per step, and record the host,
version, date and what you observed.

1. `sdd install --host <id> --apply`; a repeat dry run reports no changes.
2. The five skills appear in the command list; `/sdd-init` proposes and writes nothing before approval.
3. A small change without a command loads no skill, applies the stack guide and creates no ticket.
4. `/sdd-define`, then `/sdd-implement`: requirements, recorded checks, no `done` while a check fails.
5. In a new session, continue the open ticket without a command: the agent asks and suggests the command; "no" sets the ticket to `cancelled` and keeps it.
6. `/sdd-audit` a done ticket after a regression: it reports the failure, runs only config checks or approved commands, and edits nothing.
7. `/sdd-deliver` with a disposable remote: it proposes removing the ticket, stages exactly the change and pushes only when asked.

## CLI reference

| Command                                                                                            | Purpose                                                                                  |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `install [project-path] --host <id> [--stack <id>] [--name <name>] [--apply]`                      | Print the install plan; with `--apply`, write it                                         |
| `validate [project-path]`                                                                          | Check config and tickets: requirements, criteria, checks, dependencies and the done rule |
| `doctor [project-path]`                                                                            | Report config status, earlier leftovers and missing or duplicate skills                  |
| `usage footer --agent <codex\|claude> --skill <name> --file <path>`                                | Print exact token usage from a host's structured output                                  |
| `usage import --agent <codex\|claude> --skill <name> --file <path> [--task <id>] [--store <path>]` | Append deduplicated numeric usage to the local store                                     |
| `usage report [--store <path>] [--json]`                                                           | Summarize recorded usage by skill                                                        |
| `version`                                                                                          | Print the version                                                                        |

Only `install --apply` and `usage import` write files. `validate` and `doctor`
exit 1 on errors; `doctor` exits 0 when it finds only warnings.

**Token usage** is optional and local. Capture the host's structured output, for
example `codex exec --json '…' > run.jsonl` or
`claude -p --output-format stream-json --verbose '…' > run.jsonl`, then run
`sdd usage import --agent codex --skill sdd-implement --file run.jsonl`. The
store, `.sdd/beligent/usage.jsonl` by default, keeps only numbers, agent, skill,
optional task, timestamp and a deduplication hash; never prompts, responses or
tool output. Linked stores are rejected; add the file to `.gitignore`.

## Optional specialists

Use one main agent by default. If your host supports configured specialists,
you may give, for example, a React accessibility reviewer a bounded task: the
ticket criteria, the stack guide, the scoped diff and the expected evidence.
Specialists never replace a command or authorize Git actions.

## Limits

`sdd validate` checks structure and declared evidence. It cannot prove that the
requirements capture your intent, that tests exercise the criteria or that
commands really ran; you review the work. Installation checks do not prove that
a host loads the skills or honors command-only activation; test that live.

## Contributing

### Repository layout

```text
skills/            # the five skills: SKILL.md, references/, assets/, agents/openai.yaml, PACKAGED.json
schema/            # config.schema.json, the only configuration schema
src/cli/           # the sdd command
src/validation/    # config, ticket and framework validation
src/packaging/     # inventory, host table, installer and shared-resource sync
src/usage/         # local usage parsing and aggregation
scripts/           # package allowlist check and external-installer smoke test
examples/          # runnable walkthrough and sample tickets
tests/             # behavioral test suite
```

- `src/packaging/inventory.ts` lists the five skills, the stacks and the earlier
  names that are reported.
- `src/packaging/hosts.ts` maps each `--host` to its skill root, instruction
  files and start hint; hosts sharing a root share one copy.
- `src/packaging/install.ts` plans and applies `sdd install` as described above.
- Shared skill resources have one canonical source, registered in
  `src/packaging/sync-assets.ts`. Edit the canonical file, run
  `npm run sync:assets`, and never edit a generated copy; each skill's
  `PACKAGED.json` lists its copies.

### Checks

Run all of these before submitting a change:

```sh
npm ci
npm run typecheck
npm run lint
npm test                          # includes the walkthrough in a disposable Git project
npm run sync:assets -- --check    # generated copies match their sources
npm run validate:framework        # skills, command-only settings, templates, links, sample tickets
npm run check:version             # package.json and package-lock.json agree
npm run validate:package          # build and check npm pack --dry-run contents
```

The [walkthrough](examples/workflow-fixture/README.md) can also be run directly
with `npm run build && node examples/workflow-fixture/walkthrough.mjs`.

### Releasing

`package.json` is the version authority; update the lockfile with it and keep no
separate `VERSION` file. CI validates but never publishes; publishing is a
manual maintainer step after the checks pass. Users upgrade by rerunning
`sdd install --apply` from the newer package and reviewing the dry run first.
