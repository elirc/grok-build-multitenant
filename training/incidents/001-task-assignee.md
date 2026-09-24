# INC-001 — "Why is a stranger assigned to our task?"

**Branch:** `training/incidents/001-task-assignee` (based on `training/base/working-tree-snapshot`)
**Severity:** SEV-2 (possible cross-tenant data exposure) · **Time box:** 75 min
**Sealed answer:** `training/_answers/001-task-assignee.md`. Don't open it until you've written your postmortem.

## What on-call sees

Two days after PR #41 "Task assignees (API first, UI next sprint)" shipped, support forwards this message from the Cedar Studio owner:

> Our task list API response shows a task in "Customer portal" assigned to **Morgan Owner (outsider@example.test)**.
> Nobody by that name works here. Who is this person, and why can they see our work?

The security lead ran this query against a read replica:

```text
tenant_workspace=> SELECT count(*) AS tasks, count(DISTINCT t."organizationId") AS orgs
                   FROM "Task" t WHERE t."assigneeId" IS NOT NULL
                   AND <some condition you will have to write yourself>;
 tasks | orgs
-------+------
    37 |   12
```

CI was green on the PR (`npm test`, which includes the new test "assigns, lists, and clears a task assignee").
There were no 5xx errors and no conflicts. Access logs for the affected tasks show normal `201`/`200` responses from real members of each org.

## Excerpt from the suspect PR (full diff: `git diff training/base/working-tree-snapshot training/incidents/001-task-assignee`)

```text
backend/prisma/schema.prisma                                   | +4
backend/prisma/migrations/202609240001_task_assignee/migration.sql | new
backend/src/lib/validation.ts                                  | +9 -1
backend/src/repositories/projectRepository.ts                  | +10
backend/src/__tests__/projectRepository.test.ts                | +32
```

PR description: *"Adds optional `assigneeId` to tasks. Validated server-side (404 if the user doesn't exist), included in list/get
responses, with a FK so we can't reference a deleted user. The composite-FK pattern from Task→Project doesn't apply here
because users aren't tenant-scoped."*

## Your job

1. Reproduce it locally (`npm test` harness or a seeded dev DB). Write the one request that creates the bad row.
2. Finish the security lead's query so it finds **every** affected row. Explain why it's a query about *two* columns.
3. Find the root cause. Then answer: which claims in the PR description are true, and which are false?
4. Write the fix. Include the schema, the migration (remember the 37 rows already in production), and the application check.
5. Write a regression test that would have failed on this branch. It needs at least one case that **bypasses the repository**.
6. Answer: what happens to assigned tasks when a member is removed from the org, before and after your fix? Is that the behavior you want?
7. Write a 5-line postmortem: impact, detection gap, root cause, fix, follow-up.

Concept pages: `apprenticeship/curriculum/07-zero-downtime-migrations.md` (tightening a constraint on live data),
`apprenticeship/curriculum/05-verify-before-trust.md` (reading a PR description as a claim).
