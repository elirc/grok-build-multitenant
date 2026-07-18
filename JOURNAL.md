# SWE Thought Process Journal - grokbuildmultitenantproject

This journal explains the reasoning behind building this Multi-Tenant SaaS starter.

## Why Multi-Tenant?

Most modern B2B SaaS products are multi-tenant by nature. Customers (organizations) expect complete data isolation. Building this correctly teaches one of the most important mid/senior skills: designing systems that prevent data leaks between tenants while remaining scalable and maintainable.

## Key Architecture Decisions

### Tenant Isolation Strategy

We use a **shared database with row-level tenant scoping** (organizationId on most tables).

**Why not separate databases/schemas?**
- Separate DBs per tenant is complex and expensive for small-mid companies.
- Shared DB with strict filtering is the standard starting point for most startups.
- It forces discipline in every query and service method.

**Implementation rule**: The current organization must be resolved early (from JWT or context) and passed down. No query should ever omit the organization filter.

### Authentication + Tenant Context

- JWT includes the user's ID and (optionally) default organization.
- On every request, middleware resolves the current organization the user is acting in.
- Services always receive the organizationId and enforce it.

This is more realistic than single-tenant apps.

### Role-Based Access Per Tenant

Roles are scoped to the organization membership:
- OWNER (full control)
- ADMIN (manage users/projects)
- MEMBER (create/edit within projects)

This is standard in tools like Notion, Slack, Linear, etc.

### Layered Backend

Same as previous projects:
- Routes (HTTP concerns)
- Controllers (orchestration + validation)
- Services (business logic + authorization)
- Repositories (data access)

For multi-tenancy, authorization checks often live in Services, not just middleware.

### Frontend Architecture

- Feature folders (e.g., features/organizations, features/projects)
- TanStack Query for all data fetching (handles caching per tenant context)
- Organization switcher in the UI (common in multi-tenant SaaS)

**Key insight**: The current organization context must be part of the query key in TanStack Query. Otherwise, data from one tenant can leak into another in the UI cache.

### Tech Choices

- Prisma + Postgres: Excellent for relational multi-tenant models with foreign keys to organizations.
- Express + TS: Keeps focus on architecture rather than framework magic.
- Zod: Consistent validation.
- No overkill (no NestJS yet) — but the structure is ready to evolve.

## Important Trade-offs

1. **Shared DB vs Separate DBs**
   - Shared is simpler and cheaper initially.
   - Separate DBs give better isolation and easier per-tenant scaling, but much higher ops complexity.

2. **Where to enforce tenant filtering**
   - Middleware can attach context.
   - Repositories should be the last line of defense (never trust callers).
   - Services should also validate.

3. **User belonging to multiple organizations**
   - Common in real SaaS.
   - Requires an "active organization" context per request/session.

## Common Mid-Level Pitfalls This Project Highlights

- Forgetting organizationId in a query → data leak between tenants (huge security issue).
- Relying only on frontend to filter data.
- Caching user data without tenant context in React Query.
- Using global state that doesn't reset when switching organizations.
- Hard-coding IDs instead of scoping everything.

## Learning Focus

By studying this project you will internalize:
- How to design systems that scale to thousands of tenants.
- The importance of context propagation (user + current tenant).
- Defensive data access patterns.
- How frontend state management must respect backend isolation rules.

Read the comments in the code for line-by-line explanations of these concepts.
