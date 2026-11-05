# Step 0 · Baseline the Beligent framework

**Assistant and model** · Codex, GPT-6.1 Sol  
**Session** · Start a fresh session at the root of the Beligent framework source repository.  
**Output** · A baseline report in chat that can be handed to Claude Code for Step 1.

## Instructions for Codex

Inspect the existing Beligent framework and establish a baseline for the breaking v2 change. Keep this step read-only with respect to repository files. Report your findings in chat. Run existing non-destructive checks when available.

1. Read the repository instructions and `docs/agents.md` if present. Record the branch, HEAD commit, and whether the working tree has existing changes. Leave those changes in place.
2. Locate the current workflow skills and shared guidance, schemas and record formats, templates, CLI, installer, packaging, examples, and checks. Cite exact repository-relative paths. Identify which schema versions are currently supported and where each is read or written.
3. Map current behavior to the proposed v2 skill names `sdd-init`, `sdd-define`, `sdd-implement`, `sdd-audit`, and `sdd-deliver`. Flag responsibilities that could be lost when skills are combined. Include how ordinary code requests pick up engineering standards today, when tracking starts, how implementation adds and runs tests, and what marks a ticket complete.
4. Inventory what is documented and what has actually been verified for Codex in VS Code and CLI, Claude Code in VS Code and CLI, Copilot in VS Code Agent mode, CLI, and cloud, Cursor Agent, and Devin Desktop with Devin Local. Distinguish installation checks from live workflow tests. Treat Devin Desktop as a v2 target to validate if it is absent from the current repository.
5. Run the repository's available fast validation, test, or packaging checks that can run without changing tracked files. Record the exact command and result for each. If dependencies, credentials, or a host are missing, record the blocker and mark that check as not run. Separate existing failures from proposed v2 changes.
6. Identify the first code and documentation changes needed for one supported v2 schema, default engineering guidance for ordinary requests, opt-in ticket tracking, and implementation-time verification. Leave schema design and policy decisions to Step 1.

## Handoff for Step 1

Return the report under these headings.

- **Baseline** · Branch, commit, working-tree state, and relevant repository paths.
- **Current behavior** · Existing schemas, workflow mapping, and behavior worth carrying forward.
- **Checks** · Exact commands and observed outcomes, including checks that could not run.
- **Host coverage** · Documented, installation-tested, or live-tested, with evidence for each claim.
- **Decisions for Step 1** · Open design questions, affected paths, and a suggested implementation order.

The step is complete when a fresh reviewer can find the current implementation and distinguish observed results from assumptions. Stop after returning the report.
