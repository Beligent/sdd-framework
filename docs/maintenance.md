# Maintain a project integration

The project configuration is described by `schema/config.schema.json`.
`package.json` is authoritative and must agree with the lockfile. There is no
separate `VERSION` file. Setup-state and usage records carry their own format
markers. Earlier configurations are not supported or converted.

## Update skills and instructions separately

Use a reviewed Git revision and the external copy-based installer. Inspect local
skill edits first. Installer changes must preserve config, ownership state,
instructions and artifacts. Local installer evidence is recorded separately from
live host coverage.

For instruction refresh, read `.sdd/beligent/setup-state.json`, compare exact managed
content hashes and present scoped diffs. A local edit requires a three-way review;
a hash alone cannot recover a missing baseline. Preserve bytes outside sections.
Complete preflight before any write. Unchanged output is a byte/timestamp no-op.
Valid edited config and overview remain authoritative project-owned content.
See [setup](../skills/sdd-init/references/setup.md).

## Release and recovery

Run the checks in [validation](validation.md), including `npm pack --dry-run`
through package validation. Publishing is a separate manual maintainer operation;
never publish from CI or imply a local version bump has released the package.
Verify provisional Git/npm metadata before release.

Reverse failed integration only with reviewed before-images/version control for
that scope. Removing integration requires a concrete reviewed removal plan;
retain useful artifacts and handwritten instructions. Never delete all of an
instruction file because it contains one managed section.
