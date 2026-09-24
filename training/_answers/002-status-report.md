# SEALED — INC-002 status report trusts the tenant header

## Root cause

`backend/src/app.ts` on the incident branch mounts the new router as `app.use("/api/reports", reportRoutes)`. It sits
**after** `authenticate`, so callers must be signed in, but it has **no `attachTenantContext`**.
`backend/src/routes/reportRoutes.ts` then reads the tenant straight from the request:
`identity.safeParse(req.headers["x-org-id"])`. Any signed-in user can put any org id in the header and receive that org's
project names and task counts. This is the **original Grok starter's vulnerability, reintroduced**. Commit `41a9785`'s
`tenantContext.ts` also did `req.currentOrgId = req.headers['x-org-id']`. The rewrite fixed it for `/api/projects`
only by *where the middleware is mounted*, not by making it impossible to read the header elsewhere.

The raw SQL itself is correctly scoped: `WHERE p."organizationId" = ${org}`, and the join repeats the tenant match. The
bug is not in the query. The bug is that the query's tenant value came from an unverified source. `$queryRaw` also
meant none of the repository's habits applied (`identity.parse(org)` and the `projectIn` checks), so a reviewer
reading `projectRepository.ts` had nothing to compare it against.

The log explained: at 14:05:40 the contractor sent `x-org-id: demo_maple`. `/api/projects` goes through
`attachTenantContext` → `organizationMember.findUnique` → no row → 403. `/api/reports/task-status` doesn't, so it returns 200 with Maple's data.
The varying byte sizes are them iterating org ids.

## Why the PR's test passed

"summarizes task status per project for the dashboard" calls with `x-org-id: demo_cedar` **as a Cedar member** and asserts that
Maple's project is absent. It proves the SQL filters by the header value. It never tests the only question that matters for
a tenant boundary: *a caller who names an org they don't belong to*. Every isolation test needs a hostile row in which
the user and the claimed org don't match.

Reproduce:
```ts
await request(app).get("/api/reports/task-status")
  .set("Authorization", "Bearer " + issueToken("demo_member", secret))
  .set("x-org-id", "demo_maple");   // 200 + "Inventory refresh" on the incident branch
```

## Fix (verified: see the B06 report)

```ts
// app.ts
app.use("/api/reports", attachTenantContext, reportRoutes);
// reportRoutes.ts — the tenant comes from verified membership, never from the header
const { organizationId } = requireTenant(req);
... WHERE p."organizationId" = ${organizationId}
```
Structural follow-up, so the next router can't forget: mount `attachTenantContext` **once** on a tenant sub-app:
`const tenantApi = Router(); tenantApi.use(attachTenantContext); tenantApi.use("/projects", …); tenantApi.use("/reports", …); app.use("/api", tenantApi)`.
Keep `/api/me` and `/api/auth` explicitly outside it. Add a lint or grep rule in CI that fails on `headers["x-org-id"]`
outside `middleware/tenantContext.ts`.

Regression test (`backend/src/__tests__/reportTenant.test.ts`; fails on the branch, passes with the fix):
- `demo_member` + `x-org-id: demo_maple` → **403**, and the body doesn't contain "Inventory refresh"
- `demo_member` + `x-org-id: demo_cedar` → 200, and the body includes "Customer portal"

## Defense in depth: the RLS backstop (question 5; verified with psql on PG 18, see the B06 report)

1. **Role.** Today the app connects as the role that ran the migrations and owns the tables. `docker-compose.yml` makes
   `tenant_dev` the `POSTGRES_USER`, which is a **superuser**. Superusers and `BYPASSRLS` roles *always* skip RLS, even
   with `FORCE`. So step one is a separate `tenant_app` role (`NOSUPERUSER NOBYPASSRLS`, DML grants only) for the running
   app. Keep the owner role for `prisma migrate deploy`. `FORCE ROW LEVEL SECURITY` covers the case where the app role owns the tables.
2. **Getting the tenant in safely with pooling.** Prisma pools connections. A session-level `SET app.organization_id` sticks to
   the physical connection, and the next request that borrows it inherits the previous tenant. The probe showed exactly
   this. Use `SELECT set_config('app.organization_id', $1, true)`: the third argument, `true`, makes it transaction-local.
   Every tenant query then runs inside `prisma.$transaction(async (tx) => { await tx.$queryRaw`SELECT set_config(...)`; … })`,
   and the value vanishes at COMMIT or ROLLBACK. Take the value only from `requireTenant(req)`, never from the header.
3. **Policy.**
   ```sql
   ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY; ALTER TABLE "Project" FORCE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation ON "Project"
     USING ("organizationId" = current_setting('app.organization_id', true))
     WITH CHECK ("organizationId" = current_setting('app.organization_id', true));
   ```
   Do the same for `Task` and `AuditEvent`. `Task` **does** need its own policy. The compound FK stops a task from pointing
   at another tenant's project, but it does nothing to stop *reading* another tenant's tasks. FKs constrain writes, and
   policies constrain visibility. `current_setting(..., true)` returns NULL when the setting is unset, and
   `col = NULL` is never true, so a forgotten `set_config` **fails closed** with zero rows, not an error. That is safe, but it
   looks like an empty dashboard, so log or alert when a tenant query returns zero rows unexpectedly.
   `OrganizationMember` is the exception. `attachTenantContext` must read it *before* the tenant is known, so either leave
   it without a policy or use a policy keyed on `app.user_id`.
4. **What breaks.** Migrations must run as the owner. `seed.ts` must set the tenant per org or run as owner. The tests'
   `deleteMany()` resets, run as `tenant_app` with no tenant, silently delete **0 rows**, and the probe confirmed this. The
   same probe showed the other side of it: on a connection where a *session-level* `SET` had leaked `demo_maple`, the same
   `DELETE FROM "Task"` removed Maple's row. Use transaction-local `set_config(..., true)` only.
   They must run as owner or use `TRUNCATE`. `scripts/test-database.mjs` would need to create the app role after
   `migrate deploy`. Unique-constraint lookups across tenants (e.g. `User.email`) are unaffected, because `User` is global.

## Would RLS have stopped this incident? (question 6)

**Only if the tenant setting came from verified context.** If the report handler had called
`set_config('app.organization_id', <header value>)`, RLS would faithfully show Maple's rows: garbage in, garbage out.
RLS is a backstop against a **forgotten `WHERE`** (the next raw query, a new repository, an admin script run as the
app role). It is not a backstop against **choosing the wrong tenant**. Only the membership check fixes that. Say both halves in an interview.

## Model postmortem

- **Impact:** one user read Maple's project names and task counts, 213 requests over about 2 days. No writes.
- **Detection:** customer escalation. The logs had no org header and no "membership denied" metric, and the 403 → 200 pair was never correlated.
- **Root cause:** a new router was mounted outside the tenant middleware and trusted `x-org-id`, which is the starter's original flaw returning through a new path.
- **Fix:** mount under `attachTenantContext`, and add a regression test for a non-member caller.
- **Follow-ups:** a tenant sub-router, a CI grep for `x-org-id`, an RLS backstop with a non-superuser app role, and a log line for 403 membership denials with an alert on N per user per 10 min. That alert would have fired at 14:05:40.
