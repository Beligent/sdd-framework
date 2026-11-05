# Customize project settings

Use the [default configuration](../skills/sdd-init/assets/config.json) and
`schema/config.schema.json`. Every configuration declares
`"schema": "beligent-sdd/config/v2"`; unknown keys and earlier configurations are
rejected. Keep local guidance in `.sdd/beligent/guidance/`; do not edit installed
skill copies for project preferences.

| Setting | Effect |
| --- | --- |
| `hosts` | Assistants to integrate: `codex`, `claude-code`, `github-copilot`, `cursor`, `devin`. Selection does not prove discovery |
| `stacks` | Stack guidance to load when relevant: React/TypeScript, Next.js, Node.js, Python, FastAPI. Project conventions override generic stack advice |
| `checks` | Project commands (`id`, `command`, `required`). Required checks must pass before any tracked ticket closes |
| `tracking.required_for` | Kinds of change the assistant must flag before editing, so you can choose to track them |
| `tracking.authorization` | `request` (default): implementing a named ticket is the authorization. `recorded`: a ticket needs `authorization` for its current revision before implementation |
| `delivery.commit`, `push`, `pull_request` | `allowed`, `ask` (default) or `never` |
| `delivery.delivered_at` | Observed delivery milestone: `commit`, `push`, `pull-request` or `merged-pr` (default) |

No setting can turn an unrun check into a pass, and delivery never gates ticket
completion. Keep exactly five public skills; add focused resources inside their
packages and synchronize shared copies.
