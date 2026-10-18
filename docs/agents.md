# Assistant integration

Beligent SDD keeps methodology and workflow logic in portable `SKILL.md` files.
Adapters establish discovery and point to shared project guidance. They do not
duplicate workflows or make instructions a technical enforcement boundary.

The paths below were checked against official documentation on 2026-10-18.
Documented discovery, installer layout validation, and a live assistant smoke
test are separate claims. Live behavior remains pending for any surface not
actually exercised; record product/version and observations when testing it.

The schema accepts assistant identifiers as portable slugs. Current examples
include Codex, Claude Code, GitHub Copilot, and Cursor; projects may record
another compatible assistant without changing the SDD artifact model. The
external installer and each assistant's own discovery rules determine actual
installation support.

Real local `skills@1.7.2` copy installations were exercised for Codex, Claude
Code, and GitHub Copilot separately and together. All six skill directories and
their resource bytes matched source, and runtime Markdown links stayed within
each installed skill. Observed locations were `.agents/skills/` for Codex and
Copilot, and `.claude/skills/` for Claude. A separate default-mode Codex/Claude
install produced six Claude links to shared project skill copies. These checks
establish installation layout and resource completeness; they did not launch
these assistant products or exercise Copilot cloud discovery.

| Assistant/surface | Project instructions | Project skill locations | Explicit invocation |
| --- | --- | --- | --- |
| Codex | Root `AGENTS.md`; applicable nested files refine scope | `.agents/skills/<name>/SKILL.md` | `$skill-name` |
| Claude Code | `CLAUDE.md` or `.claude/CLAUDE.md`; a thin import can read shared `AGENTS.md` | `.claude/skills/<name>/SKILL.md` | `/skill-name` |
| Cursor | `AGENTS.md` and supported scoped rules | `.agents/skills/<name>/SKILL.md` or `.cursor/skills/<name>/SKILL.md`, depending on configuration | Invoke the discovered skill in chat |
| Copilot in VS Code | `.github/copilot-instructions.md` or `AGENTS.md`, subject to selected harness/settings | `.github/skills/`, `.claude/skills/`, `.agents/skills/` | Select `/skill-name` in chat |
| Copilot CLI | `.github/copilot-instructions.md`, `AGENTS.md`, `CLAUDE.md`, and other documented formats | `.github/skills/`, `.claude/skills/`, `.agents/skills/` | Include `/skill-name` in the prompt |
| Copilot cloud agent | Committed repository instructions and supported scoped guidance | Committed supported project skill directories | Name the relevant skill in the delegated task; confirm observed loading |

The framework source folder `skills/` is packaging input, not an automatically
discovered installation location. The copy-based baseline in
[installation](installation.md) places skills in assistant locations. Existing
discovery settings can affect loading. Automatic relevance matching does not
guarantee a skill will be invoked for every suitable prompt.

## Codex

Use `AGENTS.md` as shared project instructions and `.agents/skills` for project
skills. Personal skill locations and configured skill lists are outside the
project installation; preserve them. Explicit `$init-project`, `$adopt-project`,
or another installed skill name lets a smoke test establish actual use.
See the official [Agent Skills guide](https://learn.chatgpt.com/docs/build-skills)
and [AGENTS.md guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

## Claude Code

The default thin adapter at root `CLAUDE.md` imports `@AGENTS.md`. If adoption
uses an existing `.claude/CLAUDE.md`, the relative import is `@../AGENTS.md`.
Preserve existing Claude guidance and reuse an equivalent import when present.
An ordinary sentence asking Claude to read a file does not provide the same
loading guarantee as a supported import.

Direct `AGENTS.md` loading is documented from Claude Code v2.1.277, normally only
when no project `CLAUDE.md` or `CLAUDE.local.md` exists in the working directory
or its ancestors. Older sessions and some configurations need the import; do not
assume every version discovers the same files. Personal `~/.claude/skills`
installations do not establish cloud availability; committed project skills do.
These differences are documented in [Claude instruction loading](https://code.claude.com/docs/en/memory)
and [Claude skills](https://code.claude.com/docs/en/skills).

## GitHub Copilot

Keep a short `.github/copilot-instructions.md` bootstrap when needed, linking
shared `AGENTS.md` and project config. Copilot CLI documents immediate `@path`
inclusion, but VS Code documentation recommends Markdown references. The baseline
adapter uses Markdown and asks Copilot to read the shared files; verify that
behavior in the intended surface instead of claiming identical import semantics.

VS Code behavior depends on the selected harness and settings. Copilot CLI's
`/instructions` command reports discovered instruction files. GitHub's current
skills documentation includes VS Code, CLI, cloud agent, and other surfaces; this
framework's initial target matrix is limited to those listed above. Local
installation cannot demonstrate that cloud agent received skills or instructions;
commit the intended project resources, delegate a representative task, and
inspect its results separately.

Official references: [Copilot skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills),
[VS Code skills](https://code.visualstudio.com/docs/agent-customization/agent-skills),
[VS Code instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions),
[CLI instructions](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions),
and [CLI skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills).

Cursor and other Agent Skills-compatible tools can use the same portable skill
packages when their configured discovery paths support them. Only Codex, Claude
Code, and Copilot installation layouts have been exercised in this repository;
confirm the target agent's documented paths and run a fresh-session smoke test.

## Representative smoke test

Use a disposable target and one selected assistant. Install copied skills, open a
fresh session, invoke `init-project`, inspect the reviewed proposal, authorize
setup, and verify the config/instruction result. Repeat setup and compare bytes.
Then invoke `define-work` against the configured overview and ask for a draft
ticket: confirm the selected profile and artifact paths were read without
claiming implementation approval. Test adoption separately with existing
instructions, specifications, and a backlog. Record actual results and leave
unavailable surfaces pending.
