# Beligent v2 implementation runbook

Use this runbook in the **Beligent framework source repository**. Use a disposable consumer project to test what the installer produces. The DPP application can serve as a later pilot. V2 is a clean break with a new schema and installation contract.

## How to use the runbook

Start with step 0. Paste the instruction for one step into the named assistant, with this runbook available in the session. Review the result against the exit check before proceeding. Keep one working branch and a reviewable diff for each step. Give a fresh session the branch or diff, this runbook, the previous step's results, and any decisions you made.

Use **Codex with GPT-6.1 Sol** for most changes and **Claude Code with Opus** for a fresh architecture and final review. **Claude Code with Sonnet** is a good fit for the fixture and documentation step. If you use only Codex, use a fresh GPT-6.1 Sol session for the reviews, or Astra for an unresolved design issue that needs deeper reasoning. Pick the available model in your client. Claude aliases can resolve to different versions by provider, so record the actual model used when reporting compatibility results. Model choices are recommendations for executing this runbook. Beligent itself stays model-independent.

| Step | Assistant and model | Output |
| --- | --- | --- |
| 0. Inspect and baseline | Codex · GPT-6.1 Sol | Repository map and actual baseline checks |
| 1. Settle the v2 contract | Claude Code · Opus | Reviewed behavior, schema, and lifecycle decisions |
| 2. Build the records and validator | Codex · GPT-6.1 Sol | V2 configuration, records, templates, and checks |
| 3. Implement workflows and defaults | Codex · GPT-6.1 Sol | Five skills and default engineering guidance |
| 4. Implement host installation | Codex · GPT-6.1 Sol | Installer and host-specific packaging checks |
| 5. Build fixtures and docs | Claude Code · Sonnet | Reproducible examples and command reference |
| 6. Verify and review | Codex · GPT-6.1 Sol, then Claude Code · Opus | Live target matrix and independent review |

Use the following context at the start of any execution session.

> Work on the assigned step only. Read the repository instructions first. Inspect existing code and reuse its conventions. Preserve unrelated developer changes. Report changed files, actual checks and results, and any blockers or unresolved decisions. Keep publishing, pushing, merging, and deploying subject to separate authorization.

## Target behavior

- **Ordinary requests inherit project standards.** “Fix the mobile passport label” uses applicable React/Next.js guidance, adds or updates a regression test where practical, and runs the relevant tests without opening a ticket. A small edit can use the main assistant directly.
- **Tracked work starts on explicit intent.** “Implement TICKET-042” is enough. An explicit command is another entry. A plain-language request for tracked work can route to the same procedure even on hosts that require native selection for formal skill invocation. Read-only references to a ticket do not authorize implementation. Honor any project requirement to track a particular class of work by surfacing it before edits.
- **Implementation includes verification.** Check each applicable requirement or acceptance criterion. Add or update automated tests for changed behavior and bug fixes where practical, reuse adequate existing coverage, and run the relevant existing and new tests. Prefer a failing-before and passing-after regression check when reproducible. Record a manual check when appropriate, and report unavailable checks as unverified. Evidence should identify the check, result, and implementation snapshot or diff.
- **Done means complete.** A tracked ticket is done when its agreed work is complete and its required checks pass. A failed or blocked required check keeps it open. Audit is optional and can run before or after completion. Reopen for a missed original criterion. Track newly requested scope separately. Delivery has its own state and permissions.
- **Use one workflow configuration.** Omit `frameworks.json`. The project instructions identify Beligent. `.sdd/beligent/config.json` holds project settings. A ticket can stand alone or reference an epic and a shared specification. Use a durable shared spec for behavior that spans tickets or outlives them.
- **Default to one main agent.** Load general, stack, and local guidance as relevant. Optional specialists, such as a React accessibility reviewer or a Python API reviewer, receive a bounded assignment, the relevant criteria, and expected evidence. Their recommendations use the same project standards.

### Consumer repository layout

The installer selects host-specific paths and preserves existing project instructions and application structure. The framework source repository authors one copy of each skill and common rule.

```text
AGENTS.md                             # Shared project baseline
CLAUDE.md                             # Optional host bridge
.github/copilot-instructions.md        # Copilot baseline bridge when selected
.sdd/beligent/
  config.json
  guidance/
    engineering.md
    testing.md
    nextjs.md                         # Example stack guidance
    python.md                         # Example stack guidance
  tickets/                            # On demand
  epics/                              # On demand
  specs/                              # Optional shared behavior contracts
  setup-state.json                    # Only if installer ownership needs it
.agents/skills/<skill>/SKILL.md         # Shared layout where discovered
.claude/skills/<skill>/SKILL.md         # Generated if needed for Claude
.github/skills/<skill>/SKILL.md         # Generated if needed for Copilot
```

Treat these as candidate install paths and validate their exact host behavior. The installer can use another documented native path when needed. Keep app-wide and subsystem rules with the relevant project guidance. Configure specialists through the selected host's native mechanism.

### Skills and command names

Slash examples apply where the host exposes native skill commands. Codex examples use skill mentions. Plain-language and cloud entry points use the same workflow intent and scope.

| Skill | Slash example | Codex example | Responsibility |
| --- | --- | --- | --- |
| `sdd-init` | `/sdd-init` | `$sdd-init` | Inspect and install selected host integrations |
| `sdd-define` | `/sdd-define ticket …` | `$sdd-define ticket …` | Clarify scope and create or refine records |
| `sdd-implement` | `/sdd-implement TICKET-042` | `$sdd-implement TICKET-042` | Implement, test, verify, and record evidence |
| `sdd-audit` | `/sdd-audit verify TICKET-042` | `$sdd-audit verify TICKET-042` | Diagnose, review, verify, or report status |
| `sdd-deliver` | `/sdd-deliver TICKET-042` | `$sdd-deliver TICKET-042` | Prepare or execute authorized delivery |

