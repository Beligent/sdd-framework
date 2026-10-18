# Refinement and change control

Discovery and refinement may revisit any management artifact. Preserve its
identity and canonical owner; do not create a second contract in an engineering
plan. Requirements/specifications use positive integer `revision` values and
increment on changed saved content. Provider records use their provider content
revision. No-op operations leave both content and revision unchanged.

Before changing approved scope, inspect its approval references and source
authorization. Determine whether the change affects behavior, criteria,
constraints, dependencies that change the plan, or implementation approach.
For material changes:

1. Describe the current behavior, proposed change and reason, affected IDs and
   downstream tickets/plans/verification.
2. Draft the revised artifact or a reviewable proposed diff within the current
   authorization. Do not claim the prior approval covers materially changed work.
3. Preserve historical approval records. Remove superseded references from the
   record's current `approval_refs`, or explicitly mark them superseded in the
   governing approval record; report the required renewed decision.
4. Keep affected work `preliminary` when planning needs are no longer met, and
   prevent dependent implementation until current revisions are authorized.
5. Link the eventual actual decision by approval ID, decision scope and artifact
   revision. An agent may transcribe a user decision but may not make it.

Editorial corrections that preserve meaning do not require an extra human gate.
Record why a revision remains within existing authorization when the referenced
revision changed only editorially. Follow the project approval policy and
[governance](shared/governance.md); existing explicit authorization for the same
concrete scope must not produce repeated permission requests.
