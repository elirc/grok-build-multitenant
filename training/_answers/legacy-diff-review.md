# SEALED — legacy-rescue review: Grok starter (`41a9785`) vs hardened rewrite

**Warm-up answer:** `git diff --stat HEAD` shows only **tracked** files. The rewrite's most important files are **untracked**:
`backend/src/app.ts`, `middleware/auth.ts`, `lib/errors.ts`, `lib/validation.ts`, `seed.ts`, the whole `prisma/migrations/`,
`tenantContext.test.ts` and `scripts/test-database.mjs`. A reviewer who trusts `git diff` misses authentication entirely.
`git status` shows them as `??`, and the snapshot branch diff includes them. The general lesson: *review what will be
deployed, not what the diff tool happens to show.*

## 1. Fixed (starter defect → mechanism → proof)

| # | Starter (`41a9785`) | Defect | Rewrite mechanism | Proven by |
|---|---|---|---|---|
| 1 | `middleware/tenantContext.ts` | `req.currentOrgId = req.headers['x-org-id'] \|\| 'demo-org'`: the tenant is whatever the caller says, with a silent default tenant | Parse the header, then `organizationMember.findUnique({userId_organizationId})`, then 400/403. The role comes from the row | `projectRepository.test.ts` "requires an explicit organization header and verified membership", `tenantContext.test.ts` |
| 2 | `index.ts` | **No authentication at all.** `jsonwebtoken` was in `package.json` but never imported | `middleware/auth.ts`: HS256 with pinned `algorithms`, `iss`/`aud`/`exp` 30m, bcrypt, dummy-hash compare for missing users (timing) | "rejects missing, wrong, and expired authentication", "returns the same rejection for missing user and bad password" |
| 3 | `index.ts` | `app.use(attachTenantContext)` was global, ran before `/health` and routing, and had no auth ordering | `app.ts`: `authenticate` on `/api`, then `attachTenantContext` only on `/api/projects` | route tests |
| 4 | `frontend/src/api/client.ts` + `ProjectsPage.tsx` | **Contract mismatch.** The client sent `?orgId=` as a query param, the server read the `x-org-id` header, the client hard-coded `'org_demo_001'` and the server defaulted to `'demo-org'`. The two halves never agreed on a tenant; every request fell back to `demo-org` | `request()` sends `Authorization` + `x-org-id` from a `Scope` built from the user's memberships | `ProjectsPage.test.tsx` (request headers), `browser-tests/workspace.spec.mjs` |
| 5 | `repositories/projectRepository.ts` | `const prisma = new PrismaClient()`: a second pool beside `lib/prisma.ts` | a shared singleton | — (review) |
| 6 | `schema.prisma` `Task` | No `organizationId`; FK to `Project(id)` only, so a task could hang under any tenant's project | `organizationId` + compound FK `(projectId, organizationId) → Project(id, organizationId)` + `@@unique([id, organizationId])` | "enforces tenant parent matching in the database itself" |
| 7 | `schema.prisma` | `status String @default("TODO")`, free text; no lengths | `TaskStatus` enum, `VarChar` limits, CHECKs (`Project_name_nonblank`, `User_email_canonical`, `*_version_positive`) | validation tests + migration |
| 8 | `controllers/projectController.ts` | `const { name } = req.body` went straight to `create`: no validation, and mass-assignment-shaped | zod `.strict()` schemas reject `organizationId`/`id`/`version` in bodies | "rejects client-controlled tenant and identity fields" |
| 9 | no `prisma/migrations/` | The schema could only be `db push`ed; there was no reviewable DDL | a committed migration + `migration_lock.toml` | `scripts/test-database.mjs` runs `migrate deploy` |
| 10 | `index.ts` / controllers | `async` handlers with no error path. Express 4 doesn't catch rejected promises, so requests hang and unhandled rejections pile up | `asyncRoute` + `errorHandler` mapping Zod, Prisma and body-parser errors | "rejects unknown fields malformed bodies…" |
| 11 | `docker-compose.yml` | `postgres/postgres` on `0.0.0.0:5432` | a required env password, bound to `127.0.0.1:5437`, with a healthcheck | `setup-local.test.mjs` |
| 12 | whole API | No update/delete, no concurrency control, no pagination, no audit | version-guarded `updateMany`/`deleteMany`, audit in the same transaction, bounded pages, literal search | concurrency + `failingAudit` tests |
| 13 | `__tests__/projectRepository.test.ts` | Mocked `PrismaClient`, then `spyOn(repo,'findByOrganizationId')`, called it, and asserted it was called. **Cannot fail** | a real-Postgres integration suite in a temporary cluster, guarded against touching other DBs | the suite itself |
| 14 | `__tests__/projectService.test.ts` | Mocked the repo and asserted the arg that the test itself passed. Tautological | pure validation/policy unit tests | — |
| 15 | `frontend/src/__tests__/ProjectsPage.test.tsx` | Rendered a `useQuery` component **without `QueryClientProvider`** (it throws), with no test runner in `frontend/package.json`, and asserted marketing copy ("strictly isolated") | vitest + RTL setup; tests assert headers, cancellation and errors | `frontend` suite |
| 16 | `package.json` | `^5.15.0` caret ranges, no test scripts | Prisma pinned to `6.19.2`, `test`/`typecheck` scripts, a root workspace + lockfile | — |

