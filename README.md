# grokbuildmultitenantproject

A full-stack Multi-Tenant SaaS Starter built for educational purposes to upskill to mid/senior SWE level.

## Overview

This project simulates a multi-tenant application (like many modern SaaS tools) where data is strictly isolated between "Organizations" (tenants).

**Goal**: Teach advanced concepts like tenant isolation, role-based access per tenant, clean architecture, scalable API design, and React patterns in a realistic fullstack setup using JS/React/Node/TypeScript/Postgres.

## Tech Stack

**Backend**
- Node.js + TypeScript
- Express.js
- Prisma ORM + PostgreSQL
- Zod for validation
- JWT authentication with tenant context

**Frontend**
- React + TypeScript (Vite)
- TanStack Query
- React Hook Form + Zod
- Tailwind CSS
- React Router

## Domain

- **Organizations** (Tenants) - e.g., companies using the SaaS
- **Users** - belong to one or more Organizations with roles
- **Projects** - scoped strictly to an Organization
- **Tasks** - scoped to Projects

Key multi-tenant patterns:
- Every query filters by current organization
- Authorization checks tenant membership + role
- No data leakage between tenants

## Structure

```
grokbuildmultitenantproject/
├── backend/                 # Node/TS/Express/Prisma
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middleware/
│   │   └── types/
│   └── prisma/
├── frontend/                # React/TS/Vite
│   └── src/
│       ├── features/
│       ├── components/
│       ├── hooks/
│       ├── api/
│       └── lib/
├── docker-compose.yml
├── JOURNAL.md
├── PHASE_PLANS.md
└── README.md
```

## How to Use for Upskilling

1. Read **JOURNAL.md** first for the thought process.
2. Read **PHASE_PLANS.md** for the roadmap.
3. Explore code with comments explaining architecture, decisions, and interactions.

This project emphasizes:
- Multi-tenancy isolation (critical for SaaS)
- Proper API design with tenant scoping
- Layered architecture
- Frontend patterns with server state management
- Testing and maintainability

All content is heavily commented for learning.
