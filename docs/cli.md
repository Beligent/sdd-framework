# Optional Beligent CLI

The npm package provides optional diagnostics around the Markdown framework. It
does not install Agent Skills or initialize/adopt a project. Configuration
migration defaults to a read-only preview and requires explicit confirmation to
write; other workflows remain in the skills and the external `skills` installer.

Node.js 22 or later is required. From a configured project, run:

```sh
npx @beligent/sdd-framework validate
npx @beligent/sdd-framework doctor
npx @beligent/sdd-framework usage report
npx @beligent/sdd-framework version
```

`validate` checks `.beligent/config.json`; to select another config file, use:

```sh
npx @beligent/sdd-framework validate --config path/to/config.json
```

It checks JSON syntax and duplicate keys, schema versions 1 and 2, required fields,
known profile gates, project-relative paths, symlink/hardlink safety, and
overlapping output locations. It prints human-readable errors and exits nonzero
for invalid or unreadable configuration. Validation is read-only. Unknown
configuration schemas require a separate migration proposal. Schema-1 projects
remain unchanged; preview their explicit schema-2 migration with:

```sh
npx @beligent/sdd-framework migrate-config
npx @beligent/sdd-framework migrate-config --write --confirm
```

The first command changes nothing. The second prints the same preview, then
writes only after the explicit flags are supplied. Add
`--adopt-recommended-workflow` only when the developer chooses schema-2
`standard + current-task`; otherwise legacy standard maps conservatively to
`rigorous + current-task`.

`doctor` accepts an optional project path. It reports configuration status,
configured artifact paths that have not been created yet, and whether core
skills are discoverable in common project locations. Missing skill copies are
warnings because assistant discovery varies. Missing or invalid configuration
is an error. A warning-only report exits successfully.

`version` prints the CLI/framework version. `package.json` is authoritative;
the repository check ensures it matches `VERSION`.

## Token usage by skill

Agent hosts calculate token usage after a response completes, so a portable
skill cannot know the exact total while generating that response. Capture the
host's structured output, then use the local CLI to append an exact footer or
record it for aggregation. The importer supports Codex JSONL and Claude JSON or
streaming JSON; it stores numeric usage, agent, skill, optional task, timestamp,
and a deduplication hash, never prompts, responses, file contents, or tool output.

```sh
codex exec --json 'Use develop-task for TICKET-012.' > /tmp/develop-task.jsonl
npx @beligent/sdd-framework usage footer \
  --agent codex --skill develop-task --file /tmp/develop-task.jsonl
npx @beligent/sdd-framework usage import \
  --agent codex --skill develop-task --task TICKET-012 \
  --file /tmp/develop-task.jsonl
```

For Claude Code, capture structured streaming output so multi-turn usage can be
summed when the final result does not contain an aggregate:

```sh
claude -p --output-format stream-json --verbose \
  'Use develop-task for TICKET-012.' > /tmp/develop-task.jsonl
npx @beligent/sdd-framework usage footer \
  --agent claude --skill develop-task --file /tmp/develop-task.jsonl
npx @beligent/sdd-framework usage import \
  --agent claude --skill develop-task --task TICKET-012 \
  --file /tmp/develop-task.jsonl
```

Imports default to `.beligent/usage.jsonl`, reject linked stores, and deduplicate
the same agent/skill/task/source combination. Treat this as local operational
data and normally add `.beligent/usage.jsonl` to the consumer project's
`.gitignore`. Display totals grouped by skill:

```sh
npx @beligent/sdd-framework usage report
npx @beligent/sdd-framework usage report --json
```

Interactive Codex and Claude chat applications control their own rendering. To
show the footer after every response, their host integration must call `usage
footer` with that completed turn's structured output. When exact host metadata
is unavailable, the framework omits the footer instead of estimating usage.

The npm CLI is separate from Agent Skills distribution. Install skills from the
public Git repository with the command in [installation](installation.md); the
`skills` installer does not accept npm package names as sources.
