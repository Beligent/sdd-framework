---
name: sdd-init
description: Initialize or adopt Beligent SDD in a repository through a reviewed integration proposal, preserving existing instructions, configuration, artifacts and conventions.
---

# Initialize or adopt a project

Read applicable repository instructions. Select initialization for a new project
or adoption for existing code, conventions, instructions or artifacts. Neither
mode generates application code or installs dependencies.

1. Read [setup](references/setup.md) and [governance](references/shared/governance.md).
2. Inventory configuration, installed skills, instructions, architecture, tests,
   specifications and backlog. Preserve existing guidance and reuse suitable paths.
   Detect pre-v2 installations and old skill copies and report them; there is no
   conversion, and nothing is overwritten or deleted silently.
3. Present the concrete configuration and exact instruction diffs in chat.
   For adoption use [the adoption plan](assets/adoption-plan.md). Include conflicts,
   preservation checks, rollback, assistant discovery and outstanding host tests.
4. Default ticket tracking to opt-in. Engineering standards apply to ordinary code
   requests regardless of tracking. Propose testing, workflow depth and delivery
   defaults together; ask only for material deviations. Existing authorization
   for this exact integration counts; otherwise obtain approval before writes.
5. Install only selected host copies and shared .sdd/beligent/guidance assets.
   Complete the whole setup preflight, recheck hashes and destinations, then apply
   only approved changes. Record actual managed-section hashes in setup state.
6. Validate configuration, preserve bytes outside managed sections, and verify
   identical repeat setup makes no byte or timestamp changes. Report observed
   installation checks separately from live workflow tests.

Use the [configuration](assets/config.json), [overview](assets/project-overview.md),
[shared instructions](assets/AGENTS.fragment.md), [Claude adapter](assets/CLAUDE.fragment.md)
and [Copilot adapter](assets/copilot.fragment.md). Render installed skill paths
for the selected host; never leave references to the framework source checkout.
Do not migrate configuration, replace handwritten instructions, duplicate an
existing backlog, initialize Git or imply product implementation approval.
