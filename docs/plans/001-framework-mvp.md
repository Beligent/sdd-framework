# Beligent SDD: initial architecture and MVP backlog

Status: approved for implementation; see the linked decision record below.
Proposal revision: 2.
Prepared: 2026-10-18.
Target framework version: 0.1.0.

## Objective and starting state

Build `beligent-sdd`, a portable, agent-agnostic Spec-Driven Development
framework for structured AI-assisted software engineering. This repository
contains the reusable framework, not an application built with it.

Inspection found an empty working directory at
`/Users/z/dev/beligent-sdd-framework`, with no existing instructions or Git
repository. Preserve that directory name; use `beligent-sdd` as the framework
identity. Implementation will initialize local Git metadata without creating a
remote, making a commit, or publishing anything.

The supplied brief requests an architecture and MVP backlog first, followed by
implementation of the approved design. This proposal is the only project file
created during that initial stage. Revision 1 was broadly approved in principle,
subject to the five adjustments incorporated below. The user subsequently
approved revision 2 and authorized implementation; see
[APPR-001](001-framework-mvp-approval.md). The following sections preserve the
approved design and backlog.

## Revision 2 changes

1. Keep six skills and expose requirements, specification, epic and ticket
   workflows as independent entry points within `define-work`.
2. Introduce a documented ticket-provider contract with Markdown as the initial
   backend; management workflows operate independently of storage.
3. Make technology guidelines a single canonical source, with generated copies
   only where independent skill installation requires them.
4. Permit preliminary epics and tickets before detailed architecture, followed by
   refinement after technical planning.
5. Separate installed-skill updates, project configuration migrations and managed
   instruction refreshes, with independent versioning and approval boundaries.

## Architecture

Use Markdown artifacts, six portable Agent Skills, two workflow profiles, and
small assistant-specific instruction adapters. The methodology remains usable
without executing a framework program.

| Concern | Responsibility | Boundary |
| --- | --- | --- |
| Management | Discovery, independently invocable requirements/specification/epic/ticket workflows, priorities, acceptance criteria and change control | Defines what and why; owns product artifacts through a storage-neutral ticket contract |
| Engineering | Architecture, ADRs, implementation plans, code, tests, reviews and verification | Consumes approved management artifacts and links evidence back to them |
| Technology guidance | React/TypeScript, Next.js, Node.js, Python and FastAPI recommendations | Loaded only for selected technologies; existing project choices take precedence |
| Agent integration | Instruction discovery, installation locations and invocation examples | Thin adapters; no duplicated workflow implementations |

There are no agent personas, runtime services, orchestration engine, application
UI, database, npm package, or custom installation CLI in the MVP.

### Proposed repository structure

```text
AGENTS.md                       # concise instructions for framework contributors
README.md                       # purpose, quick start, adoption and usage
LICENSE                         # proposed MIT license
VERSION                         # framework version, initially 0.1.0
CHANGELOG.md
docs/
  architecture.md
  terminology.md
  lifecycle.md
  artifact-model.md
  installation.md
  adoption.md
  agents.md
  customization.md
  maintenance.md
  validation.md
  plans/001-framework-mvp.md
skills/
  init-project/
    SKILL.md
    assets/                     # configuration, overview and instruction fragments
    references/                 # setup and assistant discovery guidance
  adopt-project/
    SKILL.md
    assets/                     # adoption plan and packaged setup resources
    references/
  define-work/
    SKILL.md
    assets/                     # requirements, specification, epic and ticket
    references/
      workflows/                # requirements, specification, epics, tickets
      ticket-management/        # provider contract and initial Markdown backend
      change-control.md
  plan-work/
    SKILL.md
    assets/                     # ADR and implementation plan
    references/                 # architecture and selected technology guidance
  implement-ticket/
    SKILL.md
    references/
      technology/               # sole canonical source of five technology guides
      ...                       # implementation and testing procedures
  verify-work/
    SKILL.md
    assets/                     # verification report
    references/                 # code/security review and acceptance verification
scripts/                        # small validation and asset-consistency helpers
tests/                          # setup, packaging and preservation scenarios
examples/
  team-task-tracker/            # worked artifacts and walkthrough; no runnable app
.github/workflows/validate.yml   # repository validation only
```

Each skill describes its purpose, preconditions, inputs, procedure, outputs,
validation and approval boundaries. Detailed procedures and templates are loaded
only when needed. The root `AGENTS.md` governs framework contributions; its
consumer-project template is a separate asset.

### Skill responsibilities

