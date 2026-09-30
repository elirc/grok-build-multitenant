# Now scale it: eight follow-ups

Each answer begins with what the code does today and ends with the cost of changing it.

```
 React client (frontend/src/api/client.ts:77-81)
   Authorization: Bearer <token>        x-org-id: <organizationId>
                 |
                 v
 app.ts  requestId + no-store + nosniff        (22-31)
         CORS origin allowlist -> 403          (32-43)
         express.json 32kb strict              (44)
         /api  authenticate(secret) -> req.userId   (53)
         /api/projects  attachTenantContext         (60)
                 |
                 v
 tenantContext.ts   userId?            -> 401
                    x-org-id valid?    -> 400
                    membership row?    -> 403      (25-34)
                    req.tenant = { userId, organizationId, role }   (35-39)
                 |
                 v
 projectRoutes.ts   non-GET: no query params -> 400, non-JSON -> 415   (8-16)
 projectService.ts  requireManager for project writes; Zod .strict() parse
                 |
                 v
 projectRepository  every where carries organizationId
                    updateMany{ id, organizationId, version } -> count===1
                    zero rows -> scoped re-read -> 404 or 409
                 |
                 v
 PostgreSQL 18   Project @@unique([id, organizationId])
                 Task FK (projectId, organizationId) -> Project(id, organizationId)  RESTRICT
                 no row-level security policy
```

## 1. Three instances behind a load balancer: what changes?

Tenancy is unaffected, because it is decided per request from a database row rather than from process state. Optimistic concurrency is likewise decided by PostgreSQL: the predicate in `backend/src/repositories/projectRepository.ts:106-113` is evaluated by the database, so two instances race exactly as two requests on one instance do.

Two things are process-local. The login limiter is a `Map` created inside `authRoutes` (`backend/src/middleware/auth.ts:77`), with a cap of twenty attempts and a 1000-key bound, so three instances mean three times the attempt budget; `astraupskill/VERIFICATION.md` already records throttling as process-local. And the membership read at `backend/src/middleware/tenantContext.ts:25-32` becomes N times the query volume, which is the first thing anyone will want to cache. The moment you cache it, the TTL becomes the revocation delay, so that number is a policy decision and belongs in a document, not in a constant.

## 2. Ten thousand tenants: is one shared schema still right?

Yes, for this shape. Every tenant-owned table carries `organizationId` and is indexed by it first: `@@index([organizationId, createdAt, id])` on `Project` (`backend/prisma/schema.prisma:55`) and `@@index([organizationId, projectId, createdAt, id])` on `Task` (line 67). Queries are index range scans within a tenant, so a large tenant count costs storage, not query time.

The alternative, schema per tenant, buys hard isolation and per-tenant restore at the price of ten thousand copies of every migration, and connection pools that cannot be shared. Database per tenant makes noisy-neighbour problems disappear and makes cross-tenant reporting painful. The honest reason to stay on the shared schema here is that the code is already written for it and the one place where isolation is structurally guaranteed, the composite foreign key at `migration.sql:113`, works the same at any scale.

## 3. Isolation depends on every query remembering `organizationId`. How would you make that harder to get wrong?

PostgreSQL row-level security. Every tenant table already has the column, so the policy is `USING (organizationId = current_setting('app.organization_id'))` and the application sets that setting at the start of each transaction. A forgotten predicate then returns nothing instead of returning someone else's rows, which converts a data leak into a bug report.

The costs are real and worth naming. Connection pooling means the setting must be applied per transaction, not per connection, or a pooled connection carries the previous request's tenant. Prisma has no first-class support, so it needs a raw `SET LOCAL` inside each `$transaction`. And the superuser or table owner bypasses policies unless `FORCE ROW LEVEL SECURITY` is set, which is easy to miss. `astraupskill/VERIFICATION.md` lists row-level security as absent, so today the guarantee is convention plus the integration suite, in particular "scopes single reads and writes even when the user belongs to both tenants" (`backend/src/__tests__/projectRepository.test.ts:179`).

## 4. One million projects across tenants. Does the list endpoint hold?

The per-tenant read does, because the index leads with `organizationId`. The pagination does not. `findByOrganizationId` at `projectRepository.ts:72-86` uses `skip: (page - 1) * 20` and a `count` inside a `RepeatableRead` transaction. For the biggest tenant, deep pages make PostgreSQL walk and discard rows, and the count scans that tenant's whole filtered set every time. The Zod page bound of 10000 (`backend/src/lib/validation.ts:31-36`) caps the blast radius without changing the shape.

