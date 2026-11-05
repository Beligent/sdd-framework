# Step 1 · Settle the Beligent v2 design

**Assistant and model** · Claude Code, Opus  
**Reasoning effort** · High  
**Estimated work time** · 1–2 hours including developer review  
**Session** · Start a fresh session in the Beligent framework source repository.  
**Inputs** · The Step 0 baseline report and the Beligent v2 implementation runbook.

## Instructions for Claude Code

Read the baseline report, the runbook, and the applicable repository instructions. Check the current files that affect your design decisions. Compare the report’s baseline commit with the current checkout and call out any relevant differences. If the Step 0 report is missing, request it before treating the baseline as established.

Produce a design decision record in chat. Keep the repository read-only. Use the following decisions as constraints.

- V2 is a clean break. It supports one new schema. Earlier schemas are rejected with an actionable message. There are no compatibility shims or automatic migration. The published release number is a separate decision.
- Repository engineering standards apply to ordinary requests, including stack guidance and relevant tests. Ticket tracking starts on explicit user intent, such as naming an existing ticket to implement or requesting tracked work. Keep the main assistant as the default and specialist delegation optional.
- Keep five workflow skills: `sdd-init`, `sdd-define`, `sdd-implement`, `sdd-audit`, and `sdd-deliver`. Omit `frameworks.json`. Use `.sdd/beligent/config.json` for project settings.
- Implementation checks each applicable requirement or criterion, adds or updates automated coverage for changed behavior where practical, and runs the relevant tests. Use documented manual checks where appropriate. An unrun or failed required check keeps a ticket open.
- A ticket is done when the agreed work is complete and its required checks pass. Audit is optional and can happen before or after closure. Reopen for a missed original criterion and track newly requested scope separately. Delivery authorization and status remain separate from completion.

### Decisions to produce

| Area | Decide |
| --- | --- |
| Schema and records | Specify the version marker and minimum fields for config, tickets, optional epics, and optional shared specs. Distinguish required fields from optional ones. Define how IDs, criterion references, and project-relative paths resolve. Include minimal valid examples. |
| Lifecycle and revisions | Define the smallest useful set of statuses and transitions. Show how to record scope authorization when required, how revisions affect existing authorization and test evidence, and what happens when a closed ticket is audited. |
| Verification | Define which evidence is required to close a ticket, how to identify the implementation snapshot or diff, and how failed, blocked, and manual checks are recorded. Separate checks a validator can perform from judgments the implementer must make. |
| Routing and installation | Define the boundary between ordinary requests and tracked work, the project folder layout, what the installer owns, how repeat setup works, and how it detects older installations without silently replacing them. List the five skills and their entry points. Use the runbook’s nine hosts as compatibility targets and identify what still needs live validation. |

Walk the proposed design through three cases. Use an ordinary bug fix without a ticket, a tracked change with a failed required check, and a closed ticket whose audit finds an unmet original criterion. For each, state the entry point, records affected, and final state.

## Handoff for Step 2

Return the decision record with:

1. **Agreed constraints and proposed decisions**, including the field tables and minimal examples.
2. **Implementation map** with exact repository-relative paths to change and checks to add in Step 2.
3. **Open decisions** limited to choices that would materially change the schema, workflow, or installation. Give a recommendation and its tradeoff for each.

Stop after the design record. Step 2 can begin once the developer can tell what constitutes a valid v2 record, when a ticket closes, and which files and checks Codex should implement.
