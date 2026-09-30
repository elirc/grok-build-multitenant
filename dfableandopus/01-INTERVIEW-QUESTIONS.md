# Interview questions: tenant workspace

Tags are **[junior]** and **[mid]**. Every technical claim cites a path and line checked on disk.

## Screening

**S1. Describe the data model. [junior]**
`backend/prisma/schema.prisma`. `Organization` (line 18) and `User` (line 26) are joined by `OrganizationMember` (line 34), which carries the `Role` enum of OWNER, ADMIN, MEMBER and is `@@unique([userId, organizationId])` at line 41. `Project` (line 44) carries `organizationId`, a `version Int @default(1)` and, unusually, `@@unique([id, organizationId])` at line 54. `Task` (line 57) carries both `projectId` and `organizationId` and relates to the project through a composite foreign key at line 66. `AuditEvent` (line 69) is indexed by organization, resource type, resource id and time.

**S2. Why does `Task` store `organizationId` when it already has a `projectId`? [mid]**
So the database can enforce that a task and its project belong to the same tenant. The relation at `schema.prisma:66` is `@relation(fields: [projectId, organizationId], references: [id, organizationId])`, which is why `Project` needs the otherwise redundant `@@unique([id, organizationId])`: a composite foreign key needs a matching unique key to point at. In SQL it is `Task_projectId_organizationId_fkey` at `backend/prisma/migrations/202609090001_tenant_workspace/migration.sql:113`. Denormalizing `organizationId` onto the child is the price; a cross-tenant task becoming impossible at the storage layer is what it buys.

**S3. Trace a project update through the stack. [junior]**
`PUT /api/projects/:id` at `backend/src/routes/projectRoutes.ts:25-32`. Before the router: request id and `no-store` headers (`backend/src/app.ts:22-31`), CORS origin check (lines 32-43), 32 KiB strict JSON (line 44), `authenticate(secret)` mounted on `/api` (line 53), then `attachTenantContext` mounted specifically on `/api/projects` (line 60). A router-level guard rejects query parameters and non-JSON content types on non-GET requests (`projectRoutes.ts:8-16`). The route calls `service.updateProject`, which calls `requireManager` and parses `projectUpdate` (`backend/src/services/projectService.ts:24-32`), and the repository performs the conditional write.

**S4. What can the client actually send in that update? [junior]**
`{ version, project: { name, description } }` and nothing else. `projectUpdate` at `backend/src/lib/validation.ts:20-22` is `.strict()` and wraps `projectInput`, which is also `.strict()` (line 13-15). An `organizationId` inside the project object is a 400, which is the whole point: tenancy is established by middleware and may not be replaced by user input. The unit case is "rejects client-controlled tenant and identity fields" (`backend/src/__tests__/projectService.test.ts:23`).

**S5. How does the server know which organization you are in? [junior]**
`attachTenantContext` at `backend/src/middleware/tenantContext.ts:12-44`. It requires `req.userId` from authentication, validates `x-org-id` with the `identity` regex, then reads the `OrganizationMember` row for that user and organization. Missing header is 400, missing membership is 403. Only after that does it set `req.tenant = { userId, organizationId, role: membership.role }`. The front end sends the header on every call from `frontend/src/api/client.ts:80`.

**S6. Where does the caller's role come from? [mid]**
From the membership row read on this request, at `tenantContext.ts:38`, never from the token. `requireManager` (lines 50-56) then allows OWNER and ADMIN to change projects and refuses MEMBER with "An owner or administrator must change projects. Members can manage tasks." Two tests pin it from different angles: "attaches the membership role, not anything the caller sent" (`backend/src/__tests__/tenantContext.test.ts:47`) and "reads changed roles from membership for every request" (`backend/src/__tests__/projectRepository.test.ts:246`).

**S7. What does the error handler guarantee? [mid]**
`backend/src/lib/errors.ts:19-70`. `AppError` keeps its own status; a `ZodError` becomes 400 carrying at most six `path: message` pairs; Prisma `P2002`, `P2003` and `P2034` become 409, other known Prisma errors and initialization failures 503, body-parser failures 413 or 400. Only 500 and above logs, and the log line is `{requestId, status, event: "request_failed"}` with no error text. Every body carries the `requestId` that was also sent as `X-Request-Id`.

