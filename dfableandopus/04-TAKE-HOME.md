# Take-home: membership administration

Time box: 3 to 4 hours in this repository. Add a migration; do not rewrite the applied one.

## Background given to the candidate

Membership is read on every request but can never be changed through the API. `backend/src/middleware/tenantContext.ts:25-34` looks up the `OrganizationMember` row and refuses the request if it is missing, and `requireManager` (lines 50-56) lets OWNER and ADMIN change projects while MEMBER is limited to tasks. There is no route that creates, promotes or removes a membership; `backend/src/app.ts` mounts only `/api/auth`, `/api/me` and `/api/projects`. `astraupskill/VERIFICATION.md` lists "no account invitation UI" among the limits.

## The assignment

Add membership administration for the currently selected organization.

1. `GET /api/members` lists the memberships of the selected organization with user name, email and role, paginated like the other lists.
2. `POST /api/members` invites by email. If a `User` with that email exists, create the membership directly; otherwise create a pending invitation that becomes a membership when that email first signs up. Choose and document one representation.
3. `PATCH /api/members/:userId` changes a role, carrying the captured version of whatever you decide to version.
4. `DELETE /api/members/:userId` removes a membership.
5. Only OWNER may grant or revoke OWNER. ADMIN may manage MEMBER. Nobody may change their own role or remove themselves.
6. The organization must never be left with zero owners, including under two concurrent removals.
7. Every accepted change writes an `AuditEvent` in the same transaction, with `resourceType` of your choosing and the actor from the tenant context.

## Acceptance criteria

- A new migration directory beside `202609090001_tenant_workspace`, additive. `OrganizationMember` has no `version` column today, so adding optimistic concurrency means adding one with a default that keeps existing rows valid, plus a `CHECK (version > 0)` in the style of `migration.sql:117-118`.
- Zod schemas in `backend/src/lib/validation.ts` following the house style: `.strict()` objects, the shared `version` bound from line 19, emails normalized like `loginInput` at lines 51-62, and no client-supplied `organizationId` or `actorId`.
- Every query composes the organization from `requireTenant(req)`, never from the body or the path, exactly as the project repository does at `backend/src/repositories/projectRepository.ts:60` and `:109`. A membership belonging to another organization must be a 404 in the shape of "Project not found in this organization." (`projectRepository.ts:42`), not a 403.
- Requirement 6 must be true under concurrency, not just under sequential calls. State in `NOTES.md` which mechanism you chose: a conditional write whose predicate counts remaining owners, a `SELECT ... FOR UPDATE` on the organization row, or a `pg_advisory_xact_lock` keyed by organization id. All three are defensible; a `count()` followed by a `delete()` in the same function is not.
- Routes mounted in `backend/src/app.ts` behind `attachTenantContext` the way `/api/projects` is at line 60, with the same non-GET guard as `backend/src/routes/projectRoutes.ts:8-16`.

## What to submit

- Branch or patch with source, the new migration directory, and tests.
- `NOTES.md` of one page: your invitation representation and why, your concurrency mechanism for requirement 6, what you left out, and the race you are least sure about.
- Pasted test output.

## Tests and commands

Contract and policy cases belong in `backend/src/__tests__/projectService.test.ts`, which runs without a database; middleware-shaped cases belong in `backend/src/__tests__/tenantContext.test.ts`; HTTP and concurrency cases belong in `backend/src/__tests__/projectRepository.test.ts`, which needs the fixture.

```
npm run db:generate
npm test              # node scripts/test-database.mjs backend
npm run typecheck
npm run verify        # adds builds and the Chromium suite
```

`scripts/test-database.mjs` starts its own PostgreSQL 18 cluster on loopback against a marked test database and shuts it down afterwards; it will not touch a configured application database.

Minimum tests: a schema case that a client-supplied organization or actor is rejected, in the shape of "rejects client-controlled tenant and identity fields" (`projectService.test.ts:23`); an ADMIN refused when promoting to OWNER; a self-demotion refused; a cross-tenant `userId` returning 404; two concurrent owner removals where exactly one succeeds, modelled on "accepts one of two concurrent project updates" (`projectRepository.test.ts:281`); and an audit-failure case proving rollback, in the shape of "rolls back project create update and delete when audit fails" (line 383).

## Grading rubric

| Criterion | Strong | Weak |
|---|---|---|
| Tenant scoping | Organization taken only from `requireTenant`, present in every `where`, cross-tenant target is a 404 | `organizationId` accepted in the body or trusted from the path |
| Privilege rules | A single policy function covering who may grant what, called from the service like `requireManager`, with self-modification refused first | Role comparisons scattered through the route handlers |
| Last-owner invariant | Enforced by a database-decided predicate or an explicit lock, with a two-writer test | `count()` then `delete()`, or a comment saying it is unlikely |
| Validation | `.strict()` schemas, normalized email, bounded version, rejection asserted by a named test | Hand-rolled checks, unknown keys ignored |
| Migration safety | New additive directory, default for `version` on existing rows, `CHECK` constraints written out | Edits the applied migration, or needs a reset |
| Audit and atomicity | Audit insert takes `tx` and is proved by a rollback test | Audit written after commit, or only on some paths |
| Communication | `NOTES.md` states the invitation representation and its failure modes | Notes restate the requirements |

## Reviewer's notes

I read `NOTES.md` first and look for requirement 6. The interesting sentence is which mechanism was chosen and why, because all three are correct and they have different costs: a counting predicate keeps everything in one statement but is hard to read, a row lock is obvious but serializes unrelated membership edits in the same organization, and an advisory lock keyed by organization is cheap but invisible to anyone who does not know to look for it. A candidate who names the cost of their choice is doing the job.

Second, I try the cross-tenant case by hand: a valid `userId` from another organization with my own `x-org-id`. I want 404 and I want it to come from a scoped read, not from a role check, because a 403 there would confirm that the user exists somewhere.

Third, the migration. `OrganizationMember` currently has no version column, so this is the one part of the assignment that forces a real schema decision. Adding `version Int @default(1)` is fine; deciding that role changes do not need optimistic concurrency and explaining why is also fine, provided requirement 6 is still enforced. Editing `202609090001_tenant_workspace/migration.sql` is not.

Fourth, the invitation. Both representations are acceptable, but I will ask what happens when the same email is invited twice. A unique constraint that makes the double invite a database-level conflict beats a code-level check.

No UI is expected. I do expect an honest sentence about what is not covered: there is no email delivery here, so an invitation is a row and nothing more.
