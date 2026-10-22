# Node.js

Canonical source: `skills/implement-ticket/references/technology/nodejs.md`.
Packaged copies must match this source.

Identify the supported Node.js versions, package manager/lockfile, module format,
server framework, TypeScript build path and existing validation scripts. Preserve
these choices unless their change is explicitly part of the approved work.

## Architecture and asynchronous work

Keep request/transport handling distinct from domain rules and external resource
access where that fits the project. Do not select Express, an ORM or a queue by
default. Respect the package's ESM/CommonJS boundaries and public API surface.

Await or otherwise deliberately handle asynchronous work and its failure. Limit
concurrency where downstream capacity or input size can exhaust resources. Handle
cleanup, timeouts and cancellation at changed integration boundaries. Avoid
unbounded synchronous/CPU work in request paths; declaring a function `async`
does not move its CPU work off the event loop. Node's
[event-loop guidance](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
describes why both lengthy callbacks and worker-pool work affect other requests.

Validate untrusted input before using it in queries, paths, commands or object
merges. Apply existing server-side authorization and resource limits. Preserve
lockfile discipline, inspect dependency changes, and avoid exposing inspectors,
secrets or sensitive errors in public environments. See Node's
[security guidance](https://nodejs.org/en/learn/getting-started/security-best-practices)
for runtime-specific risks; this guide does not mandate adding security tooling.

## Testing and validation

Use the existing runner. Node includes a [test runner](https://nodejs.org/api/test.html),
but its availability/features depend on the supported runtime, and an established
test setup need not be replaced. Test domain rules and affected integration
contracts; use controlled network/storage dependencies and meaningful rejection,
timeout or cancellation cases for changed asynchronous behavior.

Clean up servers, sockets, timers and temporary files so tests do not hang or
depend on execution order. Verify request validation and ownership boundaries
when affected. A happy-path unit test is not evidence of cross-user isolation or
graceful shutdown.

Discover validation from package scripts and CI. Run applicable tests, lint,
typecheck and build commands, noting that executing TypeScript code alone does
not establish the project's typecheck passed. Record the actual runtime and any
unavailable external service; do not treat skipped integration checks as success.

## Maintainability

Keep startup/configuration and shutdown resource ownership understandable. Use
the project's logging/error conventions and redact sensitive fields. Document
changed environment variables and compatibility expectations. Measure before
introducing workers, caches or retry layers, and keep retries bounded and safe
for the operation's semantics.

Official references checked 2026-10-18; use version-matched API documentation for
runtime-specific features.
