# Validation report

## Current TypeScript tooling and npm package checks

Date: 2026-10-22. Framework/package version: 0.1.0. Configuration schemas: 1 and 2.

The TypeScript migration preserves the original validation scenarios and moves
framework-maintainer tooling out of Python. `tests/framework.test.ts` has 57
tests covering config safety, deterministic packaging, Markdown/ticket graph
validation, CLI behavior, and package version agreement.

| Check | Observed result |
| --- | --- |
| TypeScript typecheck and ESLint | Passed |
| Vitest | 57 tests passed after Increment 4 validation |
| Shared resource drift and full framework validation | Passed |
| `VERSION` and `package.json` agreement | Passed at 0.1.0 |
| `npm pack --dry-run` allowlist check | Passed; 88 intentional files |
| Packed CLI smoke | Extracted package printed version and validated the worked example configuration |
| npm dependency audit | Zero vulnerabilities after upgrading the test runner |

The package remains unpublished. The `beligent/sdd` GitHub source and npm scope
are provisional metadata/documentation values and must match the actual public
repository and npm organization before release.

Increment 1 adds canonical governance principles and schema-1 characterization
coverage only. Increment 2 adds schema-2 policy configuration and an explicit
migration path. Increment 3 adds schema-2 compact light/standard tasks and
stop-rule readiness. Increment 4 refactors the six existing public skills around
one packaged current-task lifecycle contract and adds deterministic routing and
expanded-artifact compatibility coverage. Schema-1 behavior, skill count, and
delivery automation remain unchanged.

## Initial MVP validation report (historical)

Date: 2026-10-18. Framework: 0.1.0. Project configuration: schema 1.

This section records the original Python-based MVP checks before the TypeScript
tooling migration. Current checks are listed above. The task-tracker example
contains illustrative product evidence only: no application was built and none
of its acceptance criteria is claimed as passed.

## Environment and deterministic checks

Local environment: Python 3.13.5, PyYAML 6.0.3 in an isolated validation virtual
environment, Node.js 22.20.0, npm 10.9.3 and pinned `skills@1.7.2`.
Only the development validator requires PyYAML; configuration checks use the
standard library. Dependency caches and evaluation targets were temporary and
outside the framework repository.

| Check | Observed result |
| --- | --- |
| Unit tests | 31 tests passed; configuration, JSON/YAML parsing, unsafe paths, packaging/no-op behavior and ticket traceability/approval structure |
| Bundled Codex skill-creator `quick_validate.py` | All six skill manifests passed |
| Complete repository validation | Passed for six skills, required templates, local links and example traceability |
| Canonical/package consistency | Read-only drift check passed |

The regression suite caught and now checks criterion references belonging to
an unlinked specification and completion approval for a similarly prefixed but
different ticket ID. Ready/todo tickets do not require fabricated approval.
An approved-field shape is structural evidence only; a human still verifies the
decision source and whether the covered behavior was actually accepted.

## Independent setup walkthroughs

An evaluator who did not author setup used individually copied skill directories
and ordinary bounded file operations in temporary projects. No general setup
implementation or custom installer was created.

| Scenario | Observed result |
| --- | --- |
| Empty project; Codex; React/TypeScript + FastAPI; lightweight | Config, ownership state, AGENTS section and overview created; actual hashes validated |
| Initialization repeat | Zero bytes or nanosecond modification-time changes across 4 files and 13 directories |
| Existing Python project; handwritten AGENTS/CLAUDE and requirements | Read-only audit/proposal created nothing in the target before fixture integration authorization |
| Reviewed adoption | Exact reviewed config/sections applied; requirements directory reused; handwritten prefixes, manifest and requirement content preserved |
| Adoption repeat | Zero bytes or nanosecond modification-time changes across 7 files and 13 directories |
| Locally edited managed section | Baseline conflict reported; zero writes; local text retained for separate merge review |
| Unsupported schema 2 fixture | Migration/compatible-skill proposal; zero writes; no inferred downgrade |

Fixture application was authorized within the user's approved framework-validation
scope. It grants no consumer-product implementation/completion decision. The
evaluator initially noted that the narrative overview had no artifact frontmatter;
governance now explicitly permits overview/convention notes identified by path.

## Real installer checks

Ran pinned `skills@1.7.2` against a local framework source. Copy mode was tested
separately for Codex, Claude Code and GitHub Copilot, and together. Each set
contained all six skills. Codex/Copilot used `.agents/skills`; Claude used
`.claude/skills`. Source-byte comparisons and installed runtime-reference
containment checks passed. A final combined copy installation after resource
updates verified 12 installed directories, 128 source-byte comparisons and
containment for 80 runtime Markdown documents.

Default mode with both Codex and Claude created six Claude links to the canonical
`.agents/skills` directories. Single-Claude default mode copied. The local
installer wrote `skills-lock.json` with `sourceType: local`, a relative source
path and content hash.

Reinstalled from a separate temporary framework source with a harmless change
to `init-project/SKILL.md`. Only its two installed copies and `skills-lock.json`
changed; project configuration, integration state, instruction files, overview,
ticket and application fixture stayed byte-identical. This establishes the
tested local reinstallation boundary, not the behavior of a remote update.

## Management workflow checks

An independent evaluator used a copied `define-work` package with four separate
sets of supplied inputs. Requirements, specification, epic and ticket routes
each produced their requested drafts without executing unrelated routes or
creating architecture, application code or approval artifacts. Records remained
preliminary and raw inputs were preserved.

The Markdown provider procedure supported create/read, list/filter, refinement,
prioritization, dependency linking and a reasoned blocked transition. Queries
made no record changes. Attempts to enter `in-progress` and `done` without
readiness, planning, authorization/evidence were rejected without writes. A
competing edit changed the observed content digest; the stale update reported a
conflict, made zero writes and retained the competing text. No blocking usability
gap was observed. These are bounded instruction-driven evaluations, not execution
of a general provider program or proof of atomic compare-and-swap behavior.

The worked example and deterministic graph checks additionally cover
preliminary-to-ready planning, criterion references, dependency cycles, duplicate
IDs and completion structure.

## Delivered backlog

| Item | Delivered artifacts |
| --- | --- |
| MVP-001 | Contributor instructions, architecture, terminology, lifecycle, ownership/version boundaries, license and version |
| MVP-002 | Eight artifact templates plus approval and adoption-plan formats |
| MVP-003 | Four independent management routes, normalized provider contract, Markdown mapping and planning skill |
| MVP-004 | Implementation/verification skills with testing, TDD, review, security, documentation and refactoring |
| MVP-005 | Five canonical technology modules and required planning copies |
| MVP-006 | Setup/adoption skills, conservative ownership procedure and assistant adapters |
| MVP-007 | Full-stack artifact walkthrough, onboarding, customization and maintenance docs |
| MVP-008 | Deterministic checks, unit tests, copied-skill evaluation and real installation/reinstallation checks |

## Limits

Live discovery/automatic invocation in Codex, Claude Code, Copilot VS Code/CLI
or the Copilot cloud agent was not exercised. Instruction/layout compatibility
is documented; assistant behavior is not certified. Remote Git installs, immutable
remote pins and `skills update` were not smoke-tested. Windows behavior was not
executed, though path validation and copy-based packaging cover relevant local
invariants. The GitHub Actions workflow is supplied but was not run remotely.

Ticket/provider and setup behavior are instructions carried out by an assistant,
not a runtime with transaction guarantees. Validation cannot certify human
consent, correctness of arbitrary project tests, every YAML feature or all
possible assistant decisions. Temporary raw snapshots remain outside the repo;
the durable procedures for reproducing the checks are in [validation](validation.md).