## 2. Claims vs reality in the starter

- `schema.prisma:2` "Educational focus: strict tenant isolation": `Task` had no tenant column and nothing was constrained.
- `repositories/projectRepository.ts` header "Data access must always be tenant-scoped": the value it scoped by came from an unauthenticated header.
- `controllers/projectController.ts` "Use context from middleware - this is the correct way in multi-tenant", then `|| 'demo-org'`.
- `tenantContext.ts` "This is one of the most critical pieces for SaaS security": it trusted the header.
- `ProjectsPage.tsx` UI copy: "Data is strictly isolated by organization."
- `README.md` (HEAD) lists "JWT authentication with tenant context", "React Hook Form + Zod", "React Router": **none of these existed**.
- The test files' doc comments ("Tests should verify that queries are properly scoped by organization") sat above tests that verify nothing.

Pattern: **the comments describe the design the model knew it should build; the code is the placeholder.** When you
review AI output, read the code first and treat comments as claims to check.

## 3. Missed (ranked by production risk)

1. **No DB-level isolation for reads.** No RLS, and the app connects as a superuser owner. *Acknowledged* (README, VERIFICATION).
2. **Isolation is a per-query convention**, with no structural guard (tenant sub-router, scoped client) for new routes or raw SQL. *Silent.* (INC-002 is exactly this.)
3. **The compound-FK rule isn't generalized or enforced**, and `AuditEvent` has no FKs at all. *Partly acknowledged* (comment on audit retention); the rule itself is silent. (INC-001.)
4. **The login limiter** allows a global lockout after 1,000 IPs, counts successes, and isn't proxy-aware. *Acknowledged* only as "process-local"; the lockout mechanics are silent.
5. **5xx logs drop the cause, and 403 membership denials aren't logged.** *Silent.*
6. **Membership is checked outside the write transaction.** *Acknowledged* ("does not claim atomic revocation").
7. **No create idempotency.** *Acknowledged.*
8. **Offset pagination to page 10,000 and unindexed ILIKE.** *Silent.*
9. **PG 16 in Compose vs PG 18 in tests.** *Partly acknowledged* (Docker not exercised).

## 4. Regression of habit

`backend/src/__tests__/tenantContext.test.ts` mocks `prisma.project.{findMany,…}` and asserts `project.findMany` was not
called by a middleware that never references `project`. It is the same "assert something that can't happen" tautology the
rewrite removed from the starter's tests (#13, #14). Also: the new report router in INC-002 re-reads `x-org-id` directly,
which is the starter's core defect returning, because the fix was placed at a mount point rather than made structural.

## 5. Verdict

**No** for a paying tenant yet. Require first:
(1) a separate non-superuser runtime DB role + RLS on `Project`/`Task`/`AuditEvent` with transaction-local `set_config`;
(2) the tenant middleware mounted once on a tenant sub-router + a "every route × non-member org → 403" test matrix;
(3) diagnosable logging (error class and Prisma code on 5xx, and `membership_denied` events with an alert).
The limiter fix is a close fourth.
