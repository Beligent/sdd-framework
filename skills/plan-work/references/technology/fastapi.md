# FastAPI

Canonical source: `skills/implement-ticket/references/technology/fastapi.md`.
Packaged copies must match this source.

Combine with the Python guide. Inspect installed FastAPI, Pydantic and Starlette
versions, existing router/dependency structure, runtime/lifespan configuration,
and the API's documented contract. Do not migrate framework/model versions or
select persistence/authentication libraries through this module.

## HTTP contracts and architecture

Keep route handlers focused on HTTP input/output and delegate domain work using
existing project boundaries. Model request and response contracts explicitly,
including relevant error/status behavior. Separate sensitive/internal data from
public response fields; FastAPI's
[response model guidance](https://fastapi.tiangolo.com/tutorial/response-model/)
explains output validation/filtering. Validate behavior at runtime; annotations
alone do not grant authorization.

Use the project's [dependency injection conventions](https://fastapi.tiangolo.com/tutorial/dependencies/)
for shared authentication, resource access and request concerns. Enforce protected
actions and resource ownership server-side. Keep dependency lifetimes and cleanup
clear; do not make a process-wide mutable object stand in for request-isolated
state without considering concurrency.

Choose `async def` for asynchronous work using awaitable libraries. A synchronous
utility called directly inside an async function still runs there; it is not
automatically offloaded just because FastAPI offloads normal synchronous path
operations/dependencies. Avoid blocking the event loop and check the actual
resource library's usage. See FastAPI's
[concurrency guidance](https://fastapi.tiangolo.com/async/).

## Testing and validation

Use the existing test setup. FastAPI's [testing guidance](https://fastapi.tiangolo.com/tutorial/testing/)
shows request-level tests; use the project's sync/async client and lifecycle
handling appropriate to the behavior under test. Verify response schemas,
validation/error behavior, relevant status codes, unauthorized access and
cross-user isolation when affected. Do not rely only on direct function calls
that bypass routing and dependencies.

Replace external dependencies with controlled fixtures when useful, while keeping
contract/integration checks for boundaries the criteria require. Reset overrides
and release test resources even on failure; see
[dependency override testing](https://fastapi.tiangolo.com/advanced/testing-dependencies/).
Use isolated data rather than live production resources.

Run the project's relevant Python checks and API tests. Inspect generated OpenAPI
or an equivalent contract check if public API shape changes. Record unavailable
services and unverified migration/lifespan behavior explicitly; an app importing
successfully does not establish request or shutdown behavior.

## Maintainability

Keep common error translation and dependency behavior consistent with the API.
Document changed API examples, environment requirements and operational behavior.
Introduce additional layers only when their responsibility is clear, and keep
database/ORM/deployment choices in project configuration and approved decisions.

Official references checked 2026-10-18; verify examples against installed versions.
