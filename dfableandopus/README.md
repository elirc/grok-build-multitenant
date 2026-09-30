# Tenant workspace: interview pack

`astraupskill/` explains how this application works. This folder is the hiring-side companion: the questions a panel asks about a SaaS application where every row belongs to an organization, and the answers that are true of this code.

The workspace is Express with TypeScript, Zod and Prisma 6 over PostgreSQL 18, a React 18 and Vite front end, and a Playwright suite. The domain is organizations, users joined to them through `OrganizationMember` with a role of OWNER, ADMIN or MEMBER, projects owned by an organization, and tasks owned by a project. The subject to interview about is tenancy: how the server decides which organization you are acting in, and why that decision cannot come from the request body.

## The pitch

"I turned a demo tenant header into a real boundary. The delivered middleware read `x-org-id` off the request and fell back to the string `demo-org`, and the front end was sending an organization query parameter instead, so the two sides did not even agree on how tenancy was selected. Now the token identifies the user, the header selects the organization, and the server looks up the membership row on every request; no membership, no request. The role comes from that row rather than from anything the caller sent. Below that, every query carries `organizationId` in its `where`, writes are conditional on a captured version, and the database itself refuses a cross-tenant task through a composite foreign key from `(projectId, organizationId)` to `Project(id, organizationId)`. Verification passed 55 checks."

## Target stacks

Aimed at Node and TypeScript roles, and at any interview that mentions SaaS, tenancy or row-level security. For a .NET panel, the membership lookup is the same shape as a claims-transformation or an authorization handler backed by a query, the conditional `updateMany` becomes `ExecuteUpdateAsync` or a concurrency token, and the composite foreign key is written by hand in a migration in either framework.

## Two-week plan

- Days 1 to 3: [01-INTERVIEW-QUESTIONS.md](01-INTERVIEW-QUESTIONS.md) with `backend/src/middleware/tenantContext.ts` and `backend/src/repositories/projectRepository.ts` open.
- Days 4 and 5: [02-STORIES-AND-RESUME.md](02-STORIES-AND-RESUME.md); the numbers come from `astraupskill/VERIFICATION.md` and the `verified/` evidence run.
- Days 6 to 8: [03-CODE-READING-DRILL.md](03-CODE-READING-DRILL.md) on a clock.
- Days 9 to 11: [04-TAKE-HOME.md](04-TAKE-HOME.md).
- Days 12 and 13: [05-SYSTEM-DESIGN-FOLLOWUPS.md](05-SYSTEM-DESIGN-FOLLOWUPS.md).
- Daily: [06-FLASHCARDS.md](06-FLASHCARDS.md).

## Limits worth naming first

From `astraupskill/VERIFICATION.md`: there is no PostgreSQL row-level security policy, so isolation depends on every query composing `organizationId` rather than on the database refusing a careless one; tokens last thirty minutes with no refresh and no server-side revocation, mitigated by checking membership on each request; login throttling is process-local; there is no invitation UI, no MFA and no durable create idempotency; and task audit events are stored but have no UI. Saying these before you are asked is the difference between sounding like an author and sounding like a demo.
