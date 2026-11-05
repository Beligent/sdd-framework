# Assistant integration and coverage

Beligent keeps workflows in portable skill packages. Project instructions load
engineering/testing/review references for ordinary requests, even when automatic
skill matching does not select a skill. Setup installs that guidance under
`.sdd/beligent/guidance/` and links it from project instructions. This is an
instruction-based integration; loading must be observed in each selected host.

The paths below reflect repository documentation researched on 2026-10-18.
They are discovery candidates, not a new certification of current host behavior.
Preserve personal instructions/skills, inspect host settings and confirm paths
against the installed product before applying integration changes.

| Target surface | Documented project integration | Historical installation evidence | 1.0 live workflow |
| --- | --- | --- | --- |
| Codex in VS Code | `AGENTS.md`, `.agents/skills`, explicit `$skill-name`; prior docs did not split Codex surfaces | 1.0 five-skill local copy install/reinstall; source bytes and protected files checked | Pending |
| Codex CLI | Same project guidance; structured-output usage examples | Same current local layout; no product launch | Pending |
| Claude Code in VS Code | `CLAUDE.md` importing `@AGENTS.md`, `.claude/skills`; older docs generic across surfaces | 1.0 five-skill local copy install/reinstall; source bytes and protected files checked | Pending |
| Claude Code CLI | Same guidance; structured-output usage examples | Same current local layout; no product launch | Pending |
| Copilot VS Code Agent mode | `.github/copilot-instructions.md` bootstrap; supported skill paths depend on harness/settings | 1.0 five-skill local copy install/reinstall in .agents/skills | Pending |
| Copilot CLI | Shared project guidance and supported skills; inspect discovered instructions | Same current local layout; no product launch | Pending |
| Copilot cloud | Committed supported instructions and project skills | None for cloud; local copies do not establish cloud access | Pending |
| Cursor Agent | AGENTS.md; observed .agents/skills with pinned installer, alternate native paths need review | 1.0 five-skill local copy install/reinstall | Pending |
| Devin Desktop with Devin Local | New 1.0 target; confirm documented local instructions/skill discovery first | None recorded | Pending |

## Evidence boundaries

Current tests copy all five packages, shared guidance and only selected stack
modules, validate local links, preflight edited/unsafe destinations and repeat
copies without rewrites. A separate executed smoke used cached external
skills@1.7.2 for Codex, Claude Code, Copilot, Cursor and a combined Codex/Claude/
Copilot selection, twice each. Five copies per single agent and ten combined
copies matched source exactly. Protected instructions, app/config/state/ticket
bytes and timestamps stayed unchanged. Observed roots were .agents/skills for
Codex/Copilot/Cursor and .claude/skills for Claude. This proves local installer
layout/preservation, not native app launch or setup workflow execution.
A portable assistant slug in configuration likewise does not prove installation.
No host workflow was live-tested as part of the 1.0 implementation.

## Fresh-session validation procedure

For each surface above, record product/version, OS, date, source commit, installer
version, installed paths, discovery settings and actual observations. Use a
disposable repository and the full five-skill set.

1. Run the pinned external installer in copy mode. Compare resource bytes with
   source, validate runtime links and inspect provenance. Reinstall from a reviewed
   changed source and confirm only skills/installer provenance change.
2. Start a fresh host session and invoke `sdd-init`. Inspect the read-only proposal,
   authorize exact setup, check rendered engineering paths and ownership hashes,
   repeat and compare bytes/timestamps. Test adoption separately with handwritten
   instructions, existing config/artifacts and an edited managed section.
3. Ask for a small code change without naming a skill or ticket. Confirm the host
   actually reads engineering/testing/review guidance, adds a useful behavioral
   test where relevant, runs checks and reports evidence. Confirm no ticket or
   record directory appears. Repeat without config.
4. Explicitly request tracking, then implement the named task. Confirm stable IDs,
   bounded definition/planning, real test execution, recorded checks and snapshot,
   manual-validation handling and no premature `done` (`sdd validate`).
5. Exercise `sdd-audit` independently for review and diagnosis without a ticket.
   Check observations/hypotheses and scoped recommendations. Test the repeated-fix
   safeguard without pretending test failures establish human acceptance.
6. Request delivery in a disposable Git repository/remote. Check exact staging,
   unrelated index preservation, push confirmation, policy conflicts and observed
   completion. No merge without separate explicit authorization. Tracked `done`
   requires current passing criterion checks independently of delivery. Failed
   required checks leave work open. A post-close audit is read-only unless record
   updates are explicitly authorized.

For cloud, commit the intended resources and inspect the delegated run's loading
and results separately. For Devin Desktop with Devin Local, first establish its
actual local discovery mechanism; do not invent a path or equate Desktop and
Local availability. Mark unavailable surfaces pending with the precise blocker.

## Optional native specialists

Default to the main assistant. Where the selected host supports configured native
specialists, an optional React accessibility or Python API reviewer receives a
bounded diff, relevant criteria, .sdd/beligent/guidance and expected evidence.
Use that host's documented configuration/UI; no portable specialist manifest or
unverified invocation flag is generated. Confirm availability/settings before
claiming execution. Reviews return findings and actual checks without edits by
default; recommendations never supply implementation or Git authorization.
