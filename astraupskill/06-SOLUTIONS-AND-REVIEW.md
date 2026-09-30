# Solution reasoning and reviewer questions

Start with an invariant that a reviewer can challenge. For a task due date: every stored value is absent or a valid calendar date, it belongs to an authorized parent project, and updates preserve the task version contract. That statement implies validation, migration, serialization, UI state, and regression tests. It also identifies the behavior that must survive refactoring.

A nullable PostgreSQL date column is a useful candidate when the user means a day rather than an instant. Parse a canonical ISO date and avoid accidental timezone conversion through midnight timestamps. Existing rows should receive null rather than today's date. Add a migration from the previous schema, then test upgrading a fixture database with real tasks. Confirm their IDs, statuses, versions, and audit remain intact. Update the task draft export so unsaved date work is recoverable after a conflict.

For progress summaries, group tasks by status with both organization and project predicates. Do not query a project globally and assume its ID supplies authorization. Decide whether the summary includes filtered or all tasks. If rows and counts describe one snapshot, share a read transaction. A reviewer should ask how zero counts appear and whether a background query failure leaves the last accepted editor state truthful.

For create receipts, define a unique key that includes the relevant scope. Persist the normalized request hash, accepted identity, and enough response information to answer a retry. Insert the receipt and entity in one transaction; a preflight lookup followed by unrelated writes can race. Reject same-key/different-payload requests. Decide whether retries after deletion return an original receipt plus a missing current record, or a different documented outcome. Deleting receipts without a retention policy can allow duplicates to reappear.

Membership administration introduces aggregate invariants. Preventing the final owner from leaving requires reasoning about two concurrent removals, not only counting owners before each write. A transaction with appropriate locking or a carefully chosen serialization strategy can make the decision consistent. The error contract must explain conflicts without exposing another tenant's members. Keep role assignment server-controlled and audit the verified actor, target membership, and accepted role transition.

For notification intent, model pending, claimed, completed, and retryable states explicitly. A worker should claim bounded work and avoid holding a database transaction open while an external service responds. A crash after delivery but before completion still needs downstream idempotency or an accepted duplicate risk. Explain that uncertainty in the design rather than describing an outbox as a universal guarantee.

Review questions: Can invalid input alter rows? Can one organization infer another's records? Can a stale draft overwrite accepted work? Can two concurrent deletions break an invariant? Can a timeout duplicate a create? Can a successful save be mislabeled because its refresh failed? Which tests use real PostgreSQL and which use fakes? Answer with source references, concrete requests, and persisted outcomes.

Before submitting a patch, ask another learner to predict a failure from the diff. Turn that hypothesis into a regression test. This makes review a structured investigation of the contract instead of a search for stylistic preferences.

## Task 1, worked: task due dates

**Forward migration** (`backend/prisma/migrations/<timestamp>_task_due_date/migration.sql`):

```sql
ALTER TABLE "Task" ADD COLUMN "dueDate" DATE;
CREATE INDEX "Task_organizationId_dueDate_idx" ON "Task" ("organizationId", "dueDate");
```

Nullable on purpose: existing rows have no due date and the column must not invent one. A `NOT NULL` with a default of `now()` would silently make every old task due today.

**Schema** (`schema.prisma`): `dueDate DateTime? @db.Date` on `Task`, plus `@@index([organizationId, dueDate])`.

**Validation** (`backend/src/lib/validation.ts`): `dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isRealCalendarDay).nullable().optional()` on both the create and update schemas. The refine is the same round-trip check used elsewhere in this batch: parse, format, compare, so `2027-02-30` is rejected.

**Service**: the create and update paths pass `dueDate` through unchanged; the list path accepts `dueBefore`/`dueAfter` query params, each validated the same way, and adds `{ dueDate: { lte, gte } }` to the tenant-scoped `where`. The tenant predicate stays first in every query.

**Tests** (`backend/src/__tests__/projectService.test.ts` style, three cases): a create with `2027-02-30` is 400 and `prisma.task.create` is not called; an update setting `dueDate: null` clears it (assert the `data` object contains `dueDate: null`, not `undefined`); a list with `dueBefore` carries both `organizationId` and the date bound in one `where`.

**UI**: a `<input type="date">` bound to the draft; on submit send the string as-is (no `Date` object, no timezone shift); show overdue tasks with the same "derived, not stored" rule as progress in task 2.

