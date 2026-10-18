# Adopt an existing project

Install `adopt-project` in the target repository as described in
[installation](installation.md), then ask the assistant to audit the project and
prepare an integration proposal. Installing a skill does not authorize changes
to project configuration.

For example:

> Use adopt-project to examine this existing FastAPI repository. Keep our current
> architecture notes and backlog in their present locations. Propose the missing
> SDD capabilities and exact configuration/instruction changes before writing.

The first pass is read-only. It inspects applicable instructions, application
architecture, dependency/test manifests, existing specifications and tickets,
documentation, and assistant discovery. It proposes reuse of current artifacts
and conventions rather than moving or duplicating them. The MVP ticket backend
is Markdown; an existing issue tracker needs an explicit authoritative-provider
decision before new tickets are created. No remote tracker integration is
implied.

The proposal includes:

- The repository root, selected technologies/profile, and complete configuration.
- Existing artifact locations and instructions to preserve.
- Every proposed addition or managed-section diff, with current hashes/absence.
- Conflicts, uncertain instruction precedence, and unsupported settings/schemas.
- Verification and rollback for only the proposed changes.

The skill presents the proposal in chat while awaiting a real human decision.
It does not create a report, `.beligent` directory, or configuration in order to
ask for approval. An explicit approval already covering the exact plan is valid;
there is no duplicate confirmation for the same authorized scope.

After approval it rechecks all paths, bytes, and baselines before its first write.
Any unresolved conflict stops the entire change set. The skill adds only missing
integration, uses small identifiable instruction sections, preserves existing
config, and reports created/changed/reused/skipped paths. It creates no application
code or dependencies, does not rewrite entire instruction files or `docs/`, and
does not modify application code, package manifests, or remote services. Audit
findings outside the approved integration remain separate work.

## Preservation and repeated adoption

`.beligent/config.json` is project-owned after creation. Valid existing settings
remain authoritative. Existing artifacts and instruction text outside managed
sections stay unchanged. `.beligent/setup-state.json` records only actual
integration ownership and SHA-256 baselines, with no duplicate dependency lock.

An identical repeat with matching baselines performs no writes. Locally edited
managed sections, missing tracked content, malformed markers, escaping paths,
symlinked write paths, and unsupported schemas require a resolution proposal.
The assistant does not reclaim a section merely because it contains framework
markers. A valid project-edited config is read without resetting its baseline.

The detailed state contract and path checks are in the canonical
[setup procedure](../skills/init-project/references/setup.md). To refresh
instructions, migrate configuration, or update skills later, use the independent
operations in [maintenance](maintenance.md).

## Review the adoption result

Compare the proposed and actual diff; confirm that existing instruction text,
artifacts, and application files were preserved. Check configuration paths and
selected assistant skill locations. Repeat adoption and compare byte hashes.
Exercise an installed workflow against an existing artifact in a live assistant
session when available; otherwise mark that check pending. A fixture demonstration
does not establish every assistant surface's behavior.

Adoption does not retroactively approve product scope or mark existing tickets
ready. Map old approval evidence when it exists, retain unanswered questions, and
use the selected profile for subsequent decisions.
