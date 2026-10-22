# Python

Canonical source: `skills/implement-ticket/references/technology/python.md`.
Packaged copies must match this source.

Identify supported Python versions, packaging/dependency configuration, import
layout, environment tooling and existing checks. Use that environment and
lock/constraint practice; do not replace the project's package manager, formatter
or test runner as incidental work. Python's
[virtual environment documentation](https://docs.python.org/3/library/venv.html)
describes the standard isolation option when the project needs one.

## Architecture and conventions

Follow existing package boundaries and make domain rules testable without loading
the application where practical. Keep import-time side effects and resource
creation controlled so tools/tests can import modules safely. Prefer clear data
and function boundaries over a new service/repository abstraction for every file.

Add useful type annotations consistent with the repository; do not silence a
real mismatch with broad casts or ignores. Validate external data separately:
Python [type annotations are not runtime enforcement](https://docs.python.org/3/library/typing.html).
Avoid broad exception swallowing; preserve useful causes and follow existing
error translation conventions at public boundaries.

Use context managers or explicit `try/finally` for acquired files/connections and
other resources. Standard [context management tools](https://docs.python.org/3/library/contextlib.html)
support both synchronous and asynchronous cleanup. For async code, preserve
cancellation and bound concurrency/timeouts where relevant. Do not run blocking
I/O directly in an event-loop path or suppress cancellation to hide a failure;
consult the supported version's [async task guidance](https://docs.python.org/3/library/asyncio-task.html).

Do not choose a database, ORM, web framework or async architecture for the project
through this module. Validate input before sensitive operations and avoid unsafe
deserialization, interpolated commands and sensitive exception/log output.

## Testing and validation

Use the existing runner and fixtures. Cover changed domain behavior plus affected
serialization, resource and integration boundaries. Keep temporary files/data
isolated; control clocks, random values and external services where needed. Test
cleanup and meaningful exception/cancellation paths for changed resource logic.

Discover actual test, lint, typecheck and package/build commands from project
configuration and CI. A module importing or compiling does not establish all of
those checks passed. Run in the supported environment and record version/service
limitations. Avoid installing a competing runner or type checker to satisfy a
generic checklist.

## Maintainability

Keep public package/API changes and compatibility expectations documented. Favor
explicit resource ownership and small behavior-focused functions. Add docstrings
for public contracts or non-obvious constraints rather than restating code. Put
broader typing, packaging or structural migrations into separately approved work.

Official references checked 2026-10-18; current documentation can describe syntax
or APIs unavailable in the project's supported Python versions.