Keyset pagination on `(createdAt, id)` matches the existing `ordered` array at `projectRepository.ts:15` exactly, so the index already supports it; what is lost is jumping to page 40 and knowing the exact total. Search is the worse half: `contains` with `mode: "insensitive"` is `ILIKE '%term%'` and cannot use a b-tree, so at a million rows it needs a `pg_trgm` index, which is a migration rather than a code change.

## 5. Where do background jobs belong here, and what is the first one?

There are none today; every effect happens inside the request. `astraupskill/05-PRACTICE.md` task 5 names the first one: an outbox. A notification intent is inserted in the same transaction as the task change, and a separate worker delivers it with a fake adapter.

The reason to do it that way rather than sending from the request handler is that `prisma.$transaction` cannot roll back an email. The outbox keeps the current property that an effect and its record commit together, which the audit rollback tests already prove ("rolls back task mutations when their audit fails", `projectRepository.test.ts:411`), and moves the unreliable part outside. The remaining crash window is between the external delivery and marking the row sent, which makes delivery at-least-once; the practice text says exactly that, and the mitigation is a deduplication key the receiver honours, not a longer transaction.

## 6. Creates are not idempotent. What is the fix, concretely?

A retried `POST /api/projects` after a dropped response creates a second project, because only updates and deletes carry a version. The fix is a client-generated key, scoped to the authenticated user, the organization and the operation, stored with a fingerprint of the validated payload, and committed in the same transaction as the record and its audit event. The replay returns the original id; the same key with a different payload is a 409.

There is a working implementation of this shape in the sibling project, and `astraupskill/05-PRACTICE.md` task 3 points at it: `grokbuildecommerceproject/backend/src/repositories/orderRepository.ts`, where checkout takes a per-caller advisory lock, then reads a durable receipt on a unique index before building anything. The lock is not what makes it correct, the unique index is; the lock is what makes a concurrent duplicate return the original record with a 200 rather than fail as a constraint violation.

## 7. Auth: what would you change before real customers?

Today the token is HS256 with a thirty minute life and the membership is re-read per request, which is a deliberate trade: one extra query for immediate revocation. Missing pieces, all listed in `astraupskill/VERIFICATION.md`, are MFA, a refresh flow, an invitation path and server-side revocation.

The ordering I would argue for: a shared login limiter first, because the current one is per process and therefore weakest exactly when you scale out; then invitations and membership administration, because without them a real customer cannot onboard a colleague at all; then refresh tokens, because thirty minutes with no refresh is a usability problem that pushes people towards long-lived tokens, which is the wrong direction. MFA last, because it is the one users can live without while the others are structural.

## 8. Observability: the first three signals.

Today only 500 and above logs, as `{requestId, status, event: "request_failed"}` (`backend/src/lib/errors.ts:61-68`), with `X-Request-Id` on every response from `backend/src/app.ts:22-31`.

First, count 403s from `attachTenantContext` separately from 403s from `requireManager`. They mean completely different things: the first is someone acting in an organization they do not belong to, which in a multi-tenant system is the alert you actually want, and the second is a member clicking a button the UI should not have shown them. Second, count 409s by cause, stale version against referenced deletion, because a rising stale rate usually means the UI is refreshing too aggressively rather than that users are fighting. Third, tag every log line with the organization id from `req.tenant`, which makes per-tenant debugging possible and is also the field that makes retention expensive, so it belongs in structured logs rather than in metric labels.

## Translating for a .NET interview

`attachTenantContext` is an authorization middleware or a claims transformation backed by a query; the important sentence is the same, that the role comes from the store and not from the token. The conditional `updateMany` becomes `ExecuteUpdateAsync` with the same `Where`, or a `[ConcurrencyCheck]`/`[Timestamp]` property raising `DbUpdateConcurrencyException`, mapped to 409 where `errors.ts:37-41` maps `P2002`. The composite foreign key is a `HasOne(...).WithMany().HasForeignKey(t => new { t.ProjectId, t.OrganizationId })` with a matching alternate key, which is worth mentioning because it shows the tenant rule lives in the schema rather than in whichever service writes next. Zod maps to FluentValidation, and `ValidationProblemDetails` already has the per-field shape that `errors.ts:33-36` builds by hand.
