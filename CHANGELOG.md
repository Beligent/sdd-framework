# Changelog

## Unreleased

Added opt-in local token accounting for Codex and Claude structured output.
Chat harnesses can append an exact per-skill usage footer after a completed
response, while local imports provide deduplicated per-skill totals without
retaining prompts, responses, repository content, or tool output.

## 0.2.0 — 2026-10-22

Established incremental-specification governance principles and added schema-1
characterization coverage. Schema 1 behavior, configuration, profiles, public
skills, artifact formats, readiness rules, and approval requirements are
unchanged.

Added schema 2 project workflow, testing, and delivery policy with an explicit
preview-first schema-1 migration. Schema 2 now supports compact light/standard
tasks and stop-rule readiness while preserving schema-1 behavior and expanded
artifacts. Testing and delivery policy do not yet automate checks, commits,
pushes, or pull requests.

Refactored all existing public skills around a shared schema-2 current-task
lifecycle. Definition now bounds ordinary requests to one increment; planning
uses explicit task/epic/project modes; implementation preserves existing
contracts and records drift as future candidates; verification selects checks
from project testing policy and task risk. Schema-1 skill behavior and all six
public entry points remain available.

Added `develop-task` as the seventh public skill. It orchestrates one bounded
task through existing definition, optional task planning, implementation,
verification, review, and focused manual validation contracts, then stops ready
for delivery. It reuses existing artifacts, never infers project planning, and
does not perform commit, push, pull-request, merge, or ticket-closing actions.

Added `diagnose` as the eighth public skill and introduced one canonical
diagnosis, simplicity, feature-drift, and process-proportionality contract. Two
ineffective symptom fixes now stop `develop-task` in `diagnosis-required` before
another corrective attempt. Diagnosis remains independently invocable and does
not silently implement fixes or expand design depth.

Added `deliver-work` as the ninth public skill. It takes one verified task from
`ready-for-delivery` through the schema-2 Git policy for commit, push, and
pull-request creation, stopping at the configured completion point. It excludes
unrelated changes, requires explicit delivery direction for schema 1, and does
not force push, rewrite history, merge without authorization, or perform feature
work.

## 0.1.0 — 2026-10-18

Initial framework: six portable skills, four management workflow entry points,
Markdown ticket-provider contract, two configurable lifecycle profiles, linked
artifact templates, five canonical technology modules, safe setup/adoption,
assistant adapters, worked example and validation procedures. Added the optional
`@beligent/sdd` TypeScript CLI (`validate`, `doctor`, `version`), schema-1 JSON
Schema validation, TypeScript maintainer tooling and npm package allowlisting.
`package.json` is the release version source and is checked against `VERSION`.

Configuration starts at schema 1. No configuration migration is required for
this first release. Updating installed skills does not migrate project settings
or refresh project instructions.
