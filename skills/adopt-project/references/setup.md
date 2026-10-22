# Project integration procedure

Canonical source: `skills/init-project/references/setup.md`. The packaged copy in
`adopt-project` must match this file. Use local packaged assets; no step depends
on the framework source checkout or another installed skill's resources.

This procedure creates project integration, not an application or an installer.
It supports project configuration schemas **1** and **2** and integration revision
**0.1.0**.
Read-only investigation is allowed before approval. Adoption configuration writes
require approval of the concrete integration plan. Existing authorization for
that exact scope satisfies the gate; installation alone does not authorize it.

## 1. Inventory and choose a plan

Resolve the target repository root and applicable instructions. In adoption,
inspect the current architecture, dependency/test manifests, documentation,
specifications, backlog, assistant configuration, and installed skills. In a new
project, infer what is available without creating application scaffolding.

Read `.beligent/config.json` and `.beligent/setup-state.json` if they exist.
Inventory every proposed output and record its bytes/hash or absence. Reuse
existing requirements, conventions, and backlog locations. Preserve a valid
existing configuration as authoritative, even when it differs from defaults.
Do not copy its values into reusable skill source or duplicate its artifacts.

For a new configuration, render the schema-2 `assets/config.json` with a
nonempty project name/type; selected assistants; selected technologies; the
existing lifecycle profile; approved artifact paths; and project workflow,
testing, and delivery policies. Propose the defaults as one concise batch:
`standard` rigor, `current-task` design depth, ask before expansion, the bundled
risk-proportionate testing preferences, and feature-branch delivery with push
confirmation. Let the developer accept them together or name deviations; do not
run a long questionnaire. The template's `codex` is an example default, not a
requirement to choose Codex. Empty technologies is valid when none is selected.
These policies are stable project context and must not be copied into every task.
Do not add source commits or framework release versions to project configuration.
Use the installer's own lock file for installed skill provenance.

Plan only the missing capabilities:

| Destination | Operation |
| --- | --- |
| `.beligent/config.json` | Create from reviewed values only when absent; otherwise preserve |
| Configured `artifacts.overview` | Create a rendered overview only when absent; otherwise reuse |
| Configured artifact and Markdown ticket directories | Create missing directories; do not move or rewrite existing records |
| Root `AGENTS.md` | Add the reviewed managed section when shared SDD guidance is missing |
| Root `CLAUDE.md` | For Claude Code, add the thin import section when needed |
| `.github/copilot-instructions.md` | For Copilot, add a small shared-guidance bootstrap when needed |
| `.beligent/setup-state.json` | Record only approved integration ownership and baselines |

If only `.claude/CLAUDE.md` exists, prefer proposing a section there over adding a
competing file, and adapt the asset's import to `@../AGENTS.md`. Root `CLAUDE.md`
uses `@AGENTS.md`. If both files exist, inspect their loading and imports before
proposing a destination. Reuse an existing equivalent import or bootstrap rather
than duplicating it. Uncertain precedence is an explicit integration conflict.

Show the selected profile, workflow/testing/delivery policies and technologies,
complete proposed config, exact file and section diffs, preserved artifacts,
remaining installation actions, and rollback.
For adoption use `assets/adoption-plan.md` and present the plan in chat first.
No `.beligent` directory, report, or other target file is written before the
applicable approval. If the repository already has a tracker as its authoritative
backlog, explain that only the Markdown provider ships in the MVP; propose an
explicit choice without creating a competing Markdown mirror or silently
claiming tracker integration.

## 2. Validate configuration and every path before writes

Preflight is a whole-plan operation. Any unresolved conflict stops all writes,
including directory creation and setup-state changes. Report all conflicts found
so the human can review a complete resolution proposal.

- Parse JSON strictly: reject duplicate keys and invalid JSON. Require integer
  `schema_version: 1` or `schema_version: 2` (a JSON boolean is not an integer
  version). Unsupported config/state schemas require a separate migration
  proposal; do not mutate the project, reinterpret fields, or fall back to
  defaults.
