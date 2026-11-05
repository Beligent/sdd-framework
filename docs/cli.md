# Optional Beligent CLI

The npm package provides optional diagnostics around the Markdown framework. It
does not install Agent Skills or initialize/adopt a project. Node.js 22 or later is required. From a configured project, run:

```sh
npx @beligent/sdd-framework validate
npx @beligent/sdd-framework doctor
npx @beligent/sdd-framework usage report
npx @beligent/sdd-framework version
```

`validate [project-path]` checks `.sdd/beligent/config.json` and every record
under `.sdd/beligent/`: strict JSON, the v2 shape, record identity and markers,
references, dependency cycles and closure evidence for every criterion. Required
failed/blocked/unrun or stale checks reject done; delivery is never a gate.
Earlier configurations and records are rejected with an actionable message; there
is no conversion. Two options add Git-based checks:

```sh
npx @beligent/sdd-framework validate --since main        # done/cancelled final, history kept, revisions bumped
npx @beligent/sdd-framework validate --snapshot TICKET-042  # recorded snapshot matches the working tree
```

`snapshot [project-path]` prints the `base` commit and the `git-tree:` snapshot to
record in a ticket's `implementation`. The snapshot covers the working tree,
including untracked non-ignored files, and excludes `.sdd/beligent/`. It uses a
temporary index, so the real index, working tree and refs are untouched; Git may
store loose objects. `validate` and `snapshot` never write project files.

`doctor` accepts an optional project path. It reports configuration status,
pre-v2 leftovers (`.beligent/`, old skill names) and whether core skills are
discoverable (including duplicate-root warnings) in common project locations.
Missing skill copies are warnings because assistant discovery varies. Missing or
invalid configuration is an error. A warning-only report exits successfully.

`version` prints the CLI/framework version. `package.json` is authoritative;
the repository check ensures the lockfile agrees with it. No separate `VERSION` file is used.

## Token usage by skill

Agent hosts calculate token usage after a response completes, so a portable
skill cannot know the exact total while generating that response. Capture the
host's structured output, then use the local CLI to append an exact footer or
record it for aggregation. The importer supports Codex JSONL and Claude JSON or
streaming JSON; it stores numeric usage, agent, skill, optional task, timestamp,
and a deduplication hash, never prompts, responses, file contents, or tool output.

```sh
codex exec --json 'Use sdd-implement for TICKET-012.' > /tmp/sdd-implement.jsonl
npx @beligent/sdd-framework usage footer \
  --agent codex --skill sdd-implement --file /tmp/sdd-implement.jsonl
npx @beligent/sdd-framework usage import \
  --agent codex --skill sdd-implement --task TICKET-012 \
  --file /tmp/sdd-implement.jsonl
```

For Claude Code, capture structured streaming output so multi-turn usage can be
summed when the final result does not contain an aggregate:

```sh
claude -p --output-format stream-json --verbose \
  'Use sdd-implement for TICKET-012.' > /tmp/sdd-implement.jsonl
npx @beligent/sdd-framework usage footer \
  --agent claude --skill sdd-implement --file /tmp/sdd-implement.jsonl
npx @beligent/sdd-framework usage import \
  --agent claude --skill sdd-implement --task TICKET-012 \
  --file /tmp/sdd-implement.jsonl
```

Imports default to `.sdd/beligent/usage.jsonl`, reject linked stores, and deduplicate
the same agent/skill/task/source combination. Treat this as local operational
data and normally add `.sdd/beligent/usage.jsonl` to the consumer project's
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
