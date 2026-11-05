# Reviewed host integration procedure

Canonical source: `skills/sdd-init/references/setup.md`. Setup is performed by the
assistant with ordinary file operations using this installed skill's assets.
There is no application scaffolder or agent-specific workflow runtime. The source
maintainer helper `src/packaging/hosts.ts` prepares a read-only package plan and
preflights destinations; it never applies consumer changes.

## 1. Inventory and review

Resolve the consumer root and applicable instructions. Inventory existing code,
tests, conventions, instructions, skill roots, `.sdd/beligent/config.json` and
setup-state. Also inspect legacy `.beligent/`, `docs/sdd/`, old skill names and
versioned or unversioned pre-v2 config. Report them with clean-break options;
never silently move, rewrite, convert or delete old files.

Select hosts and only relevant stack modules. Propose the project's real test,
lint and typecheck commands as config `checks`, marking those every tracked
closure needs as `required`. Default tracking authorization to `request` and
every delivery permission to `ask`. Delivery does not gate ticket done.
Show exact config, guidance files, skill copy locations, instruction sections,
ownership baselines, preservation checks and rollback. Use
`assets/adoption-plan.md` for existing projects. Present the plan in chat before
any target writes. Existing approval for the exact scope counts.

| Selected host | Candidate project skill destination | Bridge |
| --- | --- | --- |
| Codex | `.agents/skills/` | AGENTS.md |
| Claude Code | `.claude/skills/` | CLAUDE.md imports @AGENTS.md |
| Copilot local | `.agents/skills/` | .github/copilot-instructions.md |
| Cursor | .agents/skills/ (observed with skills@1.7.2); alternate native paths require review | AGENTS.md |
| Copilot cloud | Confirm committed resources/discovery in its own surface | Do not equate local copies with cloud availability |
| Devin Desktop with Devin Local | Confirm documented native discovery before choosing paths | No invented installer selector or native flags |

Candidate paths are not live-host certification. Install complete reviewed
five-skill packages through the pinned external installer or approved exact copies.
Select only requested host integrations. A shared root (Codex/Copilot) gets one
copy, not duplicate per-host directories. Inspect all other discovery roots for
same-name skills and aliases; surface duplicate discovery before applying. Do not
remove personal/other-host copies without an exact reviewed plan. Use native
invocation flags only after verifying the selected product supports them; every
workflow still checks explicit tracking intent before record writes.

## 2. Guidance and whole-plan preflight

Install common assets from `assets/guidance/` into `.sdd/beligent/guidance/`:
engineering.md, testing.md, review.md, shared/governance.md and
shared/diagnosis-and-simplicity.md; copy only selected stack modules. Preserve
relative links. Render `assets/AGENTS.fragment.md` into a managed shared section.
General/stack/local guidance applies to ordinary prompts without skill selection;
explicit workflow entrypoints stay in native skill directories. Optional
specialists use the host's native mechanism only when available, bounded criteria
and evidence expectations, and the same shared guidance. One main agent is default.

Before the first write:

- Parse strict JSON, reject duplicate/unknown keys and validate the config against
  the v2 shape in `assets/config.json` (`"schema": "beligent-sdd/config/v2"`).
  Record directories under `.sdd/beligent/` are created only with their first
  record. No frameworks.json.
- Inventory bytes/hashes or absence for every destination. Only the approved host
  copies, selected shared guidance, config, managed sections and ownership state
  can change. Configuration and instruction refresh are distinct reviewed scopes.
- Reject escaping paths, symlink ancestors/destinations, hard-linked files,
  file/directory collisions and destinations in .git or unrelated installed roots.
  Check `.sdd` and `.sdd/beligent` ancestors. Recheck after approval before writes.
- Preserve valid existing config and artifacts. Shared guidance is project-owned;
  record its initial baseline, never overwrite local modifications on repeat setup.
  Reused resources do not become owned merely because they were read.
- Inspect AGENTS.md, CLAUDE.md/.claude/CLAUDE.md and Copilot instructions. Preserve
  handwritten bytes and supported imports. Root Claude uses @AGENTS.md; nested
  Claude uses @../AGENTS.md. Reuse equivalent imports rather than duplicate them.
  Ambiguous precedence or duplicate discovery requires a resolution proposal.
- Reject malformed/nested/repeated managed markers or unknown ownership. Compare
  existing managed content with setup-state hashes. A local edit requires review,
  not regeneration. A hash alone cannot reconstruct a missing baseline.
- Preflight the entire plan and recheck inventoried bytes immediately before
  applying. Any unresolved conflict stops all writes, including directory creation.

## 3. Ownership state and exact hashes

Create `.sdd/beligent/setup-state.json` with this schema:

```json
{
  "schema_version": 1,
  "integration_version": "0.1.0",
  "files": {
    ".sdd/beligent/config.json": {
      "sha256": "<64 lowercase hexadecimal digits>",
      "ownership": "file"
    },
    ".sdd/beligent/overview.md": {
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
of project configuration and skill version/provenance. An unknown newer
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
skill registration. Create ticket directories only for explicitly selected tracking. Other approved
artifact directories may be created locally; Git stores only their files. No `.gitkeep` files are required.

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
- **Earlier configurations:** there is no conversion. Report them and set up v2
  afresh; never reinterpret old settings or remove old files silently.
- **Instruction refresh:** compare the current managed section against its
  recorded baseline before proposing a new section. Matching bytes permit the
  reviewed replacement; local edits require a three-way merge proposal using
  current text, recorded baseline/source revision, and proposed content. If the
  baseline cannot be recovered, request an explicit manual resolution rather
  than reconstructing it from its hash. Update only approved section hashes and
  the integration revision. Preserve user text, config, and artifacts.

These are independent operations. A newer skill never silently performs an
instruction refresh, and a hash match does not itself supply human approval.
