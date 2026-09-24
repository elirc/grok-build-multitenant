# SEALED — model review of the hardened Tenant Workspace

Line numbers are for the working tree as snapshotted on `training/base/working-tree-snapshot` (commit `06d0205`).
"AI smell" marks patterns typical of generated code.

Overall: this is a **good** rewrite. It uses real Postgres integration tests, optimistic concurrency, audit records written in the
same transaction, and a membership-derived tenant. Its weaknesses are the ones a senior cares about next: isolation is a
*convention* the next engineer can break, logging leaves on-call blind, and a few mechanisms look safer than they are.

## High

**H1. Tenant isolation lives in the app code only, and nothing stops the next query from skipping it.**
Every repository function repeats `organizationId: identity.parse(org)` (`backend/src/repositories/projectRepository.ts:38-51, 60-61, 158`).
There is no scoped client, no Prisma extension and no RLS (`migration.sql` has no `POLICY`, and `README.md` says so). A new
`$queryRaw`, a new repository or a script run with the shared `prisma` has no guard. *Production:* one forgotten `where`
becomes a cross-tenant read with no error. → INC-002. *Owner:* app (structural sub-router or scoped repo) **and** DB (RLS backstop).

**H2. The app would bypass RLS even if RLS were added.** `docker-compose.yml` makes `tenant_dev` the `POSTGRES_USER`
(a superuser), and `backend/.env.example` connects the app as that same role. Superusers ignore every policy, even with
`FORCE`. The same role runs migrations and serves traffic. *Fix:* separate owner and runtime roles before RLS is worth anything.

**H3. Only one relation is tenant-safe in the DB.** `Task → Project` uses the compound FK
(`schema.prisma:66`, `migration.sql` `Task_projectId_organizationId_fkey`), which is excellent. But the pattern isn't
documented as a rule, and nothing checks new relations against it. → INC-001. `AuditEvent` (`schema.prisma:69-79`) has **no FK at all**,
so `organizationId` is a free string. The comment justifies dropping the *resource* FK (history survives deletes), but not
dropping `organizationId → Organization`, which is never deleted (`onDelete: Restrict`) and is safe to constrain.

**H4. The login limiter locks out innocent users** (`backend/src/middleware/auth.ts:77-98`).
(a) Once 1,000 distinct IPs have entries, **every new IP** gets 429 for up to 15 minutes, which is a cheap global lockout.
(b) `entry.count++` runs before the password check and never resets on success, so 20 *successful* logins also lock an IP.
(c) There's no `app.set("trust proxy")`. Behind a load balancer `req.ip` is the LB, so all users share one bucket.
(d) The limiter is process-local (acknowledged in `VERIFICATION.md`). *Fix:* key on (IP, email), reset on success, use a
shared store, and configure the proxy hops.

## Medium

**M1. 5xx logs throw away the cause** (`backend/src/lib/errors.ts:61-67`). Only `{requestId, status, event}` is logged, with
no error name, Prisma code or stack. A production 500 can't be diagnosed. *AI smell (over-corrected redaction).* Log the error
class and code server-side, and keep the client message generic.

**M2. Security-relevant 4xx are invisible.** 403 "not a member" (`tenantContext.ts:33-34`) isn't logged or counted. Tenant
probing (INC-002's log) produces no signal. Add a structured `membership_denied` event and alert on bursts.

**M3. FK violations masquerade as edit conflicts** (`errors.ts:38-41`). P2003 → 409 "The record changed or is still
referenced". A cross-tenant write rejected by the compound FK looks to the user like a stale edit, and isn't logged.
Fail-closed is right, but split the message and log P2003 as a possible integrity or security event.

**M4. The membership check runs outside the write transaction** (`tenantContext.ts:25-32` vs the repo's `$transaction`).
A role revoked between check and write still succeeds. This is acknowledged in `VERIFICATION.md`. Concurrency is saturated
elsewhere, so just know the mechanism.

**M5. Deep offset pagination plus `count(*)`** (`validation.ts` listInput allows page ≤ 10,000; `projectRepository.ts:74-85`).
Page 10,000 is `OFFSET 199980` plus a full `count` inside a RepeatableRead transaction. Both grow with tenant size.
The noisy-neighbour risk is that one big tenant's list calls eat shared DB time. See curriculum 10 (keyset pagination).

**M6. `contains` + `mode: "insensitive"` is `ILIKE '%q%'`** (`projectRepository.ts:64-66, 162`) with no `pg_trgm` index,
so every search is a sequential scan of the tenant's rows. The escaping is correct (`literal()`, line 17); the cost is the problem.

**M7. The sort order doesn't match the index.** `ordered = createdAt desc, id asc` (`projectRepository.ts:15`) vs
`@@index([organizationId, createdAt, id])`, which is all ascending. Mixed directions can't be served by one index scan, so
Postgres needs an (incremental) sort. Verify with `EXPLAIN`, then use `id desc` or a matching DESC index.

**M8. There's no create idempotency** (acknowledged in `README.md`). A retried POST after a timeout duplicates a project. Idempotency is a saturated skill; just name it.

**M9. The dev DB and the tested DB are different versions.** `docker-compose.yml` uses `postgres:16`, while the test harness
and `VERIFICATION.md` use PostgreSQL 18. `VERIFICATION.md` admits Docker was never exercised. Features such as
`ON DELETE SET NULL (col)` (PG15+) happen to work on both, but that is luck, not policy.

## Low / tests / maintainability

**L1. Tests that can't fail** (`backend/src/__tests__/tenantContext.test.ts:6, 27, 35`): they mock `prisma.project.*` and
assert `project.findMany` was not called, but `attachTenantContext` never touches `project`. *AI smell.* This is the same
tautology the rewrite deleted from the starter's `projectRepository.test.ts`.

**L2. The controller layer is vestigial.** `projectController.ts` handles 2 of 11 routes, and the rest call the service from
`projectRoutes.ts` directly. *AI smell (kept scaffold).* Pick one layering.

**L3. Tenant tests live in one 546-line file** (`projectRepository.test.ts`) that mixes auth, HTTP limits, seeds and
isolation. There's no dedicated "hostile tenant" matrix (every route × non-member org), and that matrix is what would have caught INC-002.

**L4. The docs cite evidence that isn't there.** `astraupskill/VERIFICATION.md` names the run folders `first` and `second`,
but `astraupskill/evidence/` contains only `browser-first`, `final`, `verified`, `frontend-fixed.json` and `results.json`. *AI smell (mild).*

**L5. `history()` isn't existence-checked** (`projectRepository.ts:252-262`). `/api/projects/<any>/audit` returns 200 `[]`.
Retaining history after deletion is intentional, but it's fine only because the query is tenant-scoped. Note the coupling.

**L6. No membership management API.** Revocation is tested only by deleting rows directly (`projectRepository.test.ts`,
"removes access after membership revocation"). The revoke path, and what it does to assigned work, is unspecified.

## Things done well (say these in a review too)

- A tenant derived from a membership row on every request, and the role read fresh, not from the JWT (`tenantContext.ts`).
- Compound FK `Task(projectId, organizationId) → Project(id, organizationId)`, with a test that writes directly to prove it (`projectRepository.test.ts` "enforces tenant parent matching in the database itself").
- Version-guarded `updateMany`/`deleteMany` with audit in the same transaction, and rollback tested with an injected trigger (`failingAudit`).
- A test harness that refuses any database except its own temporary cluster (`scripts/test-database.mjs`, `beforeAll` guard).
