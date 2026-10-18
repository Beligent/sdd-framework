# Customization

Edit the consumer project's `.beligent/config.json` to select its profile,
assistant(s), technologies, artifact paths and Markdown ticket locations. Start
from the [schema-1 template](../skills/init-project/assets/config.json). Paths are
relative to the project root and must resolve inside it. Validate a configuration
with `npx @beligent/sdd validate`; this read-only check does not modify the project.

Reuse existing documentation/backlog locations during adoption. Record
project-specific coding conventions under the configured conventions location
and point to them from project instructions. Never put project overrides in
installed skill files: a skill update can replace them. Assistant identifiers
are lowercase slugs; Codex, Claude Code, Copilot, Cursor, and other
Agent Skills-compatible tools can be recorded without changing artifact rules.

Validate a project with the optional Node.js CLI, which does not write files:

```sh
npx @beligent/sdd validate
```

Profiles define required artifact kinds and decisions. Reduce paperwork by
putting a lightweight contract, plan and evidence in a ticket. Add project-specific
profiles by explicit configuration; preserve implementation and completion
approval. For a substantial lifecycle variation, document its entry conditions,
outputs, checks and gates in project conventions and reference them from
`AGENTS.md`.

## Technology modules

The canonical modules are:

- [React and TypeScript](../skills/implement-ticket/references/technology/react-typescript.md)
- [Next.js](../skills/implement-ticket/references/technology/nextjs.md)
- [Node.js](../skills/implement-ticket/references/technology/nodejs.md)
- [Python](../skills/implement-ticket/references/technology/python.md)
- [FastAPI](../skills/implement-ticket/references/technology/fastapi.md)

Combine applicable modules; for example, Next.js may use React/TypeScript and
Node guidance, while FastAPI also uses Python guidance. Installed project
versions and existing conventions decide the applicable APIs. No module selects
a database, ORM, state library, test runner or hosting platform for the project.

To add framework-level guidance, author one module in that canonical directory,
register its slug in configuration validation and the packaging map, and add
only consumers that genuinely need it. Run packaging and validation. For a
single-project convention, use the project's conventions directory instead.

## Workflow and provider extensions

Keep six entry skills. Add focused management routes below `define-work` with
their own input/output contracts, and update the route table. Reuse normalized
ticket operations rather than embedding storage code in a route. A new provider
implements the [contract](../skills/define-work/references/ticket-management/contract.md),
documents native field/status mapping, tests identity/conflict semantics and
declares supported capabilities. Do not dual-write authoritative records.

Assistant-specific behavior belongs in setup fragments or discovery docs.
Avoid tool names and host-specific commands in canonical workflow logic.
