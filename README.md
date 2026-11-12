# Beligent SDD

Beligent SDD gives your coding assistant a shared engineering playbook: how to
understand a change, implement it, test it, review it and deliver it. The
assistant does the engineering work; Beligent supplies the instructions and
tools that make that work consistent and reviewable.

It is deliberately lightweight. Five Agent Skills carry the method, a ticket is
a single Markdown file in your repository, and a small CLI installs the skills
and validates the tickets. There is no server, account, database or telemetry.

## Who it is for

- **Solo developers** who want an AI assistant to work from clear requirements
  and prove its work with real checks, without adopting a process tool.
- **Product engineers** who take a feature from intent to deployment: define
  it, let the assistant implement it, review the evidence and ship it.
- **Small teams** who want AI-written changes to arrive with the same structure
  every time: requirements, acceptance criteria, recorded checks and a clean
  commit.

It works with Codex, Claude Code, GitHub Copilot and Cursor, and with any
codebase. Stack guides are included for React with TypeScript, Next.js,
Node.js, Python and FastAPI.

## Quick start

Requires Node.js 22 or later.

1. Preview, then install, in your project root:

   ```sh
   npx @beligent/sdd-framework install --host claude-code --stack nextjs
   npx @beligent/sdd-framework install --host claude-code --stack nextjs --apply
   ```

2. Open your assistant at the project root and run
   `/sdd-init Inspect the project and propose its checks.` It reads your
   scripts and CI and proposes the project checks; nothing is written before you
   approve.
3. Work:

   ```text
   /sdd-define Users can export their invoices as CSV
   /sdd-implement TICKET-001
   /sdd-deliver TICKET-001
   ```

## How it works

### Commands

The framework runs only when a prompt starts with one of its commands (`$`
instead of `/` in Codex). Each command authorizes only its own workflow.

| Command                     | Does                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `/sdd-init`                 | Reviewed setup or adoption of a repository; writes nothing before you approve the plan       |
| `/sdd-define <request>`     | Writes one ticket with context, requirements, testable criteria and an out-of-scope list     |
| `/sdd-implement TICKET-042` | Implements the ticket, runs and records its checks, sets done or blocked; never commits      |
| `/sdd-audit <request>`      | Read-only review of a ticket or diff, a setup audit, or a failure diagnosis                  |
| `/sdd-deliver TICKET-042`   | Asks whether to delete the finished ticket, then commits; pushes or opens a PR only if asked |

Implementing never commits, and only `/sdd-deliver` changes Git state. The
skills are in [skills/](skills/); each `SKILL.md` is the procedure the agent
follows.

### Without a command

Ask for a feature, fix or refactor normally. The assistant works as an ordinary
coding agent and does what you ask, even right after a command in the same
conversation and while tickets are open. It applies only the stack guides your
config selects and never reads, writes or asks about tickets.

That work stays in the working tree. A later `/sdd-implement` keeps it and runs
the ticket's checks against the whole final diff, and `/sdd-deliver` commits it
with the ticket's work unless you name paths to leave out.

### Tickets

A ticket is one bounded piece of AI work in `.sdd/beligent/tickets/TICKET-NNN.md`,
created by `/sdd-define`. You own the feature, its completeness and its
acceptance; a ticket covers only the assistant's part of it. A feature too
large for one session becomes several tickets linked by `depends_on`.

| Status        | Meaning                                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `todo`        | Defined, not started                                                                                                              |
| `in-progress` | Being implemented, or a check failed that the agent can still fix                                                                 |
| `blocked`     | The agent cannot continue: a check cannot run, a dependency is open, or a decision is yours. `blocked_reason` says what is needed |
| `done`        | Every criterion has a passing check, every listed or `**` project check passed and no check is failing. The agent sets it         |
| `cancelled`   | Dropped on your decision, with `cancelled_reason`                                                                                 |

- **Checks.** Each project check names the files it covers in `paths`, so a
  frontend ticket runs frontend checks and a backend ticket backend checks. A
  check with `paths: ["**"]`, such as a secrets scan, applies to every ticket.
  The agent iterates with focused tests and runs the listed checks once, on the
  final diff. A manual check records a `procedure` and what was `observed`.
