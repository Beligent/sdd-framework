---
name: adopt-project
description: Analyze an existing repository and propose a non-destructive Beligent SDD integration, then apply approved configuration and instruction changes while preserving established artifacts and conventions.
---

# Adopt an existing project

Add missing SDD capabilities to an existing repository through a read-only audit
and an explicitly approved integration plan.

## Preconditions and inputs

Read applicable repository instructions. Identify the target root, requested
scope, selected assistant(s), project technologies, desired profile, and known
requirements or backlogs. Do not assume adoption replaces existing processes.

## Procedure

1. Read [the shared setup procedure](references/setup.md) and
   [shared governance](references/shared/governance.md).
2. Audit application architecture, package/dependency manifests, test commands,
   documentation, existing requirements/specifications, tickets, and assistant
   configuration. Inspect `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`,
   `.github/copilot-instructions.md`, skills, and scoped instructions when present.
3. Map existing artifacts and conventions to SDD capabilities. Propose reuse of
   existing paths and a single authoritative ticket provider. Record conflicts,
   uncertain instruction precedence, unsupported schemas, and missing inputs.
4. Present a concrete plan using [adoption-plan.md](assets/adoption-plan.md),
   including exact configuration values, file/section diffs, proposed additions,
   preservation evidence, rollback, and unresolved conflicts. Present it in chat
   while awaiting approval; do not write a report or configuration merely to ask
   for permission. An existing explicit approval of this exact integration scope
   can satisfy the gate.
5. After approval, recheck inventory hashes and every destination. Complete all
   conflict checks before any write. If scope or relevant bytes changed, revise
   the plan and obtain the affected decision before applying dependent changes.
6. Apply only the approved conflict-free changes using the shared procedure.
   Verify preservation, configuration, baselines, and repeat behavior; report all
   additions, updates, skipped paths, and unresolved conflicts.

## Outputs and validation

The output is an approved integration proposal, project-owned configuration,
small managed instruction sections, reused or new artifact locations, and an
ownership state. Use the packaged [configuration](assets/config.json),
[overview](assets/project-overview.md), [shared instructions](assets/AGENTS.fragment.md),
[Claude fragment](assets/CLAUDE.fragment.md), and
[Copilot fragment](assets/copilot.fragment.md) only when the approved plan needs
them. These are packaged copies of the initialization assets.

Never overwrite existing instructions, regenerate a project configuration,
duplicate an existing backlog, migrate a schema implicitly, or change application
code during adoption. Keep configuration migrations and instruction refreshes
separate from installing updated skills. Live assistant smoke tests remain
pending unless observed and reported.
