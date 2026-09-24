# SEALED — INC-001 task assignee crosses tenants

## Root cause (two layers, both needed)

1. **Application check verifies existence, not tenancy.** `checkAssignee` in `backend/src/repositories/projectRepository.ts`
   does `tx.user.findUnique({ where: { id: assigneeId } })`. `User` is a global table, so any real user in any org passes.
   A Cedar owner can POST `{"title":"x","status":"TODO","assigneeId":"demo_outsider"}` to a Cedar project and get `201`.
2. **The database constraint is a simple FK to the wrong parent.** Migration `202609240001_task_assignee` adds
   `FOREIGN KEY ("assigneeId") REFERENCES "User"("id")`. PostgreSQL only checks that the user exists. The repo already had
   the right pattern for tenant-owned references: `Task (projectId, organizationId) → Project (id, organizationId)`. Assignment
   is a tenant-scoped fact, "this *member* of *this org*", so the correct parent is
   `OrganizationMember (userId, organizationId)`, which already has `@@unique([userId, organizationId])`.

Claims in the PR description, checked against the code:

| Claim | Verdict |
|---|---|
| "Validated server-side (404 if the user doesn't exist)" | True, and that is exactly the bug: existence ≠ membership. It also turns the endpoint into a **user-id oracle**: 404 vs 201 tells a caller whether an id exists anywhere in the system. |
| "FK so we can't reference a deleted user" | True but irrelevant. `ON DELETE SET NULL` also silently un-assigns. |
| "Composite-FK pattern doesn't apply because users aren't tenant-scoped" | **False premise.** Users aren't tenant-scoped, but *memberships* are. The FK should point at the membership. |

Impact: the list/get responses include `assignee: {id, name, email}`, so each bad row leaks another tenant's user's
name and email into this tenant. It also creates a fake "relationship" that a future "My tasks" view would expose the other way.

## Diagnostic path a senior takes

1. Reproduce with the seed: `demo_owner` is OWNER of Cedar, and `demo_outsider` is a member only of Maple. One POST reproduces it.
2. Blast-radius query. The condition involves *two* columns because tenancy is a property of the pair:
   ```sql
   SELECT t."id", t."organizationId", t."assigneeId"
   FROM "Task" t
   WHERE t."assigneeId" IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM "OrganizationMember" m
                     WHERE m."userId" = t."assigneeId" AND m."organizationId" = t."organizationId");
   ```
   Export this for the security review **before** repairing the rows.
3. `git diff` the PR. Grep the schema for every `@relation(` whose parent is tenant-owned but whose `fields:` lacks
   `organizationId`. That is the systemic check.

## Fix (verified: see the B06 report)

Schema (`backend/prisma/schema.prisma`):
```prisma
model OrganizationMember {
  ...
  assignedTasks Task[] @relation("TaskAssignee")
}
model Task {
  ...
  assigneeId String?
  assignee OrganizationMember? @relation("TaskAssignee", fields: [assigneeId, organizationId], references: [userId, organizationId], onDelete: Restrict)
  @@index([assigneeId, organizationId])
}
```
Remove `assignedTasks` from `User`. `Task.organizationId` now takes part in two compound relations, and Prisma accepts that.

Migration `202609240002_task_assignee_member_fk/migration.sql`:
```sql
UPDATE "Task" t SET "assigneeId" = NULL
WHERE t."assigneeId" IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM "OrganizationMember" m
  WHERE m."userId" = t."assigneeId" AND m."organizationId" = t."organizationId");
ALTER TABLE "Task" DROP CONSTRAINT "Task_assigneeId_fkey";
DROP INDEX "Task_assigneeId_idx";
CREATE INDEX "Task_assigneeId_organizationId_idx" ON "Task"("assigneeId", "organizationId");
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_organizationId_fkey"
  FOREIGN KEY ("assigneeId", "organizationId") REFERENCES "OrganizationMember"("userId", "organizationId")
  ON DELETE RESTRICT ON UPDATE CASCADE;
```
On a large production table, split the last statement (curriculum page 07): `ADD CONSTRAINT ... NOT VALID` takes only a
brief lock, and `VALIDATE CONSTRAINT` runs afterwards without blocking writes. The repair `UPDATE` must run first, or
`VALIDATE` fails.

