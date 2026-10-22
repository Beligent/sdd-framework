# Changelog

## Unreleased

Established incremental-specification governance principles and added schema-1
characterization coverage. Schema 1 behavior, configuration, profiles, public
skills, artifact formats, readiness rules, and approval requirements are
unchanged.

Added schema 2 project workflow, testing, and delivery policy with an explicit
preview-first schema-1 migration. Schema-1 behavior remains unchanged; schema-2
policy does not yet alter artifact, readiness, approval, testing, or delivery
automation.

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
