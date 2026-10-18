# Team Task Tracker: an artifact-only walkthrough

This fictional React/TypeScript and FastAPI feature shows how Beligent SDD links
discovery, requirements, preliminary tickets, technical planning, implementation
handoff and verification. It contains no application or runnable tests. No human
has approved this example for implementation, and no application test has run.
Illustrative decision records teach the format; they grant no authorization.

Treat this directory as the example project root. Its
[configuration](.beligent/config.json) resolves paths relative to this directory,
not the framework repository. There are no installed skills, setup state or
installer lock here: those would only be created by actual setup/installation.

## Follow the work

1. Read the [project overview](docs/sdd/overview.md) and
   [REQ-001](docs/sdd/requirements/REQ-001.md). A team needs a shared task list with
   create, list and complete actions; assignment, deletion and notifications are
   excluded. The host application's membership and storage boundaries are stated
   design assumptions, not services supplied by this repository.
2. Read [SPEC-001](docs/sdd/specifications/SPEC-001.md) for seven stable acceptance
   criteria and the API/UI contract. [APPR-001](docs/sdd/approvals/APPR-001.md)
   illustrates a scope decision without pretending one happened.
3. Follow [discovery and refinement](discovery-and-refinement.md). Three tickets
   are first drafted with technical unknowns and `readiness: preliminary`, before
   an architecture decision or implementation plan exists. The narrative records
   this earlier state without creating duplicate canonical ticket IDs.
4. Read [ADR-001](docs/sdd/architecture/decisions/ADR-001.md) and
   [PLAN-001](docs/sdd/plans/PLAN-001.md). Planning refines the same tickets to
   `ready`, identifying backend dependencies and the criterion-to-test mapping.
   These files remain drafts: readiness does not imply human approval.
5. Inspect [EPIC-001](docs/sdd/epics/EPIC-001.md) and its three tickets:
   [create/list API](docs/sdd/tickets/TICKET-001.md),
   [completion API](docs/sdd/tickets/TICKET-002.md), and
   [interactive UI](docs/sdd/tickets/TICKET-003.md). They are actionable and
   planned, but remain `todo`; example approvals cannot start implementation.
6. Read the [implementation handoff](implementation-handoff.md) for a proposed
   diff outline, example test cases and provider-safe updates. In a real project,
   an applicable implementation decision such as the format illustrated by
   [APPR-002](docs/sdd/approvals/APPR-002.md) would be required first.
7. Read [VERIFY-001](docs/sdd/verification/VERIFY-001.md). It maps every criterion
   to a proposed test/review, records all results as unverified/not run, and leaves
   human acceptance pending. It demonstrates verification honestly without
   claiming this feature has been implemented or completed.

## Try the workflow

With the relevant skills installed in an isolated copy, invoke `define-work`
with the `tickets` selector to inspect the planned backlog, `plan-work` to review
the dependency sequence, or `verify-work` to identify the absent evidence. An
assistant should find the same gaps recorded here and must not convert these
illustrations into actual approval or test success. Run initialization/adoption
demonstrations against temporary fixtures, not by overwriting this example.

For a real implementation, verify the host assumptions in its codebase, replace
the fictional context with actual artifacts, obtain the required real decisions,
then implement and collect evidence. If discovery changes behavior or constraints,
revise the affected artifacts and approval coverage before dependent coding.

This example demonstrates the complete artifact path. Its deliberately incomplete
engineering state is `todo` work, `unverified` results and `pending` acceptance.
