# Install Beligent SDD

Beligent has two separate distribution paths: portable Agent Skills from Git,
and optional project-diagnostic tooling from npm. The skills contain the
methodology and work with multiple coding agents. The npm command does not
install or configure skills.

## Install skills from GitHub

Run the external installer from the repository that will use Beligent. The
planned public source is `beligent/sdd`; use the actual public GitHub owner and
repository if that location changes.

```sh
cd /path/to/target-project
npx skills@1.7.2 add beligent/sdd \
  --skill '*' \
  --agent codex \
  --copy \
  -y
```

Select the target assistant with `--agent`, for example `claude-code`,
`github-copilot`, or `cursor`. The installer supports additional agents as its
catalog evolves. Check [agent integration](agents.md) for documented
discovery locations and compatibility limits. Install all nine skills with
`--skill '*'`, or select only `init-project` or `adopt-project` for the initial
setup. Install the remaining skills before using the corresponding workflows.

The source repository keeps `skills/` at its root, the collection layout
recognized by `skills@1.7.2`. Each skill directory contains its `SKILL.md` and
all runtime references, templates, and shared resources. The CLI installs the
whole skill directory. Do not install only the entrypoint file.

The `skills` command does not resolve npm package names as skill sources. Use a
Git source with `skills add`; do not run `skills add @beligent/sdd-framework`. The current
installer accepts Git sources, local paths, and supported direct file/archive
URLs. npm distribution is for the optional Beligent CLI, not a replacement for
the Git skill collection.

## Configure a new project

After installation, ask the assistant to run `init-project`:

> Use init-project here. Identify the project type, assistants, technologies,
> profile, and artifact paths. Show the setup proposal before applying changes.

The workflow creates project-owned configuration and only approved integration
files. Review the diff and resulting paths. See [the README setup guide](../README.md#set-up-a-project)
and [adoption](adoption.md) for the respective workflows.

## Adopt an existing project

Install `adopt-project` (or all nine skills), then ask it to inventory the
repository and prepare a read-only integration plan. The skill maps existing
architecture, specifications, tickets, test conventions, and assistant
instructions, and recommends reuse of suitable files and paths. It must show
the exact configuration and instruction edits for approval before applying
them. See [adoption details](adoption.md).

## Project files and ownership

The installed and versioned framework content is under the selected agent's
skill directory. Project setup may create or update these project-owned items:

```text
.beligent/config.json
.beligent/setup-state.json
docs/sdd/...
AGENTS.md
CLAUDE.md
.github/copilot-instructions.md
```

The final three are optional adapter files. Existing instruction and `docs/`
content belongs to the project. Workflows inspect it and propose a small
managed section; they do not replace whole files or trees. Configuration and
artifacts remain project-owned across skill updates. See [architecture](architecture.md)
and [maintenance](maintenance.md) for the ownership and update boundaries.

## Optional npm CLI

Install the CLI on demand with Node.js 22 or later:

```sh
npx @beligent/sdd-framework validate
npx @beligent/sdd-framework doctor
```

`validate` checks `.beligent/config.json` and reports errors without changing
files. `doctor` diagnoses config validity, expected artifact paths, and core
skill discovery. It can also inspect another project directory:

```sh
npx @beligent/sdd-framework doctor /path/to/project
```

This CLI does not initialize, adopt, update, or uninstall a project. Those
operations remain in the reviewed Agent Skills workflows or the external skill
installer. The framework does not require Python for installation or ordinary
consumer use.

## Verify discovery

Start a fresh session in the target assistant, explicitly invoke the installed
`init-project` or `adopt-project` skill, and confirm it reads the project. Skill
folder installation is testable separately from behavior inside each assistant.
Record the assistant and version used; mark surfaces that were not exercised as
untested. See [the assistant matrix](agents.md#representative-smoke-test).
