# Example project conventions

These are fictional project agreements used to make the worked handoff concrete.
There is no configured application toolchain or actual validation command here.

- Preserve the host's supported React/TypeScript, Python and FastAPI versions,
  package managers, test runners, authentication and storage adapters.
- Keep HTTP validation and authorization at the server boundary. Use domain logic
  for task state transitions and the host's storage adapter for persistence.
- Keep task UI state local unless existing shared-state conventions require more.
  Count title length by Unicode code points if reproducing the API constraint in
  JavaScript; the server remains authoritative.
- Use isolated team/member/task fixtures. Never run example scenarios against
  production resources. Choose actual commands after inspecting a real host.
- Record performed checks separately from proposed cases. No sample identifier,
  screenshot description or illustrative decision counts as evidence/approval.
- The Markdown ticket provider resolves stable IDs from the configured locations;
  compute real byte digests for provider operations rather than making up tokens.
