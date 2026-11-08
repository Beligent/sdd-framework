# Changelog

## 1.0.0

Breaking release after 0.2.1, with no backward compatibility: earlier
configurations, records and skills are reported, never converted. Set up again
with `sdd install` and `/sdd-init`.

- Five command-only skills replace the nine earlier ones: `sdd-init`,
  `sdd-define`, `sdd-implement`, `sdd-audit` and `sdd-deliver`. They run only
  when a prompt starts with `/sdd-…` (`$sdd-…` in Codex); without a command the
  agent applies only the selected stack guides.
- A continuation guard asks before plain-language work continues an open ticket;
  "no" cancels the ticket.
- The ticket in `.sdd/beligent/tickets/` is the only record, with Context,
  Requirements, Acceptance criteria and Out of scope. Epics, specs, revisions,
  snapshots, profiles and approval records are removed. A large feature becomes
  several tickets linked by `depends_on`.
- The implementing agent sets `done` when every criterion and every required
  config check has a passing result from the final diff. Done and cancelled
  tickets are final.
- Only `/sdd-deliver` changes Git state, and only as far as asked. It asks before
  deleting a finished ticket and keeps its criteria in the commit message.
- One configuration schema, `"schema": "beligent-sdd/config"`, in
  `.sdd/beligent/config.json`.
- New `sdd install`, a dry run unless `--apply`, for Codex, Claude Code, GitHub
  Copilot, the Copilot cloud agent and Cursor. It replaces managed skills and
  stack guides, rewrites only the marked instruction section and creates the
  config only when missing. The CLI no longer needs Git.
- `package.json` is the only version source; the `VERSION` file is removed.
- The `docs/` folder is removed; the README and the skills are the documentation.

## 0.2.1 — 2026-10-22

Opt-in local token accounting for Codex and Claude structured output, with
per-skill totals and no prompt, response or tool content.

## 0.2.0 — 2026-10-22

Schema 2 with compact tasks and a preview-first migration from schema 1; three
new skills, `develop-task`, `diagnose` and `deliver-work`; and a shared diagnosis
and simplicity contract.

## 0.1.0 — 2026-10-18

Initial framework: six skills, a Markdown ticket provider, lifecycle profiles,
five technology modules, assistant adapters and the optional `@beligent/sdd`
CLI (`validate`, `doctor`, `version`).
