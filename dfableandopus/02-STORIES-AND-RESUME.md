# Stories, resume lines and the spoken summary

## STAR story 1: the tenant boundary that was a comment

**Situation.** The delivered `attachTenantContext` was one assignment: `req.currentOrgId = (req.headers['x-org-id'] as string) || 'demo-org'`, kept as `astraupskill/snapshots/tenantContext-before.ts.txt`. Any caller could name any organization, an omitted header quietly became a shared demo tenant, and the React client was sending an organization query parameter instead of the header, so the two sides did not agree on how tenancy was chosen at all.

**Task.** Make the selected organization a verified fact on every request, without adding a second sign-in step.

**Action.** `backend/src/middleware/tenantContext.ts:12-44` now requires an authenticated `req.userId`, validates `x-org-id` against the shared `identity` regex, and reads the `OrganizationMember` row for that pair. A missing header is 400, an unknown organization and a revoked membership are the same 403, so the response cannot be used to enumerate tenants. The role attached to `req.tenant` comes from that row (line 38), never from the token, and `requireManager` (lines 50-56) reads it. The front end now sends the header alongside the bearer token from one scope object (`frontend/src/api/client.ts:77-81`).

**Result.** Four direct middleware tests cover the middleware itself, including "attaches the membership role, not anything the caller sent" (`backend/src/__tests__/tenantContext.test.ts:47`), and the HTTP suite adds "removes access after membership revocation without trusting old JWT roles" (`backend/src/__tests__/projectRepository.test.ts:154`). The `verified/` evidence run passed 55 checks: 36 backend, 6 frontend, 3 setup and 10 Chromium scenarios.

## STAR story 2: making a cross-tenant task impossible rather than unlikely

**Situation.** A task belongs to a project, and a project belongs to an organization. A repository that forgets one predicate can attach a task to another tenant's project, and no amount of code review guarantees that every future path remembers.

**Task.** Push the rule into the schema.

**Action.** `Task` carries `organizationId` as well as `projectId` and relates through a composite foreign key: `@relation(fields: [projectId, organizationId], references: [id, organizationId])` at `backend/prisma/schema.prisma:66`, which forced the otherwise redundant `@@unique([id, organizationId])` on `Project` at line 54 as its target. In SQL that is `Task_projectId_organizationId_fkey ... ON DELETE RESTRICT` at `backend/prisma/migrations/202609090001_tenant_workspace/migration.sql:113`.

**Result.** "enforces tenant parent matching in the database itself" (`projectRepository.test.ts:362`) writes directly to the table and is refused, and the same constraint gives project deletion its second guarantee, tested by "requires explicit task removal before project deletion" (line 314). The cost, one duplicated column and an index that exists only to be a foreign key target, is the kind of trade I want an interviewer to ask about.

## STAR story 3: one 409 that was hiding a 404

**Situation.** The project update is a conditional `updateMany` matching id, organization and captured version. My first version threw the conflict whenever it changed zero rows.

**Task.** That collapsed two different situations into one answer. A caller from another organization received "This record changed", which both misled them and confirmed that a record they cannot see exists.

**Action.** `backend/src/repositories/projectRepository.ts:114-117` now re-reads through `projectIn` before throwing, so a row outside the caller's organization raises the 404 "Project not found in this organization." from line 42, and 409 is reserved for a genuine stale version. `remove` does the same at lines 136-143 and goes one step further, distinguishing a stale version from a project that still has tasks.

**Result.** "scopes single reads and writes even when the user belongs to both tenants" (`projectRepository.test.ts:179`) and "rejects stale deletion and preserves the current project" (line 300) cover both branches. The user-facing text is unchanged for the case that actually is a conflict, and it tells the user what to do: export the draft, load the current record, retry.

## Resume bullets

- Replaced a tenant middleware that trusted an `x-org-id` header and defaulted to a demo organization with a per-request membership lookup that supplies both the tenant and the caller's role.
- Made unknown organizations and revoked memberships indistinguishable at 403 so responses cannot be used to enumerate tenants, and made revocation effective on the next request rather than at token expiry.
- Enforced tenant integrity in PostgreSQL with a composite foreign key from `(projectId, organizationId)` to `Project(id, organizationId)`, verified by a test that bypasses the repository and writes directly.
- Implemented optimistic concurrency on projects and tasks with conditional `updateMany` and `deleteMany` predicates carrying organization, id and captured version, distinguishing stale versions from cross-tenant lookups.
- Delivered 36 backend tests over a helper-owned PostgreSQL 18 cluster plus 10 Playwright scenarios covering organization switching, conflict recovery and draft export; the verified run passed 55 checks.

## 60-second spoken summary

"It is a small SaaS workspace: organizations, memberships with roles, projects and tasks. Express, Prisma, PostgreSQL, React, Playwright. The part I would show you is how a request decides which tenant it is in. The token proves who you are; a header names the organization; and the server reads your membership row on every single request, so the role comes from the database rather than from the token, and revoking a membership locks you out immediately rather than in thirty minutes. Below that, every repository function takes the organization id explicitly and puts it in the `where` clause, writes are conditional on the version you captured, and if the write matches zero rows the code re-reads before deciding whether that is a conflict or a record you were never allowed to see. Tasks carry their organization id as well as their project id so the database itself rejects a cross-tenant parent. What it does not have is row-level security, so isolation is a convention the tests hold up rather than a policy the database enforces, and creates are not idempotent."

## What I would do next

`astraupskill/05-PRACTICE.md` task 3 is durable create idempotency, and it is the gap I would close first: a retried `POST /api/projects` after a dropped response creates a second project today, because only updates and deletes carry a version. The shape is a client-generated key, a unique index on (organization, actor, key), a stored fingerprint of the validated input, and a replay that returns the original row, all committed in the same transaction as the record and its audit event. Second is task 5, an outbox table so notifications can be added without putting a network call inside `prisma.$transaction`. Third, the thing `astraupskill/VERIFICATION.md` names as absent: a PostgreSQL row-level security policy, which would turn a forgotten `organizationId` predicate from a leak into an error.
