---
name: init-project
description: Initialize Beligent SDD instructions, configuration, and artifact locations in a new repository without generating application code. Use adopt-project for repositories with existing code or project conventions.
---

# Initialize a project

Establish project-owned SDD configuration and assistant discovery in a new
repository. This is an instruction-based setup workflow, not an installer.

## Preconditions and inputs

Read the target repository's applicable instructions first. Confirm its root,
project name and type, selected assistant(s), technologies, workflow profile,
and desired artifact locations. For a new schema-2 configuration, propose one
concise batch of workflow, testing, and delivery defaults: standard rigor,
current-task design depth, ask before expansion, risk-proportionate checks, and
feature-branch delivery with push confirmation. Ask only for deviations that
matter to the project; these values are stable project context, not task text.
If application code or established conventions exist, use `adopt-project`
instead.

## Procedure

1. Read [the setup procedure](references/setup.md) and
   [shared governance](references/shared/governance.md).
2. Inventory configuration, instructions, installed skills, and all proposed
   destination paths before writing. Use existing installation discovery; never
   assume this source repository's `skills/` folder is discoverable in a target.
3. Present the concrete setup plan, configuration values, instruction additions,
   and any conflicts. Apply already authorized setup scope; obtain a decision
   for unresolved material choices rather than inventing them.
4. Complete the procedure's entire preflight before creating any file or
   directory. Apply only the authorized conflict-free plan, then verify it.
5. Report created paths, preserved paths, selected profile, workflow, testing,
   delivery policies and technologies, discovery locations, and any remaining
   installation or live assistant checks.

## Outputs and validation

Use [config.json](assets/config.json),
[project-overview.md](assets/project-overview.md),
[AGENTS.fragment.md](assets/AGENTS.fragment.md),
[CLAUDE.fragment.md](assets/CLAUDE.fragment.md), and
[copilot.fragment.md](assets/copilot.fragment.md) as output assets. Render them
for the chosen project; preserve existing configuration and documentation.
Create `.beligent/setup-state.json` using the documented ownership schema.

Verify schema 1 or 2, local paths, managed-section uniqueness, baseline hashes,
selected assistant discovery, and repeat setup producing no byte changes. Do
not scaffold an application, add dependencies, initialize Git, publish, or approve
implementation as part of this skill. Instruction discovery is documented
support; report live assistant behavior as untested unless actually exercised.
