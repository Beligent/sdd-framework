# Optional Beligent CLI

The npm package provides optional read-only diagnostics around the Markdown
framework. It does not install Agent Skills, initialize/adopt a project, migrate
configuration, or modify files. Those workflows remain in the skills and the
external `skills` installer.

Node.js 22 or later is required. From a configured project, run:

```sh
npx @beligent/sdd validate
npx @beligent/sdd doctor
npx @beligent/sdd version
```

`validate` checks `.beligent/config.json`; to select another config file, use:

```sh
npx @beligent/sdd validate --config path/to/config.json
```

It checks JSON syntax and duplicate keys, schema version 1, required fields,
known profile gates, project-relative paths, symlink/hardlink safety, and
overlapping output locations. It prints human-readable errors and exits nonzero
for invalid or unreadable configuration. Validation is read-only. Unknown
configuration schemas require a separate migration proposal; the CLI does not
upgrade settings.

`doctor` accepts an optional project path. It reports configuration status,
configured artifact paths that have not been created yet, and whether core
skills are discoverable in common project locations. Missing skill copies are
warnings because assistant discovery varies. Missing or invalid configuration
is an error. A warning-only report exits successfully.

`version` prints the CLI/framework version. `package.json` is authoritative;
the repository check ensures it matches `VERSION`.

The npm CLI is separate from Agent Skills distribution. Install skills from the
public Git repository with the command in [installation](installation.md); the
`skills` installer does not accept npm package names as sources.