| Skill | Trigger and result |
| --- | --- |
| `init-project` | Set up SDD in a new repository: identify project type and assistant, propose paths/configuration, then establish instructions and artifact locations without scaffolding an application |
| `adopt-project` | Audit an existing repository, inventory instructions and artifacts, propose an integration diff, obtain approval, apply missing capabilities and report conflicts |
| `define-work` | Discover and clarify work; independently invoke requirements, specification, epic or ticket workflows; create and refine the backlog through the configured ticket provider |
| `plan-work` | Analyze architecture, record consequential decisions, prepare an implementation plan and feed refinements back into preliminary tickets for approved behavior |
| `implement-ticket` | Implement approved tickets, use appropriate tests and test-driven development, update documentation and record evidence without inventing approval or completion |
| `verify-work` | Review code and relevant security concerns, map acceptance criteria to evidence, report gaps and prepare completion for human acceptance |

Refinement, documentation, refactoring and change management are procedures
within these skills, rather than separate personas or additional tools.

### Independently invocable management workflows

`define-work` is the management entry skill, not a requirement to run an entire
sequence. Each named workflow has its own inputs, procedure, outputs and checks;
it can be invoked directly or resumed with existing artifacts. Missing inputs
are reported for that workflow rather than triggering unrelated stages.

| Workflow | Inputs and result |
| --- | --- |
| `requirements` | Project context and a requested outcome -> elicited functional/non-functional requirements, PRD content, open questions and acceptance criteria |
| `specification` | Relevant requirements or an approved lightweight behavioral contract -> observable behavior, interfaces, constraints and criterion references |
| `epics` | Requirements/specifications and an outcome or delivery grouping -> create or refine epics with linked scope and candidate tickets; detailed architecture is optional for preliminary records |
| `tickets` | A ticket operation and relevant context -> create, read, list/filter, refine, prioritize, link dependencies or update ticket status through the configured provider |

For example, ask an assistant to use `define-work` with workflow `specification`
for `REQ-001`, or workflow `tickets` to refine `TICKET-003` against `PLAN-001`.
These are portable workflow selectors in prompts, not additional skills or a
promise of identical slash-command syntax across assistants.

### Ticket management abstraction

Define a small documented provider contract, implemented initially by Markdown
procedures and templates. This is a methodology boundary, not a runtime service,
plugin loader or custom CLI. Management workflows express semantic operations;
the configured provider handles storage locations, serialization and native
backend fields. All epic/ticket reads and writes use this boundary, including
refinements from planning and implementation/verification status updates.

The contract covers create, read, list/filter, update, dependency linking and
lifecycle transitions for tickets and epics. A normalized record contains a
stable framework ID, kind, title, description/scope, requirement/specification
references, acceptance criteria, priority, dependencies, lifecycle status,
planning readiness, approval references and evidence links. Provider metadata
holds the storage locator and revision needed to detect conflicting updates.
Framework IDs remain stable independently of file names or tracker issue numbers.

The initial Markdown provider maps these records to the configured epic/ticket
directories and templates. Workflow instructions refer to contract fields and
operations rather than relying on hard-coded paths or Markdown headings. A
provider extension supplies native field/status mappings and must preserve
traceability, approval semantics and conflict reporting. Unsupported operations
are reported explicitly rather than silently approximated.

Future GitHub Issues or other tracker providers implement this same contract;
the requirements, specification, epic and ticket workflows remain unchanged.
Each record has one authoritative backend, without a competing Markdown mirror.
Remote providers and ticket-data migration tooling are outside the MVP; the
contract and extension instructions are included now.

### Packaging and installation

Distribute through Git and the existing `npx skills` installer. Provide a
local-checkout installation path first, so the README does not invent a GitHub
organization or require this repository to be published. Document remote pinned
installation when an actual upstream URL is available. Node/npm is required only
when choosing `npx skills`, not to use the methodology.

Runtime resources must live inside each installed skill directory. Installed
skills must not reference `../../templates` or other source-repository files.
Give each substantive resource one canonical owner. The five technology guides
are authored only in `skills/implement-ticket/references/technology/`; root docs
index that source. Select guides by project configuration. Planning uses the
same guides when relevant rather than maintaining its own recommendations.

Only when an independently installed skill needs a resource outside its folder,
package a byte-for-byte copy from the canonical source into that skill. This
applies to needed technology guides, the ticket-provider contract and genuinely
shared setup fragments; avoid copying unused resources by default. Generated
copies identify their canonical
source and are never edited directly. Use a small deterministic helper with a
fixed source/destination list and read-only drift checks. Commit packaged copies
so consumers need no build step. The helper neither installs skills nor changes
project configuration; no general asset pipeline is introduced.

