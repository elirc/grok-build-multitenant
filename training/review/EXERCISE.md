# Blind review: Tenant Workspace (hardened tree)

**Time box:** 60 min · **Sealed answer:** `training/_answers/review.md` · **Compare with:** `COMPARE.md`

Review the application as it is in the working tree (equivalently, branch `training/base/working-tree-snapshot`). Treat it
as a PR titled *"Replace starter with production-ready multi-tenant workspace"* that you must approve or block.

Scope (read these, in roughly this order):

- `backend/prisma/schema.prisma`, `backend/prisma/migrations/202609090001_tenant_workspace/migration.sql`
- `backend/src/app.ts`, `backend/src/middleware/{auth,tenantContext}.ts`, `backend/src/lib/{errors,validation}.ts`
- `backend/src/repositories/projectRepository.ts`, `backend/src/services/projectService.ts`, `backend/src/routes/projectRoutes.ts`,
  `backend/src/controllers/projectController.ts`
- `backend/src/__tests__/*.ts`, `scripts/test-database.mjs`, `docker-compose.yml`, `backend/.env.example`
- skim `frontend/src/api/client.ts`

Rules:

- Write findings in `training/review/my-findings.md` as **severity · file:line · what goes wrong in production · fix**.
- Aim for 12 or more. At least 4 must be about **how tenant isolation is enforced**: which layer enforces it, which layer
  only *assumes* it, and what a future change could slip past.
- For each tenant finding, say which layer should own the guarantee: app, ORM or DB.
- Mark any finding you think is a typical AI-generated-code smell.
- Don't run the app for the first 45 minutes. Reading comes first. Use the last 15 minutes to confirm or kill your top 3
  with `npm test` or `EXPLAIN`.

Hard questions to have an answer for:

1. Write down every table where PostgreSQL itself would refuse a row that claims the wrong tenant, and every table where it would not.
2. What does the client see when a foreign-key violation happens? Is that the right message? Who gets told?
3. The login limiter is a `Map`. Describe two inputs that make it lock out someone who never mistyped a password.
4. Is there any test in this repo that cannot fail?
