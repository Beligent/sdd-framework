# Customize project policy

Use the [default configuration](../skills/sdd-init/assets/config.json) and
`schema/config.schema.json`. The configuration has no version field. Unknown
keys and old versioned configurations are rejected; review conversions explicitly.
Keep reviewed local/project guidance in .sdd/beligent/guidance/ and refresh it
with ownership/conflict checks; do not edit installed skill copies for project preferences.

`tracking.mode: opt-in` keeps ordinary work in chat. Explicit tracking, implementing a named
task or a durable artifact request selects persistence for that scope. Set
`always` only by reviewed project choice. Paths remain lazy destinations.

`workflow.rigor` is light, standard or rigorous; `workflow.design_depth` is
current-task, near-term or comprehensive. `ask_before_expansion` gates
consequential deeper design. Rigor never implies planning every future task.
Rigor changes review depth without requiring unrelated artifacts or universal
completion approval gates. Tickets may stand alone at any selected rigor.

Testing categories use always/when-relevant/never and specialized values in the
schema. Apply conditions literally to changed behavior/risk. Useful tests and
actual check execution belong inside implementation. No policy can turn an
unrun check into a pass; report unavailable infrastructure explicitly.

Git policy selects branch strategy, commit permission/style, push/PR behavior,
review and delivery completion point. It applies only within actual authorization and
safe repository state. Observed delivery is independent of ticket done.

Assistants use portable slugs, including additional tools when compatible; a slug
does not establish tested discovery. Technology modules cover React/TypeScript,
Next.js, Node.js, Python and FastAPI and load only when relevant. Project
conventions override generic stack advice.

Keep exactly five public skills. Add focused routes/resources inside their
packages, retain canonical shared-resource ownership, and synchronize copies.