Use copy-based project installation for the documented baseline, avoiding
platform-dependent symlink assumptions. Validate the installer's default linking
mode separately where supported. Explain the initial bootstrap: install a setup
skill into the target project before invoking it, then install other skills as
needed. Setup must not claim that a source repository's `skills/` directory is
automatically discoverable.

### Project-owned configuration and artifacts

```text
.beligent/
  config.json                   # schema version and project/provider choices
  setup-state.json              # owned files/sections and baseline hashes
docs/sdd/                       # default only; reuse existing locations on adoption
  overview.md
  requirements/
  specifications/
  architecture/decisions/
  epics/
  tickets/
  plans/
  verification/
  approvals/
  conventions/                  # optional project-specific guidance
```

Use JSON for the small initial configuration: it supports deterministic
validation with Python's standard library and avoids a runtime YAML dependency.
Skill manifests still use the standard YAML frontmatter. Configuration records
the configuration schema version, project identity, selected assistants, profile,
technology modules, artifact locations, approval policy and ticket provider
(initially `markdown`). A project can override paths and add conventions without
editing an installed skill. Backend-specific ticket settings belong under that
provider's configuration; workflows use the provider contract.

Use the installer's own lock file for installed-skill provenance rather than
creating a competing dependency lock format. `setup-state.json` tracks only
project integration ownership, applied integration revision and baselines.
Framework release/installed revision and project configuration schema version
are independent; a skill update does not rewrite configuration to record its own
version. Preserve project artifacts and customizations outside replaceable skill
directories.

## Lifecycle, approvals and traceability

Standard flow, with optional early backlog drafting:

```text
Discovery -> Requirements/specification -> [Preliminary epics/tickets]
          -> Architecture/plan <-> Ticket refinement -> Implementation approval
          -> Implementation -> Tests/reviews -> Verification
```

Preliminary tickets may be created as soon as useful context exists, before a
completed specification or detailed architecture. Record assumptions, unresolved
questions and missing references explicitly; mark planning readiness as
`preliminary`. Architecture is not a gate for drafting or managing the backlog.
Projects may instead defer ticket creation until after planning.

Technical planning refines ticket scope, estimates where useful, dependencies,
acceptance criteria and test approach through the same management/provider
contract. Move readiness to `ready` only once the selected profile's planning
needs and behavioral references are satisfied. Readiness does not itself imply
human approval. Implementation consumes the current approved ticket/plan
revisions; preliminary records cannot authorize coding.

Iteration can return to any earlier stage, including requirements/specification
after technical findings. Feed changes back into canonical management artifacts
rather than duplicating or silently changing expected behavior. Independent
workflow invocation supports refinement without restarting the full lifecycle.

| Profile | Minimum artifacts | Human decision points |
| --- | --- | --- |
| Lightweight | A ticket containing context, expected behavior, criteria and a short plan; verification evidence may be in that same file | Approve implementation scope before coding; accept completion after verification |
| Standard | Overview, requirements/specification, plan, tickets and verification; epics/ADRs where their scale or decisions justify them | Approve scope; approve implementation-ready plan and tickets; accept completion |

Profiles can change artifact depth and combine decisions. Explicit authorization
already given for the same concrete scope can satisfy a gate; do not ask for the
same approval again. An agent can draft an approval record from a real user
decision, but cannot approve its own work, fabricate an approver, or treat silence
or passing tests as human acceptance. Approval records identify the human,
decision, scope, artifact revision and source of authorization. Material changes
to approved scope, behavior, acceptance criteria, constraints or implementation
plans invalidate the affected approval and require a new decision before
dependent implementation. Small drafting edits do not create extra gates.

Supply the eight requested templates: project overview, requirements document
(including PRD content), technical specification, ADR, epic, development ticket,
implementation plan and verification report. Include a small approval/change
record format where required by a gate.

Use stable IDs and relative Markdown links for local artifacts; provider records
may resolve to tracker URLs in future. Keep logical identity separate from its
storage locator. Example trace:

```text
REQ-001 -> SPEC-001 / AC-001 -> TICKET-001 -> PLAN-001
                            -> implementation evidence -> VERIFY-001 / AC-001
```

Tickets name their motivating requirements, defining specification, acceptance
criteria, dependencies, priority, scope and implementation state. Verification
maps each applicable criterion to an observed test or review result, including
failures and unverified claims. Keep lifecycle status, planning readiness and
approval status distinct. Draft records may have unresolved references; ready
records must satisfy the selected profile's traceability requirements. A
lightweight ticket may hold the behavioral contract and its criteria instead of
requiring otherwise empty requirement/specification documents.