## 0. Inspect the repository

> Inspect the current framework without editing it. Read the repository instructions and docs/agents.md. Locate the skills, schemas, templates, CLI, installer, packaging, examples, and tests. Map current entry points to the five proposed skills and flag any useful behavior that might be lost. Run existing fast checks when possible. Return file paths, commands, baseline results, and the smallest implementation sequence.

**Exit check.** Actual files and commands are known. Pre-existing failures are recorded separately.

## 1. Settle the v2 contract

> Review step 0 and this runbook. Produce a compact decision record for v2. Specify the minimum config and record fields, stable IDs and criteria, status and reopening rules, scope-change behavior, how direct requests and tracked requests route, and what counts as required verification. Define what the installer owns and how it handles older installations. Identify unresolved decisions with examples. Review the design before changing the source.

**Exit check.** A developer can tell when a record is created, when it closes, and how an assistant resumes it. Design assumptions are visible for review.

## 2. Build the records and validator

> Implement the agreed v2 configuration, ticket, epic, and shared spec support in the existing schema, templates, and relevant tooling. Resolve configured paths from the project root. Validate identifiers, links and dependencies, and tracked closure evidence. Preserve affected scope and evidence history across revisions. Return a clear version error for earlier schemas. Add focused tests for standalone tickets, shared specs, optional epics, invalid links, incomplete closure evidence, and earlier schemas.

**Exit check.** Valid v2 fixtures pass. Invalid and prior-version fixtures produce actionable results. Use existing atomic or conflict-aware updates where the tooling writes records.

## 3. Implement workflows and default guidance

> Replace the workflow entry points with the five skills listed here. Keep shared requirements for scoped changes, testing, and truthful reporting in common guidance. Specify how default project instructions apply on direct requests. Put requirement-by-requirement verification and systematic testing in sdd-implement. Keep sdd-audit read-only by default and able to inspect closed work. Preserve the distinction between authorization to implement and authorization to deliver. Update the packaging contract for the new skill inventory.

**Exit check.** A direct bug fix follows the stack rules without creating a ticket. A tracked implementation records evidence. Missing or failing required checks keep its ticket open. A later audit can identify a reason to reopen it.

## 4. Implement host installation

> Make setup install only the selected host integrations from the common skill and instruction sources. Preserve existing project instructions. Make repeat setup idempotent. Detect old installations and explain the clean-break options without overwriting them silently. Separate automatic project guidance from explicit workflow entry points. Use host-native invocation settings where verified. Where a host may load a skill implicitly, have the workflow check for explicit tracking intent before changing records. Add package checks for equivalent skill content, duplicate discovery risk, and preservation of user-owned files.

**Exit check.** A disposable repository installs twice without unrelated changes. Packaged skills match their authored content and the generated layout is reviewable.

## 5. Build fixtures and documentation

> Update the README, docs/agents.md, and examples. Include the folder tree, skill inventory, host invocation table, and optional specialist setup. Build a small fixture with an ordinary bug fix and regression test, a standalone ticket, and an epic whose tickets link to one shared spec. Show a tracked implementation that reaches done, a later audit of it, and a required check that blocks closure in a separate case. Label illustrative output separately from executed evidence.

**Exit check.** A developer can install the package, make a direct fix, and resume a tracked task from the README and fixture alone.

## 6. Run live compatibility checks and independent review

> Run the fixture on available target surfaces using a fresh session per scenario. Record host version, model, install location, invocation, observed behavior, and exact checks. Verify both direct and tracked entry. Include successful implementation, a failing required check, a resume from repository state, and a post-close audit. Test GitHub cloud assignment and draft PR handling separately using an authorized test repository. Mark unavailable surfaces as untested. Then have a fresh reviewer inspect the diff and evidence against this runbook and report release blockers with file paths.

| Target surface | First behavior to validate |
| --- | --- |
| Codex in VS Code | Baseline instructions, skill picker, explicit tracked request |
| Codex CLI | Root skill discovery and invocation from the terminal |
| Claude Code in VS Code | Native extension discovery and project instruction bridge |
| Claude Code CLI | Slash skill invocation in a fresh terminal session |
| GitHub Copilot in VS Code | Agent mode, Copilot harness, scoped instructions and skill discovery |
| GitHub Copilot CLI | Repository skill discovery and explicit invocation |
| GitHub Copilot cloud agent | Task assignment, tracked scope, and host-managed draft PR |
| Cursor Agent | Baseline, slash skills, and duplicate discovery with multiple layouts |
| Devin Desktop, using Devin Local (formerly Windsurf) | Baseline and shared skills, slash invocation, opt-in tracking |

**Exit check.** Each claimed target has live evidence. Package checks pass. The review distinguishes release blockers from follow-up work.

## References

- [OpenAI models for Codex](https://learn.chatgpt.com/docs/models?surface=cli)
- [Claude Code model configuration](https://code.claude.com/docs/en/model-config)
- [Agent Skills specification](https://agentskills.io/specification)
- [VS Code Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [GitHub Copilot cloud agent skills](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills)
- [Devin Desktop](https://devin.ai/desktop) and [Devin skill discovery and triggers](https://docs.devin.ai/cli/extensibility/skills/overview)