**S8. Why is a task route nested under a project? [junior]**
Because the parent is part of the identity check. `taskIn` at `backend/src/repositories/projectRepository.ts:45-51` looks up a task by `{ id, projectId, organizationId }`, so asking for a real task under the wrong project id is a 404, not a successful read. The route shape at `projectRoutes.ts:87-99` makes that parent explicit rather than optional.

## Deep dive

**D1. What did the delivered tenant middleware do, and why is it the interesting bug? [mid]**
It read the header and fell back to a constant: `req.currentOrgId = (req.headers['x-org-id'] as string) || 'demo-org'`, preserved in `astraupskill/snapshots/tenantContext-before.ts.txt`. Three failures in one line. Any caller could name any organization, because nothing checked membership. A caller who sent no header silently became a member of `demo-org`, so the failure mode was quiet rather than loud. And the comment above it claimed the production version would do the lookup, which is the kind of comment that gets mistaken for behaviour in a review.

**D2. Why is the missing header a 400 and the missing membership a 403? [mid]**
They are different failures. No `x-org-id` means the request is not well formed, so `tenantContext.ts:20-24` answers "Select an organization using the x-org-id header." A header naming an organization you do not belong to is a well-formed request that is refused, so line 33-34 answers 403 "You are not a member of that organization." The deliberate part is that an unknown organization and a revoked membership give the same 403, so the response cannot be used to enumerate which organizations exist. Two tests assert exactly that pair: `tenantContext.test.ts:29` and `:37`.

**D3. Revoking a membership: how fast does it take effect? [mid]**
On the next request. The token is verified for identity only, and the membership row is read every time a project route is hit, so removing the row locks the user out without waiting for the thirty minute expiry. "removes access after membership revocation without trusting old JWT roles" (`projectRepository.test.ts:154`) is the case. The honest limit, written in `astraupskill/VERIFICATION.md`, is that there is no atomic revocation against an operation already in flight, and the cost of the design is one database round trip per request.

**D4. Walk through the conditional update. [mid]**
`update` at `projectRepository.ts:99-121`, inside one transaction. `updateMany` matches `{ id, organizationId, version: expected }` and increments the version. If `changed.count !== 1`, line 115 calls `projectIn`, a scoped read, before throwing `conflict()`. That extra read is the point: it distinguishes "this project is not in your organization" (404 from line 42) from "you had a stale version" (409). Returning one status for both would tell a caller from another tenant that the record exists.

**D5. Why is the version in the `where` rather than checked after a read? [junior]**
Because a read-then-write leaves a window. Two managers who both loaded version 3 would both pass a JavaScript comparison and both write. With the version in the predicate the database decides: the first update matches one row and makes it version 4, the second matches zero and becomes a 409 carrying "This record changed. Export your draft, then load the current record before retrying." (`projectRepository.ts:52-56`). "accepts one of two concurrent project updates" (`projectRepository.test.ts:281`) runs both at once.

**D6. What breaks if you remove `organizationId` from the `where` at line 109? [mid]**
Cross-tenant writes. The version and id would still match, so an ADMIN of organization B who learned a project id from organization A could update it, and the audit row would be written with B's organization id at line 118, attributing A's change to the wrong tenant. Nothing else in the stack would stop it: `attachTenantContext` verified membership in B, not ownership of the record. This is the difference between authentication, authorization and scoping, and it is why every repository function takes `organizationId` explicitly rather than reading it from a global.

**D7. Deleting a project with tasks. [mid]**
`remove` at lines 122-147 deletes with `deleteMany` matching `{ id, organizationId, version, tasks: { none: {} } }`. On zero rows it re-reads and branches: a version mismatch is the shared conflict, otherwise "Delete the project tasks explicitly before deleting this project." The database agrees independently because `Task_projectId_organizationId_fkey` is `ON DELETE RESTRICT` (`migration.sql:113`), so even a direct SQL delete fails. The test is "requires explicit task removal before project deletion" (`projectRepository.test.ts:314`).

