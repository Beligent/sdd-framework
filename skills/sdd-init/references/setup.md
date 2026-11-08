# Host installation and setup

Canonical source: `skills/sdd-init/references/setup.md`. The deterministic
installer in the framework CLI applies the mechanical writes; `sdd-init` inspects
the project, proposes configuration and adoption choices, and runs the installer.
There is no application scaffolder or workflow runtime.

```sh
sdd install --host codex --stack nextjs           # dry run: prints the plan
sdd install --host codex --stack nextjs --apply
```

Run `sdd` from the framework package the developer installed from: a packed
tarball (`npx --package <path-to-tgz> -- sdd …`) or a registry version that
contains `install` (1.0.0 or later). Ask the developer which when unsure.

Install, reinstall and upgrade are the same command. Without `--host` or
`--stack` the installer uses the hosts and stacks in `.sdd/beligent/config.json`.
The dry run lists every create, replace, remove and section change; `--apply`
writes nothing when the plan has a blocker or conflict.

## Replacement policy

An explicit install request authorizes these writes and no others:

| Destination | Behavior |
| --- | --- |
| Fully managed: the five skill directories under each selected root, and the selected stack guides in `.sdd/beligent/guidance/` (for example `nodejs.md`) | Replaced with the packaged bytes even when edited locally; missing files are recreated; files the package no longer contains are removed from those five skill directories |
| Shared instructions: `AGENTS.md`, plus `CLAUDE.md` (or an existing `.claude/CLAUDE.md`) for Claude Code and `.github/copilot-instructions.md` for Copilot | Only the section from `<!-- beligent-sdd:start -->` to `<!-- beligent-sdd:end -->` is replaced, or appended once when absent. Duplicate, unterminated or misplaced markers are a conflict and the file is left intact |
| Project-owned: `.sdd/beligent/config.json` | Created from [the template](../assets/config.json) when missing, otherwise kept. An invalid or pre-1.0 config blocks the install until the developer fixes or moves it |
| Everything else, including tickets, other files in `guidance/`, other skills and unselected roots | Never written. Guidance files from earlier versions (`engineering.md`, `testing.md`, `review.md`, `shared/`) are reported for the developer to delete |

Destinations resolve from the project root; symlinked or hard-linked paths,
directory collisions and paths outside the project are conflicts. Each file is
written through a temporary sibling and renamed. A repeat with the same inputs
writes nothing. If a write fails, rerun the same command to finish. No
`setup-state.json` or ownership hashes are created or read; an old one is ignored
and left for the developer to delete. Edits belong outside managed files: put
project rules in `AGENTS.md` outside the section or in separate guidance files.

## Hosts and destinations

| `--host` | Surfaces | Skill root | Instruction files | Explicit start |
| --- | --- | --- | --- | --- |
| `codex` | Codex in VS Code and CLI | `.agents/skills` | AGENTS.md | `$sdd-implement TICKET-042` or `/skills` |
| `claude-code` | Claude Code in VS Code and CLI | `.claude/skills` | AGENTS.md, CLAUDE.md importing `@AGENTS.md` | `/sdd-implement TICKET-042` |
| `github-copilot` | Copilot VS Code agent mode and CLI | `.agents/skills` | AGENTS.md, `.github/copilot-instructions.md` | VS Code: `/` in chat. CLI: `/skills list`, then a prompt starting with `/sdd-implement TICKET-042` |
| `github-copilot-cloud` | Copilot cloud agent | `.agents/skills` (committed) | AGENTS.md, `.github/copilot-instructions.md` | Assign a task whose text starts with `/sdd-implement TICKET-042`; GitHub documents that Copilot picks skills from the prompt, not that a command selects one |
| `cursor` | Cursor Agent | `.agents/skills` | AGENTS.md | `/` in Agent chat |

VS Code documents `.agents/skills` for its Local harness; its Copilot harness
lists `.github/skills`, so name the harness when reporting discovery. Hosts
sharing a root share one copy. Copilot and Cursor can also read
`.claude/skills`, so selecting them with Claude Code may list each skill twice;
the copies are identical. Skill roots come from host documentation and are not
live certification.

## Command-only activation

Every skill sets `disable-model-invocation: true` in its frontmatter, which
Claude Code, VS Code Copilot and Cursor honor, and ships `agents/openai.yaml`
with `policy.allow_implicit_invocation: false` for Codex. The skills then run
only when typed as a command. Where a host documents no such setting, the skill
descriptions and the instruction section are the only protection. Without
a command, the instruction section applies only the selected stack guides and
the continuation guard from the [shared contract](shared/governance.md#continuation-guard).

## Inventory and proposal

1. Resolve the project root and read applicable instructions, code, tests,
   conventions, skill roots and `.sdd/beligent/config.json`. Report pre-1.0
   leftovers (`.beligent/`, old skill names, `schema_version` configs, retired
   guidance files, `epics/` or `specs/` folders); there is
   no conversion, and the installer never deletes or rewrites them.
2. Select hosts and only the stack modules the project uses. Propose the real
   test, lint and typecheck commands as config `checks`, marking those every
   ticket must pass as `required`.
3. Run the dry run and present its plan with the proposed config values in chat.
   Point out managed files the developer has edited, since `--apply` replaces
   them, and any conflicts or notes. For an existing project use
   [the adoption plan](../assets/adoption-plan.md). Existing approval for the
   exact install counts.
4. After approval run `--apply`. A freshly created config contains the hosts,
   stacks and project name and no `checks`; write the approved `checks` into
   it as an ordinary reviewed edit afterwards.

## Verify

Run `sdd validate` and `sdd doctor`, then repeat the dry run and confirm it
reports no changes. Compare instruction text outside the section and project
files with the inventory. Report installation results separately from a live
host session: a live test checks that each skill appears in the host's command
list, starts when typed as a command, and does not load for a plain prompt.
Setup does not approve product scope, create tickets, initialize Git or change
application code.
