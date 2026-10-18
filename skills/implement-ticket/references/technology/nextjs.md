# Next.js

Canonical source: `skills/implement-ticket/references/technology/nextjs.md`.
Packaged copies must match this source.

Combine with the React/TypeScript guide when applicable. First identify the
installed Next.js version, App Router versus Pages Router, runtime constraints,
and the project's rendering/data strategy. Do not migrate routers or copy cache
defaults from a different release as incidental cleanup.

## Architecture and boundaries

With the App Router, keep server data access and secrets on the server and use
client boundaries for interaction/browser APIs. A `use client` boundary affects
its imported module graph; avoid placing it above an entire feature just for one
interactive control. Check values crossing the server/client boundary and do not
assume a Client Component avoids server rendering. See
[Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components).
For the Pages Router, follow its existing data and routing conventions instead
of applying App Router APIs.

Treat public route handlers and server mutations as exposed entry points. Validate
input and enforce authentication, authorization and ownership where the operation
executes. Keep response data minimal and avoid passing entire persistence records
into client code. Next.js explains these boundaries in its
[data security guide](https://nextjs.org/docs/app/guides/data-security).

Make freshness requirements explicit: which data can be shared/cached, what must
remain user-specific, and how a mutation becomes visible. Inspect the selected
version's caching, revalidation and rendering semantics rather than assuming
`fetch` has a particular default. Plan loading/error states for changed routes.
Use the version-matched [data fetching documentation](https://nextjs.org/docs/app/getting-started/fetching-data)
when choosing the actual mechanism. No database, ORM or hosting platform is
selected by this module.

## Testing and validation

Test authorization at the server entry point, not only navigation or hidden UI.
Where affected, check routing, error boundaries, mutation outcomes, user isolation
and the specified freshness behavior. Use the existing integration/browser tools;
component mocks alone do not prove server rendering or cache behavior.

Run the project's actual typecheck/lint/test/build commands relevant to the change.
For server/client or runtime-boundary changes, validate the production build or
other project check that exercises that boundary. If build-time services are
unavailable, record the limitation instead of treating a development render as
equivalent evidence. Inspect the changed flow for accidental secret exposure.

## Maintainability

Keep route-specific composition with its route and reuse domain/data logic when
existing architecture calls for it. Explain a deliberate caching or runtime
choice near the code or in a consequential ADR; avoid repeating the behavioral
specification. Keep environment-dependent configuration documented and preserve
the project's deployment assumptions.

Official references checked 2026-10-18; their current examples may target a newer
version than the consuming project.