**D8. Can a MEMBER do anything? [junior]**
Yes, tasks. `requireManager` is called in `projectService.ts` only for create, update and delete of projects (lines 21, 29, 38); the task functions do not call it. So a MEMBER reads projects and has full CRUD on tasks within them, which "forbids member project mutations while allowing task CRUD" (`projectRepository.test.ts:204`) covers. Whether that is the right policy is a fair interview question; the answer is that it is a deliberate two-level model, not an oversight.

**D9. Why do list reads run inside a transaction? [mid]**
`findByOrganizationId` at lines 72-86 and `listTasks` at 153-182 both run `findMany` and `count` inside `prisma.$transaction` at `RepeatableRead`, so the page and the total agree. `listTasks` also calls `projectIn` first, inside the same transaction, so listing tasks of a project in another tenant is a 404 before any task is read. The cost is that a serialization failure would surface as `P2034`, which `errors.ts:38` maps to 409 on a GET.

**D10. What is `literal()` doing, and what is it not? [mid]**
`projectRepository.ts:17-18` escapes `\`, `%` and `_`, with the reason in the comment on line 16: Prisma turns `contains` into SQL `LIKE`, where those are wildcards. It is not SQL injection protection, which the parameterized query already provides. Without it, a search for `report_v2` matches `reportsv2` and a search for `%` matches everything. "uses literal wildcard search and stable bounded pages" (`projectRepository.test.ts:441`) covers it.

**D11. How do you know the audit row and the change commit together? [mid]**
Two cases install a failing audit path and assert the data did not move: "rolls back project create update and delete when audit fails" (`projectRepository.test.ts:383`) and "rolls back task mutations when their audit fails" (line 411). Because `audit` takes the transaction client `tx` (`projectRepository.ts:19-37`), the insert is part of the same transaction as the write, and every call site passes `tx`, not `prisma`.

**D12. The audit table has no foreign keys. Why? [mid]**
`AuditEvent` (`schema.prisma:69-79`) stores `organizationId`, `actorId`, `resourceType`, `resourceId` and `version` as plain columns, with the comment on line 78 saying so: deleting a record does not erase its change history. A foreign key to `Project` would force the audit rows to be deleted or nulled when the project is, which defeats the purpose. The trade-off is that nothing stops an audit row pointing at an id that no longer exists, so reads must tolerate it.

**D13. What does `identity.parse` inside the repository protect against? [mid]**
It re-validates the organization id against `/^[a-zA-Z0-9_-]{1,64}$/` (`validation.ts:25-27`) at every use, for example at `projectRepository.ts:29`, `:40` and `:109`. The value already passed the same check in the middleware, so this is defence in depth against a future caller that constructs a `TenantContext` by hand. There is a test for that exact scenario, "fails closed when an internal caller omits organization context" (`projectRepository.test.ts:88`).

**D14. Where is tenancy not enforced by the database? [mid]**
Everywhere except the task-to-project relationship. Projects, audit events and list queries rely on the application putting `organizationId` into the `where`. `astraupskill/VERIFICATION.md` states plainly that there is no row-level security policy. So the true answer to "how is tenant isolation guaranteed" is: one composite foreign key plus a convention that every query composes the tenant, held up by the integration suite, for example "scopes single reads and writes even when the user belongs to both tenants" (`projectRepository.test.ts:179`).

## Behavioral

**B1. Tell me about a security problem you fixed. [mid]**
*Situation:* the tenant middleware trusted `x-org-id` and defaulted to `demo-org` when it was absent, while the front end was sending an organization query parameter, so the two halves disagreed about how a tenant was even chosen. *Task:* make the selected organization a verified fact. *Action:* I required an authenticated user id, validated the header, looked up the `OrganizationMember` row on every request, took the role from that row, and made a missing membership and an unknown organization indistinguishable at 403. *Result:* four direct middleware tests now cover the middleware itself (`backend/src/__tests__/tenantContext.test.ts:22-47`), and the HTTP suite adds revocation and cross-tenant cases. The verified run passed 55 checks.

**B2. Describe a decision that put work into the schema instead of the code. [mid]**
The composite foreign key on `Task`. I could have checked "does this project belong to my organization" in the repository, and in fact `createTask` does call `projectIn` first (`projectRepository.ts:192`). But a check in code protects the paths that run it. Carrying `organizationId` on the task and pointing `(projectId, organizationId)` at `Project(id, organizationId)` makes the wrong row impossible to insert at all, which "enforces tenant parent matching in the database itself" (`projectRepository.test.ts:362`) verifies by writing directly. The cost is a duplicated column and a unique index that exists only to be a foreign key target.

**B3. When did you distinguish two errors that looked the same? [mid]**
Conflict versus not-found on update. The first version threw one 409 whenever `updateMany` changed zero rows, which meant a caller from another tenant received "this record changed" for a record they could never see, quietly confirming it existed. Adding the scoped re-read at `projectRepository.ts:115` turned that case into the 404 from `projectIn`, and left 409 to mean only what it says.

**B4. Tell me about a limit you documented rather than hid. [mid]**
Row-level security. Isolation here is a convention enforced by tests, not a database policy, and `astraupskill/VERIFICATION.md` says so. Related: create operations are not idempotent, so a retried `POST /api/projects` after a lost response creates a second project; that is practice task 3 in `astraupskill/05-PRACTICE.md`. I would rather be asked about those than have an interviewer find them.

**B5. How do you keep a user's work when the server refuses it? [mid]**
The conflict message tells them what to do, and the front end supports it: in `frontend/src/features/projects/pages/ProjectsPage.tsx` the loaded project is the baseline while the draft holds form values, and a refused save leaves the draft for export and explicit reconciliation rather than clobbering it with the server's copy. The browser suite exercises draft export and reconciliation, unsaved-transition confirmation, failed writes and failed refreshes, per `astraupskill/VERIFICATION.md`.

## Follow-ups the interviewer asks next

**F1. Why put the organization in a header rather than in the path, like `/api/orgs/:orgId/projects`?**
A path segment is more discoverable and caches better, and it would make the tenant visible in logs without a header. The header was chosen because every route then shares one middleware and no route can forget the parameter, and because `attachTenantContext` is mounted once at `app.ts:60`. The honest counterpoint is that a header is easier to omit from a manual curl and harder to see in a browser network tab, and that the 400 at `tenantContext.ts:20-24` exists precisely because omission must be loud.

**F2. Two organizations, one user, two browser tabs. What stops a mix-up?**
Nothing on the server: each request is judged on its own header and membership. The safety comes from the request being self-describing, plus the front end sending the token and the header together from the same scope object (`frontend/src/api/client.ts:75-81`). The browser suite covers organization switching and token memory. If a tab held a stale organization, the worst outcome is a 403 or a 404, never a write into the wrong tenant, because the repository predicate carries the organization too.

**F3. You read the membership on every request. Would you cache it?**
Only with a TTL I could defend, because the cache lifetime is exactly the revocation delay, and immediate revocation is currently the strongest property of this design (`projectRepository.test.ts:154`). Caching for five seconds is probably fine and removes most of the load; caching for the token lifetime would be the same as putting the role in the token, which is what the old version effectively did.

**F4. What happens if a project id from tenant A is used while tenant B is selected?**
404 "Project not found in this organization." from `projectIn` (`projectRepository.ts:42`), for reads and for the post-failure branch of writes. That is the scenario `astraupskill/03-WORKED-CHANGE.md` asks the reader to run by hand with the Cedar and Maple fixtures, and "scopes single reads and writes even when the user belongs to both tenants" (`projectRepository.test.ts:179`) automates it.

**F5. Is `RepeatableRead` on the lists worth the risk?**
It buys a page whose total cannot contradict its rows, which matters because the UI shows both. It risks a serialization failure that would arrive as a 409 on a GET, which is a confusing status. At this data size it does not happen. At scale I would drop the transaction and accept an approximate total sooner than I would give up keyset pagination.

**F6. First thing you would change for production?**
Row-level security, because it converts every future careless query from a data leak into an error, and because the schema is already shaped for it: every tenant-owned table carries `organizationId`. Second, durable create idempotency, since a retried project or task create today simply creates a second row. Third, a shared login limiter, since the current one is process-local.
