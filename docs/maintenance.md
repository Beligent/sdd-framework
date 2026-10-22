# Maintain a project integration

Framework skill releases, project configuration schema, and managed instruction
integration are independent. The `package.json` version is authoritative and
`VERSION` is checked against it. Version `0.2.1` supports configuration schemas 1
and 2 and integration revision `0.1.0`. Source/revision provenance belongs to the chosen
skills installer's lock file; `.beligent/setup-state.json` records project
integration ownership and baseline hashes.

| Operation | May change | Preserves |
| --- | --- | --- |
| Skill update | Selected installed skills/resources and installer provenance | Project config, integration instructions/state, and artifacts |
| Config migration | Explicitly proposed configuration fields/schema | Project choices and artifacts outside the approved migration |
| Instruction refresh | Approved managed sections and corresponding state baselines/revision | User text outside sections, project config, and artifacts |

No automatic update job or migration runs in the background. A skill update does
not implicitly perform either of the other operations.

The npm CLI is optional tooling. Its `validate` and `doctor` commands are
read-only. `migrate-config` defaults to a read-only preview and writes only with
explicit `--write --confirm`; publishing the npm package is a separate release
operation. Maintainers can run `npm run validate:package` to build the CLI,
check version agreement, and inspect the `npm pack --dry-run` allowlist before
any manual publish.

## Publish or update the npm package

Publishing requires maintainer access to the `beligent` npm organization and
an npm account that satisfies its two-factor authentication policy. From a
clean checkout of the release commit:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run validate:framework
npm run validate:package
npm run check:version
npm login
npm whoami
npm publish --access public
npm view @beligent/sdd-framework version
```

The registry rejects a version that has already been published. For each
update, change `package.json`, `package-lock.json`, and `VERSION` to the same new
semantic version, move its release notes out of `Unreleased`, validate again,
then publish. Consumers can run this release with
`npx @beligent/sdd-framework@0.2.1 doctor`.

Publishing the npm package updates the optional CLI and the packaged skill
files. The external `skills` installer still installs the public skill
collection from Git, so publish the corresponding Git commit or tag before
asking users to update their installed skills.

## Update installed skills

Select a reviewed framework revision, review its changes and supported schemas,
and inspect local edits in installed skill directories. Project-specific settings
belong in config or project conventions so copied skill resources can be
replaced. Preserve or port any existing local edits before replacing them.

Use the same pinned installer and selected assistant/source as installation.
Reinstall from the reviewed source using the documented copy command in
[installation](installation.md), selecting only the skills to update. Review
installer replacement behavior first; do not allow it to rewrite user-owned
integration files as a side effect. Keep installer provenance and confirm the
selected revision. A generic update command that follows a mutable upstream is
not an immutable pin.

The local `skills@1.7.2` smoke test reinstalled all six copied skills from a
separate source copy with one harmless change in `init-project/SKILL.md`.
Only that installed file in each assistant directory and `skills-lock.json`
changed. Project configuration, setup state, assistant instructions, overview,
ticket, and application fixture bytes were preserved. This verifies the tested
local reinstallation boundary; remote `skills update` behavior and revision
selection were not exercised. Local lock entries contained a relative source
path and computed hash, so record a reviewed Git commit separately when using
a local source checkout.

Before/after byte comparisons should show that `.beligent/config.json`,
`.beligent/setup-state.json`, instruction files, and project artifacts did not
change. Recheck installed skill completeness and packaged resources. Source
templates changing does not authorize regenerating project documents.

## Migrate configuration explicitly

Newer skills check schema compatibility before affected writes. Unsupported
schemas stop the operation with a clear migration proposal; the skill must not
ignore the file or replace it with a current default. Version 0.2.1 supports
schemas 1 and 2. Schema-1 projects retain their existing semantics unchanged.

Preview a schema-1 migration before writing it:

```sh
npx @beligent/sdd-framework migrate-config
npx @beligent/sdd-framework migrate-config --write --confirm
```

The compatibility preview maps `lightweight` to `light + current-task` and
`standard` to `rigorous + current-task`, while preserving paths, provider, and
legacy profile fields. To explicitly adopt the new recommended workflow policy,
preview and confirm with `--adopt-recommended-workflow`. A schema-2 input is a
no-op, so the migration is idempotent. Workflow rigor is policy only until a
later lifecycle increment; it does not change readiness or approvals here.

For a real future schema change, the proposal must identify the current and
target schema, exact JSON diff, treatment of existing/custom fields, changed
semantics, validation, and rollback. Obtain a human decision for that concrete
scope, preserve a recoverable prior version, migrate only the approved fields,
then validate and inspect the diff. Config migration does not refresh instructions
or install skills. Keep any tracking changes explicit rather than replacing
original baselines incidentally.

## Refresh managed instructions

Read the current `.beligent/setup-state.json`. Each path has `ownership: "file"`
or `"section"` and the original/applied content's SHA-256. For sections, the hash
covers both managed delimiters and everything between them, excluding a following
newline. The exact schema, path checks, and hashing example are in the
[setup procedure](../skills/init-project/references/setup.md).

Compare current managed content against its recorded baseline before proposing
updates. If it matches, present the replacement diff and apply it after the
appropriate decision. If locally edited, present a three-way merge using current
text, recoverable baseline content, and proposed framework content. A hash alone
cannot reconstruct a missing baseline; use Git/history or the relevant source
revision, otherwise require a manual resolution. Do not overwrite edits or claim
ownership solely because delimiters exist.

Preflight the entire refresh before the first write. Preserve bytes outside
approved sections. Update only changed section hashes and the applied integration
revision; keep config and artifacts intact. Identical refresh output is a no-op,
including no state reserialization or timestamp.

Configuration and overview files created during setup become project-owned.
Their file hashes detect departure from the original content without granting
permission to regenerate them. A valid edited config stays authoritative; an
edited overview is preserved and any tracking change is reviewed separately.

## Recover or remove an integration

Use the reviewed before-images or version control to reverse only the operation
that failed. Do not broadly reset a repository or remove unrelated paths.
Removing an integration requires a concrete removal plan: identify owned
sections, installed skills/provenance, and project artifacts to retain, then
obtain authorization before deletion. Artifacts remain useful Markdown even
without the framework. Deleting all of `AGENTS.md` because it contains one
managed section would remove user content and is not a valid removal strategy.
