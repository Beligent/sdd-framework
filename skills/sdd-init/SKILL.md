---
name: sdd-init
description: Use only when the prompt starts with /sdd-init or $sdd-init. Installs or updates Beligent SDD in a repository through a reviewed install plan, preserving existing instructions, configuration and tickets.
disable-model-invocation: true
---

# Initialize or adopt a project

Read applicable repository instructions, [setup](references/setup.md) and the
[shared contract](references/shared/governance.md). This command authorizes the
reviewed installation only. It never generates application code, installs
dependencies, creates tickets or initializes Git.

1. Inventory configuration, installed skills, instruction files, tests and
   conventions. Report earlier framework installations (`.beligent/`, old skill
   names, retired guidance files, `epics/` or `specs/` folders); nothing is
   converted, overwritten or deleted silently.
2. Select hosts and only the stacks the project uses. Propose the project's real
   test, lint and typecheck commands as config `checks`, marking those every
   ticket must pass as `required`.
3. Run the installer dry run from [setup](references/setup.md) and present its
   plan and the proposed config in chat. For an existing project use
   [the adoption plan](assets/adoption-plan.md). Name edited managed files the
   install will replace, conflicts and duplicate skill roots.
4. After the developer approves, apply with `--apply`, then write the approved
   `checks` into the config as an ordinary reviewed edit. Resolve conflicts by
   hand and rerun; never work around them with direct writes.
5. Run `sdd validate` and `sdd doctor`, confirm a repeated dry run reports no
   changes, and explain how the framework is used: it stays inactive until a
   prompt starts with a command such as `/sdd-define` (`$sdd-define` in Codex).

The installer renders the [configuration](assets/config.json),
[shared instructions](assets/AGENTS.fragment.md), [Claude adapter](assets/CLAUDE.fragment.md)
and [Copilot adapter](assets/copilot.fragment.md). Draft the
[overview](assets/project-overview.md) only when the developer wants one. Never
leave references to the framework source checkout or replace handwritten
instructions outside the managed section.
