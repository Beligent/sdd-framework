# React and TypeScript

Canonical source: `skills/implement-ticket/references/technology/react-typescript.md`.
Packaged copies must match this source.

Apply to selected React/TypeScript work. Inspect installed versions, rendering
environment, existing state/data libraries, compiler settings and test scripts.
These recommendations do not authorize migrating the application or changing its
toolchain.

## Architecture and conventions

Keep components focused on a user interaction or presentation responsibility;
extract domain rules when that makes behavior independently understandable and
testable. Use existing feature/module boundaries and shared components before
creating another component system. Choose state ownership deliberately: local
state for local interaction and shared state only when consumers need it. This
does not prescribe a state-management library.

Compute values from current props/state during rendering when possible. Put an
action caused by an explicit user event in its handler. Use Effects for
synchronization with external systems and provide cleanup/race handling where
needed. These choices follow React's guidance on
[avoiding unnecessary Effects](https://react.dev/learn/you-might-not-need-an-effect)
and [synchronization](https://react.dev/learn/synchronizing-with-effects).

Model domain states and component props explicitly; narrow unknown external data
before use. Preserve the project's compiler guarantees and avoid broad `any` or
unchecked casts to hide a contract error. Prefer strict checking for new code
where compatible, while treating a repository-wide strictness migration as
separate work. TypeScript's [strict option](https://www.typescriptlang.org/tsconfig/strict)
enables a family of checks whose behavior can evolve with compiler versions.

Use semantic controls, labels, keyboard interaction and visible focus. Represent
loading, empty, error and success states required by the contract. UI validation
helps users; sensitive actions still need enforcement at the trusted boundary.

## Testing and validation

Use the existing component/browser tools. Assert visible behavior and accessible
interaction rather than private component state. Cover the changed flow and its
important error or boundary state. When data loading is affected, test stale
responses, cleanup or cancellation where relevant; a mocked successful request
alone cannot establish integration behavior.

Discover typecheck, lint, test and build commands from project scripts. Run the
checks relevant to the final change, plus a real browser/manual check for visual
or interaction properties not established elsewhere. Record viewport/environment
and observed outcome for a manual check. Do not invent a successful build or
install a test framework simply to follow this guide.

## Maintainability

Keep API transport shapes distinct from UI state when their responsibilities
differ. Document non-obvious state ownership and shared component contracts.
Measure a demonstrated performance issue before adding memoization or changing
state architecture. Preserve existing formatting and accessibility conventions.

Official references checked 2026-10-18; consult documentation matching the
project's installed versions before using version-sensitive APIs.
