<!-- beligent-sdd:start -->
## Beligent engineering

For ordinary code/review requests, read applicable local instructions and
`.sdd/beligent/config.json` when present. Apply shared guidance in
`.sdd/beligent/guidance/engineering.md`, `.sdd/beligent/guidance/testing.md` and
`.sdd/beligent/guidance/review.md`; load only relevant stack modules from that
folder. These rules apply without invoking a skill. Report unavailable resources.

Use one main assistant, keep changes scoped, preserve unrelated edits, add/update
useful tests where practical and run relevant checks during implementation.
Record criterion, command/procedure, outcome and implementation snapshot/diff.
After two ineffective symptom fixes, diagnose before another patch. Optional
specialists receive a bounded assignment, relevant criteria and expected evidence
and follow the same project/stack/local standards.

Tracking is opt-in. Implementing a named ticket or requesting tracked work selects
that scope. Read-only ticket references, audits and automatic skill matching do
not authorize implementation or record writes. Surface project tracking requirements
before edits. Keep ordinary work notes/evidence in chat; do not create tickets.

Use sdd-init for reviewed setup/adoption, sdd-define for definition/planning,
sdd-implement for implementation and verification, sdd-audit for read-only review,
diagnosis/status, and sdd-deliver for authorized Git actions. A ticket is done when
agreed work and its required checks pass; failed/blocked/unrun checks leave it open.
Audit is optional before/after closure. Recommend reopening for missed original
criteria, track new scope separately, and obtain authorization before audit writes.
Git delivery state and permissions are separate from ticket completion.
<!-- beligent-sdd:end -->
