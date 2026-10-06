# Solution reasoning and reviewer questions

Part 1 reviews the shipped code with line evidence. Part 2 gives design reasoning for the Part B [practice exercises](05-PRACTICE.md); those features are not implemented. Part A drills are answered by their `Check` lines.

## Part 1: senior review of the shipped code

**Foreign rows answer 404, not 409.** When a conditional `updateMany` matches nothing, `update` calls `projectIn` before `conflict()` (`projectRepository.ts:114-117`). A project id from another organization therefore gets "Project not found in this organization" instead of a conflict that would confirm the id exists. `remove` does the same and then checks the version before the task count (lines 136-142), so a stale delete is reported as stale even when tasks also exist. The order of these checks is part of the contract.

**The database repeats the tenant rule.** `Task.project` is a composite relation on `[projectId, organizationId]` (`backend/prisma/schema.prisma:66`), so even a writer that bypasses the repository cannot attach a task to another organization's project. "enforces tenant parent matching in the database itself" (`projectRepository.test.ts:362`) proves it with a direct insert. Point to this when someone asks why the repository check alone is not enough.

**Authority is re-read on every request, not carried in the token.** `authenticate` only verifies the token and its subject (`auth.ts:28-55`); `attachTenantContext` looks up the membership row on every request (`tenantContext.ts:25-39`). Removing a membership takes effect on the next request, which "removes access after membership revocation without trusting old JWT roles" (`projectRepository.test.ts:154`) asserts.

**The login throttle has two surprising edges.** `entry.count++` (`auth.ts:97`) runs before the password check and is never reset, so 20 *successful* sign-ins from one address within 15 minutes also earn a 429. And once 1000 addresses are tracked, every new address is refused (line 90) until entries expire: whoever fills the map locks out newcomers. Both are acceptable for a local demo; VERIFICATION already calls the limiter process-local. Exercise 1 makes both edges observable.

**Task writes have no role gate, by design.** `createTask`, `updateTask`, and `deleteTask` (`projectService.ts:65-97`) skip `requireManager`, so any member may delete any task in the organization. The audit row records the actor (`projectRepository.ts:248`). A reviewer should confirm that this matches the product intent, then check there is a test for it ("forbids member project mutations while allowing task CRUD", `projectRepository.test.ts:204`).

## Part 2: practice-exercise reasoning

Start with an invariant that a reviewer can challenge. For a task due date (Exercise 4): every stored value is absent or a valid calendar date, it belongs to an authorized parent project, and updates preserve the task version contract. That statement implies validation, migration, serialization, UI state, and regression tests. It also identifies the behavior that must survive refactoring.

A nullable PostgreSQL date column is a useful candidate when the user means a day rather than an instant. Parse a canonical ISO date and avoid accidental timezone conversion through midnight timestamps. Existing rows should receive null rather than today's date. Add a migration from the previous schema, then test upgrading a fixture database with real tasks. Confirm their IDs, statuses, versions, and audit remain intact. Update the task draft export so unsaved date work is recoverable after a conflict.

For progress summaries (Exercise 5), group tasks by status with both organization and project predicates. Do not query a project globally and assume its ID supplies authorization. Decide whether the summary includes filtered or all tasks. If rows and counts describe one snapshot, share a read transaction. A reviewer should ask how zero counts appear and whether a background query failure leaves the last accepted editor state truthful.

For create receipts (Exercise 6), define a unique key that includes the relevant scope. Persist the normalized request hash, accepted identity, and enough response information to answer a retry. Insert the receipt and entity in one transaction; a preflight lookup followed by unrelated writes can race. Reject same-key/different-payload requests. Decide whether retries after deletion return an original receipt plus a missing current record, or a different documented outcome. Deleting receipts without a retention policy can allow duplicates to reappear.

Membership administration (Exercise 7) introduces aggregate invariants. Preventing the final owner from leaving requires reasoning about two concurrent removals, not only counting owners before each write. A transaction with appropriate locking or a carefully chosen serialization strategy can make the decision consistent. The error contract must explain conflicts without exposing another tenant's members. Keep role assignment server-controlled and audit the verified actor, target membership, and accepted role transition.

For notification intent (Exercise 8), model pending, claimed, completed, and retryable states explicitly. A worker should claim bounded work and avoid holding a database transaction open while an external service responds. A crash after delivery but before completion still needs downstream idempotency or an accepted duplicate risk. Explain that uncertainty in the design rather than describing an outbox as a universal guarantee.

Review questions: Can invalid input alter rows? Can one organization infer another's records? Can a stale draft overwrite accepted work? Can two concurrent deletions break an invariant? Can a timeout duplicate a create? Can a successful save be mislabeled because its refresh failed? Which tests use real PostgreSQL and which use fakes? Answer with source references, concrete requests, and persisted outcomes.

Before submitting a patch, ask another learner to predict a failure from the diff. Turn that hypothesis into a regression test. This makes review a structured investigation of the contract instead of a search for stylistic preferences.

## Exercise 4, worked: task due dates

**Forward migration** (`backend/prisma/migrations/<timestamp>_task_due_date/migration.sql`):

```sql
ALTER TABLE "Task" ADD COLUMN "dueDate" DATE;
CREATE INDEX "Task_organizationId_dueDate_idx" ON "Task" ("organizationId", "dueDate");
```

Nullable on purpose: existing rows have no due date and the column must not invent one. A `NOT NULL` with a default of `now()` would silently make every old task due today.

**Schema** (`schema.prisma`): `dueDate DateTime? @db.Date` on `Task`, plus `@@index([organizationId, dueDate])`.

**Validation** (`backend/src/lib/validation.ts`). This file has no date helper yet, so add one that round-trips the string through UTC and compares:

```ts
const calendarDay = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine((value) => {
    const parsed = new Date(value + "T00:00:00.000Z");
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Choose a real calendar date");
export const taskInput = z
  .object({
    title: text(180),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
    dueDate: calendarDay.nullable().default(null),
  })
  .strict();
```

`2027-02-30` parses to March 2 and fails the comparison; `2028-02-29` passes. Because `taskUpdate` wraps `taskInput` (line 23), update gets the same rule. Convert to a `Date` only in the repository, with the explicit `T00:00:00.000Z` suffix, so no local timezone shifts the day.

**Repository**: `createTask` and `updateTask` spread `...data` (`projectRepository.ts:193-199`, `212-220`), so convert `dueDate` there and leave every `organizationId` predicate untouched. Return it to the client as `YYYY-MM-DD` (`toISOString().slice(0, 10)`), not as a full timestamp.

**Tests**: in `projectService.test.ts` (pure, no database), assert that `taskInput.safeParse` rejects `2027-02-30` and accepts `2028-02-29` and `null`. In `projectRepository.test.ts` (integration), create a task with a due date, clear it with `dueDate: null`, and read the row back; then send a stale version and assert 409 with the stored date unchanged.

**UI**: an `<input type="date">` bound to the task draft; send its string as-is, include it in `exportDraft("task-draft.json", ...)` (`ProjectsPage.tsx:720`), and show "no due date" for null rather than an empty cell.
