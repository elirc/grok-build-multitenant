# Flashcards: tenant workspace

Cover the right column. All answers are specific to this repository.

| Question | Answer |
|---|---|
| How is the acting organization chosen? | The `x-org-id` header, validated and then confirmed against a membership row (`backend/src/middleware/tenantContext.ts:19-34`) |
| What did the delivered middleware do instead? | `req.currentOrgId = headers['x-org-id'] \|\| 'demo-org'`, kept in `astraupskill/snapshots/tenantContext-before.ts.txt` |
| Missing `x-org-id` header? | 400 "Select an organization using the x-org-id header." |
| Header naming an organization you do not belong to? | 403 "You are not a member of that organization." |
| Why is an unknown organization the same 403 as a revoked membership? | So responses cannot be used to enumerate tenants; `tenantContext.test.ts:29` and `:37` |
| Where does the caller's role come from? | `membership.role`, read this request (`tenantContext.ts:38`), never from the token |
| How fast does revoking a membership take effect? | On the next request, because the row is read every time (`projectRepository.test.ts:154`) |
| What does `requireManager` allow? | OWNER and ADMIN change projects; MEMBER may manage tasks (`tenantContext.ts:50-56`) |
| Which service calls enforce that? | `createProject`, `updateProject`, `deleteProject` (`backend/src/services/projectService.ts:21`, `:29`, `:38`); task calls do not |
| Shape of a project update body? | `{ version, project: { name, description } }`, both objects `.strict()` (`backend/src/lib/validation.ts:13-22`) |
| What happens to an `organizationId` sent inside `project`? | 400 from Zod; the case is "rejects client-controlled tenant and identity fields" (`projectService.test.ts:23`) |
| The project update predicate? | `updateMany({ where: { id, organizationId, version: expected } })` (`backend/src/repositories/projectRepository.ts:106-113`) |
| What happens when it changes zero rows? | A scoped re-read runs first, so the answer is 404 for another tenant's id and 409 for a stale version (lines 114-117) |
| Exact conflict message? | "This record changed. Export your draft, then load the current record before retrying." (`projectRepository.ts:52-56`) |
| Not-found message for a project? | "Project not found in this organization." (`projectRepository.ts:42`) |
| Why does `Task` carry `organizationId`? | To support the composite foreign key `(projectId, organizationId)` to `Project(id, organizationId)` (`schema.prisma:66`) |
| Which unique key makes that possible? | `@@unique([id, organizationId])` on `Project` (`schema.prisma:54`) |
| The SQL constraint name? | `Task_projectId_organizationId_fkey`, `ON DELETE RESTRICT` (`backend/prisma/migrations/202609090001_tenant_workspace/migration.sql:113`) |
| Which test proves it without the repository? | "enforces tenant parent matching in the database itself" (`projectRepository.test.ts:362`) |
| Deleting a project that has tasks? | 409 "Delete the project tasks explicitly before deleting this project." (`projectRepository.ts:139-142`) |
| Delete predicate for a project? | `{ id, organizationId, version, tasks: { none: {} } }` (`projectRepository.ts:128-134`) |
| Task lookup key? | `{ id, projectId, organizationId }` in `taskIn` (`projectRepository.ts:45-51`), so a wrong parent is a 404 |
| Page size and ordering? | 20 per page, `createdAt desc, id asc` (`projectRepository.ts:14-15`) |
| Isolation level of list reads? | `RepeatableRead`, with `findMany` and `count` in one transaction (`projectRepository.ts:72-86`) |
| What does `literal()` do and why? | Escapes `\`, `%`, `_` because Prisma sends `contains` to SQL `LIKE` (`projectRepository.ts:16-18`) |
| The `identity` regex? | `/^[a-zA-Z0-9_-]{1,64}$/` (`validation.ts:25-27`), re-applied inside repository functions |
| Which test covers a repository called without tenant context? | "fails closed when an internal caller omits organization context" (`projectRepository.test.ts:88`) |
| How is audit atomicity achieved? | `audit()` takes the transaction client `tx` (`projectRepository.ts:19-37`), so the insert commits with the change |
| Why does `AuditEvent` have no foreign keys? | So deleting a record does not erase its history; the comment is at `schema.prisma:78` |
| Which Prisma codes map to 409? | `P2002`, `P2003`, `P2034` (`backend/src/lib/errors.ts:38`) |
| Body size limit and its status? | 32 KiB (`backend/src/app.ts:44`); `entity.too.large` becomes 413 (`errors.ts:52-54`) |
| Query parameters on a non-GET project route? | 400 from the router guard at `backend/src/routes/projectRoutes.ts:8-12` |
| Wrong content type on a mutation? | 415 "Send application/json." (`projectRoutes.ts:13-14`) |
| Which responses log to the console? | Only `status >= 500`, as `{requestId, status, event: "request_failed"}` (`errors.ts:61-68`) |
| Status and header when a task is created? | 201 with `Location: /api/projects/<id>/tasks/<taskId>` (`projectRoutes.ts:69-72`) |
| Where is `attachTenantContext` mounted? | On `/api/projects` only (`app.ts:60`); `authenticate` is mounted on all of `/api` at line 53 |
| What does the browser send on every call? | The bearer token and `x-org-id` from one scope object (`frontend/src/api/client.ts:77-81`) |
| Login attempt limit? | 20 per key, with a 1000-entry bound, in a per-process `Map` (`backend/src/middleware/auth.ts:77`, `:90`) |
| How many checks did the verified run pass? | 55: 36 backend, 6 frontend, 3 setup, 10 Chromium (`astraupskill/VERIFICATION.md`) |
| Which evidence directory do those numbers refer to? | `verified/`, not the earlier `first`, `second` or `browser-first` attempts |
| Command for the backend suite? | `npm test`, which is `node scripts/test-database.mjs backend` |
| Two limits to state out loud? | No row-level security policy, and no durable create idempotency |