Why compound-FK `SetNull` isn't used: Prisma's `onDelete: SetNull` on a compound FK would null **both** columns, including
the required `organizationId`, and Prisma rejects the schema. PostgreSQL 15+ supports `ON DELETE SET NULL ("assigneeId")`
with a column list, but Prisma can't express it. Hand-editing it into SQL creates schema drift, and the next
`prisma migrate dev` would try to "fix" it. `Restrict` was the deliberate choice here: you can't revoke a member while they
still own tasks, which matches the repo's existing "delete tasks explicitly before deleting the project" rule.

Repository (`checkAssignee`):
```ts
async function checkAssignee(tx: Tx, org: string, assigneeId: string | null) {
  if (!assigneeId) return;
  const member = await tx.organizationMember.findUnique({
    where: { userId_organizationId: { userId: assigneeId, organizationId: identity.parse(org) } },
  });
  if (!member) throw new AppError(400, "Assignee must be a member of this organization.");
}
```
Call it with `context.organizationId` in `createTask` and `updateTask`. Return 400 for "unknown" and "other tenant" alike, which
removes the id oracle. Change the `include` to `assignee: { select: { user: { select: { id, name, email } } } }`.

**This fix changes the API contract, and the PR's own test catches it.** "assigns, lists, and clears a task assignee" in
`projectRepository.test.ts` expects `404` for `no_such_user` and a flat `assignee: {id, name, email}`. With the fix it
gets `400` and `assignee.user`, so it fails. In the verification run, the test was updated to `400` and `assignee.user`. The UI
hadn't shipped yet ("UI next sprint"), so changing the shape was cheap. If a client already depended on the flat
shape, flatten it in the repository (`{...row, assignee: row.assignee?.user ?? null}`) and keep the contract. Say in the PR which option you chose.

## Regression test (verified: fails on the incident branch, passes with the fix)

`backend/src/__tests__/taskAssigneeTenant.test.ts` (it uses the same guarded setup as `projectRepository.test.ts`):
- Cedar owner assigns `demo_outsider` → **400**, and the task count is unchanged. On the incident branch this is 201.
- Maple owner assigns `demo_owner`, who is a member of both orgs → 201. This guards against over-tightening.
- **Repository bypassed:** `prisma.$executeRaw` inserts a Cedar task with `assigneeId = 'demo_outsider'` → rejected with
  23503. On the incident branch the insert succeeds. This is the test that proves the *database* owns the rule.

## Member removal (question 6)

- Incident branch: `ON DELETE SET NULL` to `User`. Deleting a *membership* does nothing, so the ex-member stays assigned and
  visible forever. Only deleting the whole user un-assigns them.
- Fix: `ON DELETE RESTRICT` on the membership. Revoking a member who still has assigned tasks fails with P2003, which
  `errors.ts` maps to 409. The revoke flow must un-assign or reassign first, in the same transaction. That is a product
  decision, so write it down.

## Model postmortem

- **Impact:** 37 tasks in 12 orgs referenced users from other tenants, and their name and email were exposed to the task's tenant for about 2 days.
- **Detection:** a customer did. Tests covered only the happy path, and nothing asserted the schema-wide invariant.
- **Root cause:** a new tenant-owned relation was modeled as a global FK, and the app check tested existence instead of membership.
- **Fix:** a compound FK to `OrganizationMember(userId, organizationId)`, a data repair, a membership check, and a bypass-the-repo regression test.
- **Follow-up:** a schema lint in CI that fails when a relation between two tenant-owned models omits `organizationId`, plus a PR checklist line: "what does the DB reject?"
