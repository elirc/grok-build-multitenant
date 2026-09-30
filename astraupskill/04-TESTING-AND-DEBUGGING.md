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

Open `backend/src/middleware/tenantContext.ts` and replace the membership lookup with the delivered fallback from `astraupskill/snapshots/tenantContext-before.ts.txt`:

```ts
req.currentOrgId = (req.headers["x-org-id"] as string) || "demo-org";
```

(plus the matching `req.currentOrgId || 'demo-org'` reads in `projectController-before.ts.txt`). Rerun `npx vitest run`. Predict first which of the 24 integration tests turn red: every cross-tenant read test (a forged header now *selects* a tenant instead of being checked) and every "no header" test (the fallback silently picks `demo-org`). Write the actual count in your notes, then restore the file. The difference between your prediction and the count is the part of the lesson you had not yet internalized.

