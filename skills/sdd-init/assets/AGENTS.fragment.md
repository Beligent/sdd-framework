<!-- beligent-sdd:start -->
## Beligent SDD

The Beligent SDD framework is installed but runs only when a prompt starts with
one of its commands: `/sdd-init`, `/sdd-define`, `/sdd-implement`, `/sdd-audit`
or `/sdd-deliver` (`$sdd-…` in Codex). Plain language never starts it, even when
it names a ticket or follows a command in the same conversation.

Without a command, work as an ordinary coding agent and do what is asked. Apply
only the stack guides in `.sdd/beligent/guidance/` that `.sdd/beligent/config.json`
lists in `stacks` and the changed files use. Do not read, create or edit files in
`.sdd/beligent/tickets/`, and do not ask about tickets.

Never commit, push or open a pull request unless the developer asks.
<!-- beligent-sdd:end -->
