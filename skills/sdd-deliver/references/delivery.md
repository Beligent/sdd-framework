# Delivery rules

Canonical source: `skills/sdd-deliver/references/delivery.md`.

Delivery changes Git state for exactly one change, and only on the
`sdd-deliver` command. It never implements, fixes or re-verifies behavior.

## Commit integrity

- Inspect both the working tree and the index. Compare each candidate path with
  the change and exclude unrelated modifications; never use broad staging that
  could absorb them.
- If the existing index cannot be preserved while isolating the change, stop and
  ask instead of resetting or stashing someone else's work.
- Review the exact staged diff. Reject secrets, credentials, private material,
  unintended generated output, conflict markers and files outside the change.
- Write one concise message from the actual change. When the ticket is removed,
  append its ID, title and criteria so the requirements stay in Git history.

## Push and pull request

- Push only the intended branch to its understood upstream, and only when asked.
- Never force push, amend, rebase, reset, squash or delete branches unless the
  developer explicitly asks for that exact operation.
- A pull request title names the delivered behavior; its body states the
  behavior, criteria, check results and known limits. Never merge unless the
  developer explicitly asks.

## Stopping

Stop after the requested step. Report commit ID, branch, PR reference and
anything left uncommitted. Do not select further work or create tickets.