- Require the shared schema-1/schema-2 fields from `assets/config.json`: nonempty string project
  name/type; nonempty unique assistant identifiers such as `codex`,
  `claude-code`, `github-copilot`, or `cursor`; a nonempty profile name present in `profiles`; unique technologies from
  `react-typescript`, `nextjs`, `nodejs`, `python`, `fastapi`; artifact paths;
  `tickets.provider: "markdown"` and its epic/ticket paths; built-in `lightweight`
  and `standard` profiles plus any named additional profiles, each with string
  arrays `artifacts` and `approvals`. Preserve implementation and completion
  decisions in every profile. Schema 2 additionally requires bounded workflow
  rigor/design-depth/expansion settings, testing preferences, and Git/delivery
  policy. Schema-2 workflow rigor and design depth control current-task behavior
  and readiness; retained profiles continue to express expanded artifact and
  approval policy. Do not silently drop unknown settings; report unsupported
  keys as a compatibility decision before affected writes.
- Every configured location is a nonempty repository-relative POSIX path. Reject
  absolute paths, Windows drive/UNC paths, backslashes, NUL, empty components,
  `.` or `..` components, and unresolved template markers. Check instruction,
  state, config, and installer destinations as well as artifact paths.
- Resolve existing path components against the target root. Reject symlinked
  destinations or ancestors for integration writes, including `.beligent`,
  instruction files, and configured artifact paths. Reject a root-relative path
  whose resolved location escapes the resolved repository root. Never replace a
  symlink with a regular file. Report the conflicting path and propose a safe
  alternative instead. Do not write through hard-linked output files either.
- Reject outputs in `.git`, installed skill/resource directories, or framework
  source. Reject file/directory collisions, two semantic file outputs sharing a
  destination, an output file used as another path's ancestor, and overview
  placement in the authoritative ticket/epic directories. Document intentional
  reuse of artifact directories; do not accidentally combine ticket and epic
  directories or use configuration/state/instruction paths as artifact stores.
- Ensure all existing instruction files are UTF-8 text before proposing section
  edits. Detect malformed, nested, or repeated managed delimiters. An unowned
  managed-looking section without a matching state baseline is a conflict; do
  not assume its ownership from markers alone.
- Validate existing setup state as described below. Read and hash every tracked
  managed section/file, and detect locally edited or missing owned content.
  Preserve valid edited config as project-owned. For other tracked content,
  report mismatches as conflicts rather than silently recreating or replacing it.
- After approval, reread every inventoried destination and compare expected
  bytes/absence immediately before applying the complete plan. Changed inputs
  invalidate the affected proposal. Recheck paths and permissions as well.

An agent may inspect proposed paths with ordinary read-only shell commands or a
short standard-library check. This is not permission to write a setup program,
install dependencies, or bypass the host's normal permissions.

## 3. Ownership state and exact hashes

Create `.beligent/setup-state.json` with this schema:

```json
{
  "schema_version": 1,
  "integration_version": "0.1.0",
  "files": {
    ".beligent/config.json": {
      "sha256": "<64 lowercase hexadecimal digits>",
      "ownership": "file"
    },
    "docs/sdd/overview.md": {
      "sha256": "<64 lowercase hexadecimal digits>",
      "ownership": "file"
    },
    "AGENTS.md": {
      "sha256": "<64 lowercase hexadecimal digits>",
      "ownership": "section"
    }
  }
}
```

The sample paths vary with the approved configuration. Record only resources
actually created or sections actually added by setup; reused files never become
owned merely because setup read them. Do not record the state file itself,
installer lock files, installed skills, or directories in `files`.

For `ownership: "file"`, SHA-256 covers the complete bytes written. Config and
overview become project-owned after creation: their hashes preserve the original
baseline, not permission to regenerate them. A valid changed config is read as
current project configuration; never overwrite it or refresh its baseline merely
because setup repeats. A changed overview is likewise preserved; a mismatch
requires explicitly resolving its tracking or any proposed update. When a file
is deliberately released from tracking, review that state-only change separately.

