# SDD adoption plan: {{project_name}}

Status: proposed; no configuration changes authorized by this document alone.

## Audit and reuse

- Repository root and applicable instructions: {{root_and_instruction_paths}}
- Architecture, technologies, and validation commands: {{observed_context}}
- Existing requirements, decisions, and backlog: {{artifact_map}}
- Existing assistant discovery and installed skills: {{assistant_inventory}}
- Proposed project checks and which are required: {{checks}}

## Proposed changes

Attach the installer dry-run plan. Call out every managed file that will be
replaced although it was edited locally, and where those edits should move.

| Path | Current state | Installer action or proposed diff | Category |
| --- | --- | --- | --- |
| {{relative_path}} | {{absent_unchanged_or_edited}} | {{create_replace_section_or_keep}} | {{managed_section_or_project}} |

Include the complete proposed `.sdd/beligent/config.json` values. List reused paths
and instruction sections separately. Do not create a second copy of an existing backlog.

## Conflicts and decisions

{{conflicting_instructions_local_edits_unsupported_schemas_and_open_questions}}

## Preservation and rollback

{{how_existing_bytes_are_preserved_and_how_to_reverse_only_the_proposed_changes}}

## Authorization

- Developer decision and scope: {{pending_real_decision}}
- Affected configuration writes: {{paths}}
- Excluded or unresolved work: {{items}}

## Verification to perform after approval

- Rerun the dry run immediately before `--apply` and compare it with this plan.
- Validate configuration, paths and section uniqueness (`sdd validate`, `sdd doctor`).
- Compare existing instructions/artifacts outside approved changes byte for byte.
- Repeat the dry run and confirm it reports no changes.
- Report observed discovery and keep unperformed live assistant checks pending.
