# SDD adoption plan: {{project_name}}

Status: proposed; no configuration changes authorized by this document alone.

## Audit and reuse

- Repository root and applicable instructions: {{root_and_instruction_paths}}
- Architecture, technologies, and validation commands: {{observed_context}}
- Existing requirements/specifications, decisions, and backlog: {{artifact_map}}
- Existing assistant discovery and installed skills: {{assistant_inventory}}
- Proposed profile and authoritative ticket provider: {{profile_and_provider}}

## Proposed changes

| Path | Current content/baseline | Proposed operation and exact diff | Owner after setup |
| --- | --- | --- | --- |
| {{relative_path}} | {{observed_hash_or_absent}} | {{addition_or_managed_section_diff}} | {{project_or_managed_section}} |

Include the complete proposed `.beligent/config.json` values. List reused paths,
new artifact directories, managed instruction sections, ownership-state entries,
and each installation action separately. Do not create a second copy of existing
requirements, specifications, or tickets.

## Conflicts and decisions

{{conflicting_instructions_local_edits_unsupported_schemas_and_open_questions}}

## Preservation and rollback

{{how_existing_bytes_are_preserved_and_how_to_reverse_only_the_proposed_changes}}

## Authorization

- Human decision, approver, scope/revision, and source: {{pending_real_decision}}
- Affected configuration writes: {{paths}}
- Excluded or unresolved work: {{items}}

## Verification to perform after approval

- Recheck all audit hashes before any writes.
- Validate configuration, paths, section uniqueness, and ownership baselines.
- Compare existing instructions/artifacts outside approved changes byte for byte.
- Repeat the same setup and confirm no file bytes or state changed.
- Report observed discovery and keep unperformed live assistant checks pending.
