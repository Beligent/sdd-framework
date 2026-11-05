# Epics workflow

Epics are optional. Use one only to group tickets that deliver one outcome.
Follow the [record contract](../records.md) and the [epic template](../../assets/epic.md).

1. Read existing epics and tickets for the outcome before creating a grouping;
   prefer refining an existing epic to duplicating its scope.
2. Describe one coherent outcome and its exclusions. Behavior that several
   tickets share belongs in a spec, not in the epic.
3. Identify candidate ticket slices with independently verifiable results.
   Create tickets only when backlog creation was requested. Membership is the
   ticket's `epic` field; `depends_on` means a prerequisite, not membership.
4. Mark the epic done only when its member tickets are done or cancelled. A
   done or cancelled epic is final.

Run `sdd validate` after writing. Report the epic, its candidate or created
tickets and open questions.
