# Tenant Workspace: a course in trustworthy CRUD boundaries

This project is small enough to follow from a React input to a PostgreSQL transaction, but rich enough to teach real mid-level decisions. The original starter trusted an arbitrary tenant header, supplied only project create/list operations, and included tests that checked method calls rather than isolation. The improvement makes organization membership verifiable and adds project/task CRUD, roles, version conflicts, audit transactions, runnable setup, and realistic failure tests.

Your goal is to explain why a request is allowed, which rows it can affect, and what happens when it fails. A polished page is useful, but a trustworthy CRUD feature must also preserve data across competing edits, reject cross-organization access, and keep the user's draft when a save is rejected.

## Prerequisites and glossary

**Prerequisites:** React state and forms; HTTP headers and status codes; enough Prisma to read a `where` clause and a transaction; the habit of checking the row, not the screen. The `buildjira` course here is a natural predecessor.

| term | meaning | where in this project |
| --- | --- | --- |
| tenant context | the verified user, organization and role attached before any handler runs | `TenantContext` and `attachTenantContext` in `backend/src/middleware/tenantContext.ts` |
| organization selection header | the client's choice of organization: a claim, never an authorization | the `x-org-id` header, set in `frontend/src/api/client.ts` |
| verified membership | the lookup turning that claim into a trusted role, or a 403 | the `organizationMember.findUnique` call in `tenantContext.ts` |
| role gate | the second check: membership alone cannot edit a project | `requireManager` in `backend/src/middleware/tenantContext.ts` |
| tenant scope | the organization id in every query predicate, so foreign rows never match | `findByOrganizationId` in `backend/src/repositories/projectRepository.ts` |
| version | the integer naming which revision the editor was based on | `version Int @default(1)` on `model Project` in `backend/prisma/schema.prisma` |
| conditional write | an update carrying the expected version, so a stale edit changes zero rows | the `updateMany` inside `update` in `projectRepository.ts` |
| conflict | the error when that write matched no row, surfaced as 409 | `conflict()` in `backend/src/repositories/projectRepository.ts` |
| audit event | who changed what, written in the same transaction as the change | `audit()` writing `model AuditEvent` in `projectRepository.ts` |
| composite foreign key | a project reference carrying the organization id, so tasks cannot cross tenants | the `Task` relation on `[projectId, organizationId]` in `schema.prisma` |
| retained draft | a rejected save leaves the editor's text intact and exportable | `exportDraft` in `frontend/src/features/projects/pages/ProjectsPage.tsx` |
| identity validator | the shape check every id passes before reaching SQL | `identity` in `backend/src/lib/validation.ts` |

## Work through the project in this order

1. Follow [the root setup](../README.md) using a dedicated local database. Sign in as each fictional account and compare its available organizations and roles. Create one project and two tasks with specific outcomes.
2. Read [the codebase map](01-CODEBASE-MAP.md). Trace a request from the browser API client through authentication, membership lookup, service validation, repository transaction, and response handling.
3. Study [the concepts](02-CONCEPTS.md), then predict the outcome of a forged tenant selection and a stale update before trying them.
4. Reconstruct [the worked change](03-WORKED-CHANGE.md). Explain why adding an organization ID to a query is necessary but insufficient without verifying membership.
5. Run [the test and debugging exercises](04-TESTING-AND-DEBUGGING.md). Identify which assertions observe real database state and which isolate browser behavior with controlled responses.
6. Implement [the practice tasks](05-PRACTICE.md), review [solution reasoning](06-SOLUTIONS-AND-REVIEW.md), and complete [the trace lab](07-TRACE-LAB.md).

Use a journal containing observation, hypothesis, experiment, and result. For example, observe that the owner account belongs to both organizations but has a different role in each. Predict whether switching the header alone permits editing a project from the other organization. Test the prediction using the documented local fixtures. Record the status code and unchanged database value, not just whether a button is visible.

A useful first deliverable is a one-page explanation of project editing. Include the captured version, selected organization, verified membership, conditional update, audit insert, and retained draft after a conflict. Then explain task deletion and why deleting a project with tasks requires explicit cleanup.

The course moves from junior familiarity with forms and endpoints toward mid-level reasoning about contracts, transactions, authorization, compatibility, and partial failure. Your final patch should include a meaningful regression test and a clear account of its limits. Consult [verification](VERIFICATION.md) to distinguish measured behavior from future practice features. The local demonstration accounts and setup are intentionally visible learning tools; they do not constitute a complete production identity platform.


## Extended course

[Continue with the extended upskilling course](extended-course/README.md).
