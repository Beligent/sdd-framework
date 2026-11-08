<!-- beligent-sdd:start -->
## Beligent SDD

The Beligent SDD framework is installed but runs only when a prompt starts with
one of its commands: `/sdd-init`, `/sdd-define`, `/sdd-implement`, `/sdd-audit`
or `/sdd-deliver` (`$sdd-…` in Codex). Plain language never starts it, even when
it names a ticket.

Without a command, work as an ordinary coding agent. Apply only the stack guides
in `.sdd/beligent/guidance/` that `.sdd/beligent/config.json` lists in `stacks`
and the changed files use. Do not read, create or edit files in
`.sdd/beligent/tickets/`, except as below.

If a request without a command relates to an open ticket (`todo`, `in-progress`
or `blocked`), because it names the ticket or continues ticket work from this
conversation, stop before changing anything and ask whether to keep using the
framework for it. Read only that ticket's `status` to decide. Suggest the same
request starting with the command, for example `/sdd-implement TICKET-042 <request>`.

- If yes, the developer resends the prompt with the command.
- If no, set that ticket to `cancelled` with a `cancelled_reason` such as
  "Continued without the framework". Do not delete it or edit other tickets.
  Keep all code and tests, and continue without the framework.

Done and cancelled tickets are closed: related work without a command is ordinary
work. Never commit, push or open a pull request unless the developer asks.
<!-- beligent-sdd:end -->
