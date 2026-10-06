> Historical starter notes. The implemented behavior, setup, and current learning path are documented in [README.md](README.md) and [astraupskill](astraupskill/README.md). Planned features below are not completion claims.

# PHASE PLANS - grokbuildmultitenantproject

This document provides a phased roadmap for building and extending this Multi-Tenant SaaS starter.

The focus is on concepts that matter at mid-to-senior level: tenant isolation, clean architecture, scalable APIs, proper authorization, and testing.

## Current State (Foundation)

- Project structure created (backend + frontend)
- Basic README, JOURNAL, and this PHASE_PLANS
- Prisma schema with Organizations, Users, Projects, Tasks (with proper foreign keys for isolation)
- Layered backend architecture started
- React frontend skeleton with TanStack Query
- Heavy comments for learning

**Goal of current state**: Understand the skeleton and multi-tenancy mindset.

> **Status (2026-10-06, verified against code):** Superseded by the implemented application described in README.md.

---

## Phase 1: Authentication + Tenant Context

### Goals
- User registration and login (JWT)
- Users belong to one or more Organizations
- Every request resolves the current Organization context
- Middleware attaches current user + organization to the request

### Implementation Steps

**Backend**
1. Add Organization model + membership (UserOrganization join table with role)
2. JWT payload includes userId + optional activeOrganizationId
3. Create `authMiddleware` that:
   - Verifies JWT
   - Loads user's organizations
   - Attaches `req.user` and `req.currentOrganization`
4. Update all services to accept and enforce organizationId

**Frontend**
1. Login/Register pages
2. Store JWT
3. After login, allow user to select "active organization" (if in multiple)
4. Include organization context in API calls (or via headers)

**Learning Focus**
- Tenant context propagation
- Never trust client for tenant scoping
- How auth affects almost every layer

> **Status (2026-10-06):** Shipped with a different design. Membership is the `OrganizationMember` model with a role. The JWT carries only the user id (`backend/src/middleware/auth.ts:19-27`); the organization is chosen per request by the `x-org-id` header and verified against a membership row on every request (`middleware/tenantContext.ts:12-44`), so there is no `activeOrganizationId` in the token. Only login exists (`auth.ts:79`); there is no registration route or page. The frontend keeps the token in memory, not storage.

---

## Phase 2: Core Multi-Tenant CRUD

### Goals
- Projects and Tasks strictly scoped to current organization
- List, create, update, delete only within the user's current tenant
- Basic RBAC inside the organization (Owner, Admin, Member)

### Implementation Steps

**Backend**
- Add organizationId to Project and Task models
- In every repository method: always filter by organizationId
- In services: verify user has access to the organization before acting
- Add role checks for sensitive actions (e.g., only Admin can delete Project)

**Frontend**
- Organization switcher in header
- All data fetching must pass current org context
- Hide or disable actions based on role
- Use TanStack Query with query keys that include organizationId

**Key Pattern**
```ts
// Bad (leaks data)
const projects = await prisma.project.findMany();

// Good (tenant isolated)
const projects = await prisma.project.findMany({
  where: { organizationId: currentOrgId }
});
```

> **Status (2026-10-06):** Shipped. Every repository query carries the organization predicate (`backend/src/repositories/projectRepository.ts`), tasks reference projects through a composite `[projectId, organizationId]` foreign key (`prisma/schema.prisma:66`), OWNER/ADMIN gate project writes while members manage tasks (`tenantContext.ts:50-56`), and React Query keys start with user and organization (`frontend/src/features/projects/pages/ProjectsPage.tsx:33`).

---

## Phase 3: Advanced API Design

### Goals
- Professional pagination, filtering, sorting, and search
- Consistent API responses and error shapes
- Proper input validation
- OpenAPI documentation

### Implementation Steps

**Backend**
- Add query params support on list endpoints (page, limit, search, sort, filters)
- Implement cursor-based or offset pagination
- Add centralized error handler
- Document with Swagger or tsoa (optional but educational)

**Frontend**
- Advanced filters UI
- URL-synced filters (useSearchParams)
- Loading, error, and empty states
- Optimistic updates where appropriate

**Learning Focus**
- Designing APIs that scale
- Preventing over-fetching
- Good developer experience for API consumers

> **Status (2026-10-06):** Partly shipped. Lists take `q` and `page` with a fixed page size of 20 (offset pagination), tasks also filter by `status` (`backend/src/lib/validation.ts:28-50`), and errors go through one handler (`lib/errors.ts`). Not built: sorting, cursor pagination, OpenAPI/Swagger, URL-synced filters, and optimistic updates.

---

## Phase 4: Testing Strategy

### Goals
Build confidence through tests, especially around isolation.

**Backend**
- Unit tests for services (e.g., "cannot access project from another org")
- Integration tests for routes with test database
- Authorization tests (critical for multi-tenancy)

**Frontend**
- Component tests
- Tests that verify data is scoped correctly per organization
- Use MSW (Mock Service Worker) for API mocking

**E2E (Stretch)**
- Playwright tests that create two organizations and verify no cross-tenant data leakage

**Mid-Level Emphasis**
- Testing tenant isolation is non-negotiable in SaaS
- Write tests that would catch security bugs

> **Status (2026-10-06):** Shipped without MSW. 24 PostgreSQL/HTTP integration tests (`backend/src/__tests__/projectRepository.test.ts`) cover cross-tenant reads and writes, revocation, and role changes; 12 contract tests run without a database; 4 middleware tests mock Prisma (`tenantContext.test.ts`). The 6 frontend tests stub `fetch` directly, and 10 Playwright scenarios include organization switching (`browser-tests/workspace.spec.mjs:59`).

---

## Phase 5: Advanced Multi-Tenant Features

### Possible Features
- Users belonging to multiple organizations (switching)
- Invites + onboarding flow
- Audit logs (who did what in which org)
- Soft deletes
- Basic billing / subscription per organization (stub)
- Usage metrics per tenant

### Architecture Evolution
- Introduce domain events (e.g., "ProjectCreated" → create audit log)
- Add caching with tenant awareness (Redis)
- Consider row-level security (RLS) in Postgres as an additional safety layer
- Better separation of public API vs internal admin endpoints

> **Status (2026-10-06):** Multi-organization membership with switching and transactional audit events shipped. Invites, soft deletes, billing, usage metrics, domain events, Redis caching, and row-level security were not built.

---

## Suggested Learning Order

1. **Phase 1** — Get auth + tenant context working correctly (most important for SaaS).
2. **Phase 2** — Implement Projects and Tasks with strict isolation.
3. **Phase 3** — Add professional API features (pagination etc.).
4. Add tests as you build (especially isolation tests).
5. Tackle one feature from Phase 5.

After each phase, consider updating JOURNAL.md with what you learned.

---

## Success Criteria for Mid/Senior Level

By working through this project you should be comfortable with:
- Designing multi-tenant systems safely
- Enforcing authorization at multiple layers
- Building APIs that handle real-world complexity
- Thinking about architecture beyond "it works on my machine"
- Writing tests that protect against both bugs and security issues

This project closely resembles the kind of work done on internal tools or B2B SaaS products at small-to-mid size companies.
