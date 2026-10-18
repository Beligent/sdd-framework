# Markdown ticket provider

Canonical source: `skills/define-work/references/ticket-management/markdown.md`.
Packaged copies retain this declaration and must match the canonical bytes.

Implements the [ticket-provider contract](contract.md) through Markdown files;
no framework runtime or YAML dependency is required for ordinary use. Respect
project tooling when a parser is available; do not claim a partial parser proves
the validity of arbitrary YAML.

## Mapping and configuration

Resolve `tickets.paths.epics` and `tickets.paths.tickets` from
`.beligent/config.json` relative to the project root. Preserve adopted paths.
Use the configured directory for each kind, not a workflow hard-coded location.
Each record is one UTF-8 Markdown file whose YAML frontmatter contains exactly
the normalized scalar/list fields defined by the contract, in the order shown in
the epic/ticket templates. Scope/details remain in the body. Quote string values
when YAML syntax would otherwise change their meaning. Keep lists as lists even
when empty. Provider metadata is not extra frontmatter.

Prefer `<ID>.md` for new records. Resolve existing records by their frontmatter
ID, not file name, and preserve renamed paths. Never change an established ID
when a title/path changes. Search both configured record directories for
duplicate IDs and report ambiguity instead of choosing a copy. Allocate an
unused positive numeric suffix for the appropriate kind; recheck collisions
before creation and do not overwrite. Existing IDs are never renumbered.

`locator` is the project-relative file path. `content_revision` is
`sha256:<hex>` of the complete file bytes at read time, including frontmatter
and body. Compute it with available standard tooling, e.g. Python's `hashlib`
or a SHA-256 utility, rather than inventing a revision string. A write returns
the digest of the resulting bytes. Do not persist this digest inside its own
hashed file.

## Operation procedure

- **Create:** validate the normalized record and referenced IDs; render the
  appropriate epic/ticket template; create a new file exclusively so a collision
  cannot overwrite existing content; read it back and return metadata.
- **Read/list/filter:** enumerate only configured record locations, parse records,
  resolve IDs and return normalized data/metadata. Support contract kind,
  status, readiness, priority and dependency filters plus case-insensitive literal
  text search over title/body. Report invalid/duplicate records rather than
  silently excluding them from an apparently complete result.
- **Update/link/transition:** read the existing record and digest, validate the
  proposed semantic operation, then recheck the expected digest immediately
  before applying a targeted edit. Preserve unrelated body content and formatting
  where possible. Stop without a write when the expected digest differs; return
  the current revision and conflicting changes. Read back and validate the result.

The Markdown provider detects observed concurrent changes; it is not a distributed
transaction service. Avoid simultaneous writers to the same record. If tools
cannot reliably recheck and preserve a file during an edit, present a patch and
report the limitation rather than claiming atomic compare-and-swap guarantees.

Resolve local links relative to their containing artifact, while ID references
use project artifact/record indexes or ID search. Recheck dependencies for cycles
on additions. Respect profile-specific traceability and approval gates for ready
records and status transitions. Queries never modify records; identical updates
leave bytes and digests unchanged.
