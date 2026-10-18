# Team Task Tracker

Status: draft, fictional worked example. No application has been implemented.

## Purpose and users

Small project teams need a shared list of work with a clear open/completed state.
A signed-in team member can create, list and complete tasks for a team they
belong to. The feature should fit an existing React/TypeScript UI and FastAPI
service rather than establish another identity or storage platform.

## Context and boundaries

For this design exercise, assume a host application supplies authenticated
identity, a team-membership resolver and durable storage through an adapter.
Those are fictional host capabilities, not code in this example. A real project
must confirm them before using the ready tickets. No database, ORM, auth library,
test runner or deployment platform is selected here.

Scope is task creation, listing and one-way completion. Exclude task editing,
deletion, assignment, due dates, team management, notifications, offline operation
and pagination. Reopening completed tasks is also excluded.

## Technology and conventions

- React with TypeScript for the team task view; Python/FastAPI for HTTP behavior.
- Preserve the consuming project's supported versions and tooling.
- Follow [project conventions](conventions/engineering.md); these are example
  agreements, not a replacement for a real host's instructions.
- Use the [configuration](../../.beligent/config.json) for the standard profile
  and project-relative artifact/provider locations.

## Next work

The behavioral contract is [REQ-001](requirements/REQ-001.md) and
[SPEC-001](specifications/SPEC-001.md). The
[backlog](epics/EPIC-001.md) is planned but unimplemented. Scope and implementation
decisions are [illustrations](approvals/APPR-001.md), not real authorization.
