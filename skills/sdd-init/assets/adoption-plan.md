# Setup proposal: {{project_name}}

Status: proposed; nothing written yet.

**Install:** {{hosts}}; stacks {{stacks}}. Dry run: {{creates_replaces_and_sections, or "no changes"}}.

**Problems:** {{conflicts_edited_managed_files_and_earlier_leftovers, or "none"}}.

**Proposed checks:**

```json
"checks": [
  { "id": "{{id}}", "command": "{{command}}", "paths": ["{{glob}}"] }
]
```

{{one_line_per_check_explaining_its_paths_and_any_check_left_without_paths}}

**On approval:** {{the_files_that_will_change}}. Approve, or say what to change?

<!-- Keep the proposal to about one screen. Report only what changes, what is
wrong and what the developer decides; omit anything that is fine. -->