For `ownership: "section"`, SHA-256 covers the exact UTF-8 bytes from the first
byte of `<!-- beligent-sdd:start -->` through the last byte of
`<!-- beligent-sdd:end -->`, inclusive, excluding any following newline. There
must be exactly one start and one end marker, in that order, both on their own
lines. Use section ownership for instruction fragments even when setup creates
the instruction file. Preserve all bytes outside that section on refresh.
When adding a section, preserve the existing bytes and append a necessary newline
separator plus the rendered section; do not normalize existing newline formats.

Use actual output bytes to compute hashes, never a template or decoded/re-encoded
approximation. For example, this read-only Python snippet prints an exact hash
and does not implement setup:

```python
from hashlib import sha256
from pathlib import Path

data = Path("AGENTS.md").read_bytes()
start = b"<!-- beligent-sdd:start -->"
end = b"<!-- beligent-sdd:end -->"
assert data.count(start) == data.count(end) == 1
first = data.index(start)
last = data.index(end)
assert first < last
section = data[first:last + len(end)]
print(sha256(section).hexdigest())
```

Validate state keys as safe paths, ownership as `file` or `section`, and hashes
as 64 lowercase hexadecimal digits. Integration revision `0.1.0` is independent
of configuration schema 1 and skill version/provenance. An unknown newer
integration revision is not a request to downgrade it: stop affected integration
writes and propose a supported refresh path.

## 4. Apply approved changes and verify

After every conflict is resolved and all preflight checks pass, create only the
approved missing directories/files and managed sections. Render placeholders in
new assets, preserve existing project files, and write the ownership state last.
Use safe per-file writes and retain the reviewed before-images until verification
finishes. If a write fails, stop, report exactly what changed, and propose or
perform the already authorized reversal of only this run's changes. Do not
delete unrelated files or claim multi-file writes are atomic.

Validate resulting JSON, paths, actual file/section hashes, and the overview
links. Compare preserved files and instruction text outside approved additions
against the inventory. Verify skill locations exist for the selected assistant
or report installation as a remaining step; these instructions do not implement
skill registration. Empty artifact directories may be created locally; Git does
not store them until an artifact is created. No `.gitkeep` files are required.

For an identical repeat with the same valid config and matching ownership state,
reuse all resources and produce **no writes at all**: no timestamp, changed
whitespace, new state serialization, baseline refresh, or appended duplicate
sections. A repeat is not an integration refresh. If newly selected capabilities
or config paths need changes, present an incremental plan instead of overwriting
the existing integration.

Report additions, changes, reused/skipped paths, conflicts, selected configuration,
and actual checks. Record an observed live assistant smoke test separately from
installation-layout validation. Setup does not approve product scope,
implementation, or completion and does not publish or modify application code.

## 5. Maintenance boundaries

- **Skill update:** review source/revision and replace installed skills through
  the chosen installer. Only skill content and installer provenance change.
  Project config, instruction files, setup state, and artifacts remain unchanged.
- **Config migration:** compare schema support before affected writes; propose
  an explicit old/new JSON diff, preservation rules, verification, and rollback.
  Apply after the real human decision. Schemas 1 and 2 are shipped; do not invent
  a migration from an undocumented predecessor or unsupported version.
- **Instruction refresh:** compare the current managed section against its
  recorded baseline before proposing a new section. Matching bytes permit the
  reviewed replacement; local edits require a three-way merge proposal using
  current text, recorded baseline/source revision, and proposed content. If the
  baseline cannot be recovered, request an explicit manual resolution rather
  than reconstructing it from its hash. Update only approved section hashes and
  the integration revision. Preserve user text, config, and artifacts.

These are independent operations. A newer skill never silently performs either
of the latter two, and a hash match does not itself supply human approval.