## Safe setup and updates

`adopt-project` begins with a read-only audit of applicable instructions,
architecture, documentation, tests, existing specifications/backlogs and skill
configuration. It reuses existing artifacts and paths where possible. Its
integration proposal names files, exact managed sections, conflicts and the
expected changes before requesting configuration approval.

Preserve user-owned text. Add a small identifiable managed section when safe;
propose manual integration if instruction precedence or existing content makes
that ambiguous. Repeat setup with identical inputs must produce no changes.
Compare owned content against recorded baselines before updates; local edits
require a merge proposal, not an overwrite. Report additions, changes, skipped
files and unresolved conflicts.

Treat maintenance as three separate, reviewable operations:

| Operation | Changes | Boundary |
| --- | --- | --- |
| Framework skill update | Installed skill instructions/resources and installer provenance | Select a revision and review its diff; leave project configuration, instructions and artifacts untouched |
| Project configuration migration | `.beligent/config.json` from one schema version to another | Explicitly propose the schema diff and preservation/rollback approach, obtain approval, then validate the migrated configuration |
| Integration refresh | Framework-managed sections of project instruction files and their setup-state baselines | Review separately, preserve user-owned content and resolve local edits before applying approved changes |

An installed-skill update never implicitly migrates configuration or refreshes
project instructions. Newer skills check schema compatibility first. If the
project schema is unsupported, explain the mismatch and propose the documented
migration path before affected writes; do not infer a conversion or silently
regenerate configuration. Compatibility declarations can allow a newer skill to
use an unchanged supported schema.

The MVP starts with configuration schema 1, documents the migration procedure
and validates compatibility guards. Ship concrete migration rules only when a
real schema change requires them, rather than inventing historical migrations.
Full commit pins give a stronger reproducibility guarantee than mutable
branch/tag names. No automatic background update mechanism is included.

## Compatibility evidence and limits

Checked official documentation and installer source on 2026-10-18:

| Integration | Initial implementation target | Validation claim allowed |
| --- | --- | --- |
| Codex | `AGENTS.md`, project `.agents/skills`, documented skill invocation | Documented discovery plus tested installation layout; live smoke test only if actually run |
| Claude Code | `.claude/skills`; thin `CLAUDE.md` import of `AGENTS.md` where needed | Documented discovery; preserve existing Claude instructions and verify imports in a live smoke test when available |
| Copilot | Shared skill directories supported by the selected surface; concise `.github/copilot-instructions.md` bootstrap where needed | Report VS Code, CLI and cloud support separately; a local install does not establish cloud availability |

The current Claude documentation also describes direct `AGENTS.md` loading with
version/configuration limits. A small explicit import is a useful compatibility
adapter; do not assume that every installed version loads the same files.
Instruction-based approval gates are a methodology convention, not a technical
security boundary enforced identically by every assistant.

Sources supporting these decisions:

- [Agent Skills specification](https://agentskills.io/specification): skill format and packaged resources.
- [Official OpenAI skill documentation](https://learn.chatgpt.com/docs/build-skills) and [AGENTS.md discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md): Codex discovery and invocation.
- [Claude Code skills](https://code.claude.com/docs/en/skills) and [instruction loading](https://code.claude.com/docs/en/memory): project skills and imports.
- [Copilot Agent Skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills), [VS Code skills](https://code.visualstudio.com/docs/agent-customization/agent-skills), and [Copilot CLI skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills): supported surfaces and paths.
- [Existing skills installer](https://github.com/vercel-labs/skills), [installation implementation](https://github.com/vercel-labs/skills/blob/main/src/installer.ts), [source parsing](https://github.com/vercel-labs/skills/blob/main/src/source-parser.ts), and [update behavior](https://github.com/vercel-labs/skills/blob/main/src/update.ts): copy boundaries, pin syntax and update considerations.
- [GitHub Spec Kit](https://github.com/github/spec-kit) and [BMAD](https://github.com/bmad-code-org/BMAD-METHOD): architectural references for durable artifacts and adjustable workflow depth, without importing their full systems.

## Ordered MVP implementation backlog

The approved implementation order is retained below. Independent documentation
and resource authoring may proceed in parallel. Current delivery evidence is
recorded in the validation report rather than inferred from this backlog.

| ID | Work item | Acceptance criteria |
| --- | --- | --- |
| MVP-001 | Repository and framework contracts | Local Git repository, MIT license, version, contributor instructions, terminology, lifecycle, artifact model and project/framework boundary are documented; ticket-provider operations and normalized records, independent management entry points, and skill-version/config-schema boundaries are defined |
| MVP-002 | Canonical artifact templates | All eight templates and approval/change format exist; IDs, links and criteria support requirements-to-verification traceability; epic/ticket templates implement the normalized record and distinguish preliminary readiness, lifecycle and approval |
| MVP-003 | Management workflows, Markdown provider and planning | `define-work` independently invokes requirements, specification, epics and tickets with valid inputs/outputs; the Markdown provider realizes contract operations; `plan-work` refines preliminary tickets without requiring detailed architecture before drafting; both profiles consume canonical behavior |
| MVP-004 | Implementation and verification skills | `implement-ticket` and `verify-work` enforce applicable approvals, record evidence, cover testing (including TDD where appropriate), review, security, documentation and refactoring, and report unverified criteria honestly |
| MVP-005 | Canonical technology modules | All five modules have one canonical source covering architecture, coding, tests, validation and maintainability without mandated infrastructure choices; only portability-required copies are packaged and checked against that source |
| MVP-006 | Setup, adapters and maintenance boundaries | `init-project` and `adopt-project` support provider configuration and preserve existing instructions/artifacts; demonstrate discovery, approval-before-adoption and repeat behavior; document skill updates, config migrations and integration refreshes as separate operations with schema guards |
| MVP-007 | Example and onboarding docs | A React/TypeScript plus FastAPI feature demonstrates independent management workflow invocation, preliminary tickets before architecture and refinement after planning, the Markdown provider, and requirements-to-verification traceability; approvals/evidence are labeled illustrative; docs cover provider extension and the three maintenance operations |
| MVP-008 | Validation and packaging | Validate manifests, assets, links, canonical-guide packaging and traceability; demonstrate four management entry points, Markdown contract operations, preliminary-to-ready refinement, self-contained installations, safe setup/repeat, skill updates preserving project state, schema incompatibility without writes and integration-refresh conflicts |

## Validation plan and completion criteria

Use small deterministic Python helpers for repository/configuration validation
and scenario checks. Any validation-only parser dependency must be explicit and
kept out of consumer runtime requirements. Reuse an official skill validator
when available rather than claiming a homegrown partial YAML parser validates
the entire specification.

Exercise setup workflows in isolated temporary repositories: an empty project,
an existing React/TypeScript project, an existing Python/FastAPI project, existing
assistant instructions, existing specifications, repeated setup, changed managed
content and an integration refresh with a local conflict. Separately demonstrate
a skill update leaving project configuration, instructions and artifacts
unchanged, plus an unsupported configuration schema producing a migration
proposal without writes. Check observable preservation and configuration/resource
validity, rather than merely matching headings. Include at least one independent
agent walkthrough of each setup skill; deterministic fixtures alone do not
establish that an instruction-based skill is usable.

Exercise each management workflow directly with existing inputs, without running
the other routes as prerequisites. Validate the Markdown provider's create,
read, filter, update, link and transition operations against normalized records;
confirm that workflow procedures do not embed backend paths or field layouts.
Demonstrate creating preliminary tickets before architecture, refining them
after planning, and requiring current approval before implementation. Check
that packaged technology guides match their one canonical source and that
individually installed skills resolve required resources locally.

Use the real `npx skills` installer against the local source for representative
copy/link installations when executable/network access permits. Record installer
version, commands, outcomes and limitations. An unavailable assistant or
network-dependent check is reported as untested, never as passed. Repository CI
runs deterministic checks; live assistant testing remains a separate documented
procedure.

The MVP is complete when the backlog is implemented, validation passes, the
example demonstrates the traceability chain, and another developer can follow
the documented new-project and adoption paths without requiring an application,
paid service, framework runtime, or modification of reusable framework source.

## Decision recorded

Revision 2 was approved, including the five requested adjustments: independent
management workflow entry points within six skills,
a storage-neutral ticket contract with a Markdown provider, canonical technology
guidelines, iterative ticket planning, and separate skill updates/configuration
migrations. JSON configuration, the proposed MIT license and staged validation
remain as proposed. The decision authorizes creating the local framework
described here. Publishing, remote
repository creation and changes to another real project remain outside this
proposal.

Implementation progress and observed validation are recorded separately in
[the validation report](../validation-report.md), rather than rewriting the
historical backlog as evidence of its own completion.
