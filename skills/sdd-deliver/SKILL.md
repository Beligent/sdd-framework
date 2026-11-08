---
name: sdd-deliver
description: Use only when the prompt starts with /sdd-deliver or $sdd-deliver. Commits, pushes or opens a pull request for one change exactly as requested, and asks whether to delete its finished ticket first.
disable-model-invocation: true
---

# Deliver one change

Read project instructions, the [shared contract](references/shared/governance.md),
the [delivery rules](references/delivery.md) and the
[ticket contract](references/records.md). This command is the only one that
changes Git state, and only as far as the prompt asks: "commit" means commit
only; push and pull request need to be asked for.

1. Identify the change: the named ticket or the single unambiguous current change.
   If its ticket is open, report that and ask whether to deliver anyway.
2. Inspect branch, upstream, index, working tree and untracked files. Define the
   exact paths of this change and exclude unrelated work.
3. Ticket cleanup: if the ticket is `done` or `cancelled`, ask whether to delete
   it before committing. If yes, delete the file, remove its ID from other
   tickets' `depends_on`, and add the ticket's title and criteria to the commit
   message. If no, or if the developer chose to deliver an open ticket, include
   the ticket file in the commit unchanged.
4. Stage only those paths, review the staged diff and commit with a concise
   message that follows the repository's conventions.
5. Push or open a pull request only when the prompt asks for it.
6. Report the commit, branch and PR reference, and anything left uncommitted.