- **Improving done work.** `/sdd-implement TICKET-042 <improvement>` reopens a
  done ticket, adds a criterion when needed, and sets `done` again only when
  every criterion passes. Cancelled tickets are final.
- **Clean history.** Before committing, `/sdd-deliver` asks whether to delete a
  finished ticket and, if so, puts its title and criteria in the commit
  message. Requirements stay in Git history, and ticket IDs are never reused.

`sdd validate` enforces the structure: requirements present, criteria filled,
dependencies valid, and no `done` without passing checks. The normative rules
are the [ticket contract](skills/sdd-define/references/records.md) and the
[shared contract](skills/sdd-define/references/shared/governance.md).

## Install

```sh
npx @beligent/sdd-framework install --host codex --stack nextjs          # dry run: prints the plan
npx @beligent/sdd-framework install --host codex --stack nextjs --apply  # writes it

# Codex and Claude Code in a monorepo with a FastAPI backend and a Next.js frontend
npx @beligent/sdd-framework install --host codex,claude-code --stack python,fastapi,nextjs,react-typescript,nodejs --apply
```

Install, reinstall and upgrade are the same command. To upgrade, ask npx for the
newest version explicitly: `npx @beligent/sdd-framework@latest install --apply`.
You can also install the CLI globally with `npm install -g @beligent/sdd-framework`
and run `sdd install …`.

- `--host`: one or more of `codex`, `claude-code`, `github-copilot`,
  `github-copilot-cloud`, `cursor`, repeated or comma-separated.
- `--stack`: one or more of `react-typescript`, `nextjs`, `nodejs`, `python`,
  `fastapi`; select only the stacks the project uses.
- `--name`: project name for a new config (default: the directory name).
- Without `--host` and `--stack`, the values in the existing config are reused.

### What install writes

| Destination                                                                             | Behavior                                                                                                                      |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| The five skill folders in each selected skill root                                      | Replaced with the packaged files; files no longer in the package are removed from those folders                               |
| `.sdd/beligent/guidance/<stack>.md` for each selected stack                             | Replaced with the packaged version                                                                                            |
| `AGENTS.md`; `CLAUDE.md` for Claude Code; `.github/copilot-instructions.md` for Copilot | Only the text between `<!-- beligent-sdd:start -->` and `<!-- beligent-sdd:end -->` is replaced, or appended once when absent |
| `.sdd/beligent/config.json`                                                             | Created only when missing; an existing valid config is kept, an invalid or earlier one stops the install                      |
| Tickets, your own files in `guidance/`, other skills, everything else                   | Never written                                                                                                                 |

The dry run lists every change. Broken markers, linked paths, collisions and
paths outside the project stop the whole install before any write, and a repeat
run writes nothing. When a root `CLAUDE.md` is absent but `.claude/CLAUDE.md`
exists, the Claude section goes there. Files from versions before 1.0
(`.beligent/`, earlier skill names, `epics/` or `specs/` folders) are reported,
never deleted.

A configured project looks like this:

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

| Setting        | Effect                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `hosts`        | Assistants to integrate                                                                                                                                |
| `project.name` | Display name                                                                                                                                           |
| `stacks`       | Stack guides applied to code requests, with or without a command. Project conventions override generic stack advice                                    |
| `checks`       | Project commands with the `paths` they cover. A ticket must pass its `checks_required` and every `**` check. A check without `paths` is yours to run |

Unknown keys and configurations from earlier versions are rejected with a
message that explains what to do. After changing hosts or stacks, rerun
`sdd install`; the installer never rewrites the config. Keep project rules in
`AGENTS.md` outside the Beligent SDD section, never in the installed skill
copies.

## Supported assistants

