# INC-002 — "A competitor knew our project names"

**Branch:** `training/incidents/002-status-report` (based on `training/base/working-tree-snapshot`)
**Severity:** SEV-1 (confirmed cross-tenant read) · **Time box:** 75 min
**Sealed answer:** `training/_answers/002-status-report.md`

## What on-call sees

Friday 16:40. The Maple Works owner (`outsider@example.test`) escalates:

> A contractor who only works with Cedar Studio sent us a screenshot. It lists our internal project names with
> TODO/IN_PROGRESS/DONE counts. That dashboard was never shared with them.

Access log for Thursday, filtered to the contractor's user id. The app logs only status and bytes, not headers:

```text
ts                    user          method path                        status bytes  ms
2026-09-24T14:02:11Z  demo_member   GET    /api/projects                200    1874   41
2026-09-24T14:02:12Z  demo_member   GET    /api/reports/task-status     200     311   18
2026-09-24T14:05:40Z  demo_member   GET    /api/projects                403      98    9
2026-09-24T14:05:41Z  demo_member   GET    /api/reports/task-status     200     402   17
2026-09-24T14:05:58Z  demo_member   GET    /api/projects/cm1x.../tasks  403      98    8
... 211 more /api/reports/task-status lines, all 200, byte sizes vary between 96 and 1,204
```

Membership table: `demo_member` has exactly one row, `(demo_member, demo_cedar, MEMBER)`.
No deploys since Wednesday's "Dashboard: one grouped query for task status (fixes N+1)". CI was green, including the new test
"summarizes task status per project for the dashboard", which asserts that Maple's project does **not** appear in Cedar's report.

## Suspect PR

`git diff training/base/working-tree-snapshot training/incidents/002-status-report`. It touches `backend/src/app.ts`,
adds `backend/src/routes/reportRoutes.ts`, and adds one test.

## Your job

1. Explain the log. Why is `/api/projects` a 403 at 14:05:40 but the report a 200 one second later, for the same user?
2. Reproduce it with a single `supertest` or `curl` call against the seeded data.
3. Find the root cause. Then explain why the PR's own isolation test passed. What exactly was that test proving?
4. Write the fix and a regression test that fails on this branch.
5. **Defense in depth.** The report uses `prisma.$queryRaw`. Suppose a future engineer adds a *second* raw query and forgets the
   `WHERE "organizationId" = …` clause entirely. Design a PostgreSQL row-level security backstop that turns that mistake into
   zero rows instead of a leak. Cover four things:
   - which role the app must connect as. Look at `docker-compose.yml` and the `DATABASE_URL` in `backend/.env.example`. Who owns the tables?
   - how the tenant id gets into the session safely when Prisma pools connections, and why `SET` is wrong but `set_config(..., true)` inside a transaction is right
   - what the policy on `Task` looks like, and whether `Task` even needs its own policy given the compound FK
   - what breaks: migrations, the seed, `scripts/test-database.mjs`, and the test suite's `deleteMany()` resets
6. Would RLS have stopped **this** incident? Answer carefully. What is RLS a backstop *for*, and what does it not replace?
7. Write a 5-line postmortem, and add one detection improvement that would have paged someone before the customer did.

Concept page: `apprenticeship/curriculum/05-verify-before-trust.md`. There is no central RLS page yet (see the B06 report).
