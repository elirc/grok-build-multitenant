# Testing behavior across real boundaries

Run `npm test` from the root after installing dependencies and PostgreSQL binaries. [The helper](../scripts/test-database.mjs) creates a uniquely named temporary cluster on a free loopback port, applies the migration, builds the backend, and runs backend/frontend tests. It supplies an explicit marker and a fixed test database name. The integration suite refuses to clear data without that marker, loopback host, and expected database name.

[Backend integration tests](../backend/src/__tests__/projectRepository.test.ts) exercise real Express requests and PostgreSQL transactions. They cover login, missing or expired tokens, organization selection, membership revocation, role changes, cross-tenant reads and writes, task-parent scoping, concurrency, deletion rules, literal search, pagination, input limits, and repeated seed preservation. These assertions inspect returned values and persisted rows rather than only spying on helper calls.

The audit-failure cases install a PostgreSQL trigger that rejects audit insertion. The tests then attempt create, update, and delete operations and inspect the unchanged entity and audit state. This establishes the transaction boundary in the real database. The competing-writer tests issue two HTTP updates with the same version and require one accepted response and one conflict. A sequential happy-path test would not demonstrate that property.

[Validation tests](../backend/src/__tests__/projectService.test.ts) cover pure input and role policy. They check unknown editable fields, bounded names and descriptions, exact statuses, database-compatible version bounds, query shapes, normalized email, and bcrypt's UTF-8 byte boundary. The non-ASCII password fixture uses a Unicode escape so shell encoding cannot silently change the tested value.

[Frontend tests](../frontend/src/__tests__/ProjectsPage.test.tsx) isolate the API boundary and basic interactions. They verify headers, error parsing, query cancellation, empty results, and visible failure states. [Browser scenarios](../browser-tests/workspace.spec.mjs), run by `npm run verify`, drive the complete React/HTTP/PostgreSQL flow in Chromium. They cover roles, tenant switching, project/task CRUD, two-tab conflicts, draft export, failed saves, failed refreshes, deletion dependencies, literal rendering, and responsive layouts.

When debugging, locate the first violated boundary. A 403 suggests identity, membership, or role; a 404 may reflect a correctly scoped lookup; a 409 suggests stale intent or a referenced project. A 503 should leave input available. Compare the mutation response with the subsequent list response before deciding whether a save failed. Request IDs help identify operations without logging passwords or application payloads.

Write a regression note with the smallest reproduction, violated invariant, responsible layer, and evidence. The test should fail if the guarantee disappears while tolerating harmless refactoring. Do not replace a real database concurrency test with a mock merely to make it faster; choose tests according to the behavior they must establish.

## Start here: the smallest test that holds the whole lesson

`backend/src/__tests__/tenantContext.test.ts` (added in the fix pass) drives `attachTenantContext` directly with a fake Prisma client. Four cases: no `x-org-id` header is a 400 before any query; an organization the user is not a member of is a 403 and `prisma.project.*` is never called; a revoked membership (no row) behaves exactly like an unknown one; and the role attached to the request comes from the membership row, ignoring any `x-role` the caller sends. Run it with:

```powershell
cd backend
npx vitest run src/__tests__/tenantContext.test.ts
```

Everything else in this chapter is the same idea at a larger boundary.

## Break it: turn the premise into a measurement

The starter's middleware is in `astraupskill/snapshots/tenantContext-before.ts.txt`: it set `req.currentOrgId` from the header or fell back to `"demo-org"`. Pasting it back will not compile against today's services, which read `req.tenant`, and the helper runs `tsc` before any test. Reproduce its *behavior* instead: in `backend/src/middleware/tenantContext.ts`, replace the membership lookup and its 403 (lines 25-34) with a fake membership, so line 35 becomes

```ts
req.tenant = { userId: req.userId, organizationId: parsed.data, role: "OWNER" };
```

Run `npm run test:api` from the repository root (running `npx vitest run` inside `backend/` would also start the integration file, whose fixture guard refuses any database the helper did not create). Before running, predict which tests turn red. Candidates worth examining: "requires an explicit organization header and verified membership" (`projectRepository.test.ts:142`; its 400 half still passes, its 403 half should not), "removes access after membership revocation" (`:154`), "reads changed roles from membership for every request" (`:246`), "forbids member project mutations" (`:204`), and the `tenantContext.test.ts` cases at lines 29, 37, and 47 (only the no-header case at line 22 survives). Write your predicted list, then the actual list, and restore with `git checkout -- backend/src/middleware/tenantContext.ts`. The difference between the lists is the part of the lesson you had not yet internalized.