| Assistant                      | `--host`               | Skill root                   | Start a command                                                         |
| ------------------------------ | ---------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| Codex in VS Code and CLI       | `codex`                | `.agents/skills/`            | `$sdd-implement TICKET-042`, or pick from `/skills`                     |
| Claude Code in VS Code and CLI | `claude-code`          | `.claude/skills/`            | `/sdd-implement TICKET-042`                                             |
| Copilot in VS Code             | `github-copilot`       | `.agents/skills/`            | `/` in chat, then `sdd-implement`                                       |
| Copilot CLI                    | `github-copilot`       | `.agents/skills/`            | `/skills list`, then a prompt starting with `/sdd-implement TICKET-042` |
| Copilot cloud agent            | `github-copilot-cloud` | `.agents/skills/`, committed | Assign a task starting with `/sdd-implement TICKET-042`                 |
| Cursor Agent                   | `cursor`               | `.agents/skills/`            | `/` in Agent chat, then `sdd-implement`                                 |

Skills load only as commands. Claude Code, VS Code Copilot and Cursor honor
`disable-model-invocation: true` in each `SKILL.md`; Codex honors
`policy.allow_implicit_invocation: false` in each skill's `agents/openai.yaml`.
Copilot CLI and the cloud agent document no such setting, so there the skill
descriptions and the `AGENTS.md` section carry that rule.

- **Copilot in VS Code:** the Copilot harness documents `.github/skills/`; the
  Local harness also reads `.agents/skills/` and `.claude/skills/`.
- **Copilot cloud agent:** commit the installed files first. Merging the draft
  PR is always your decision.
- **Cursor:** reads the root `AGENTS.md` automatically. `.cursor/rules/` stays yours.
- **Mixed installs:** `claude-code` with a Copilot host or Cursor writes both
  `.claude/skills/` and `.agents/skills/`. Those hosts may list each skill twice;
  the copies are identical, and `sdd doctor` reports it.

Sources: [Codex skills](https://learn.chatgpt.com/docs/build-skills),
[Claude Code skills](https://code.claude.com/docs/en/skills),
[VS Code agent skills](https://code.visualstudio.com/docs/agent-customization/agent-skills),
[Copilot CLI skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills),
[Copilot cloud agent skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills),
[Cursor skills](https://cursor.com/docs/context/skills).

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

You don't need `sdd` installed: the skills run it as `sdd` when it exists,
otherwise from the project's dependencies, otherwise through
`npx @beligent/sdd-framework@latest` for that run only. They never install it.
Only `install --apply` and `usage import` write files. `validate` and `doctor`
exit 1 on errors.

**Token usage** is optional and stays on your machine. Capture the host's
structured output, for example `codex exec --json '…' > run.jsonl` or
`claude -p --output-format stream-json --verbose '…' > run.jsonl`, then run
`sdd usage import --agent codex --skill sdd-implement --file run.jsonl`. The
store, `.sdd/beligent/usage.jsonl` by default, keeps only numbers, agent, skill,
optional task, timestamp and a deduplication hash; never prompts, responses or
tool output. Add it to `.gitignore`.

## Design choices

- **Your judgment stays in charge.** The assistant implements and records
  evidence; you decide what is accepted. `sdd validate` checks structure and
  declared evidence, not whether the requirements capture your intent or the
  tests exercise them, so review the work as you would any change.
- **Explicit over automatic.** Nothing runs unless you type a command, and Git
  changes happen only through `/sdd-deliver`.
- **Plain files.** Methodology lives in Markdown you can read and diff;
  tickets live in your repository; nothing is hosted.
- **One main agent.** If your assistant supports specialists, you may give one
  a bounded task (the ticket criteria, the stack guide, the scoped diff), but
  specialists never replace a command or authorize Git actions.

## Contributing

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

Shared skill resources have one canonical source, registered in
`src/packaging/sync-assets.ts`. Edit the canonical file, run
`npm run sync:assets`, and never edit a generated copy; each skill's
`PACKAGED.json` lists its copies. Run all of these before submitting a change:

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

The [walkthrough](examples/workflow-fixture/README.md) shows the whole flow
against the real CLI: `npm run build && node examples/workflow-fixture/walkthrough.mjs`.

`package.json` is the version authority. CI validates but never publishes;
releases are published manually after the checks pass. See the
[changelog](CHANGELOG.md) for release notes.

## License

See [LICENSE](LICENSE).
