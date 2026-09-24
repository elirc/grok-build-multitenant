# 10 technical questions, all about this repo

Answer out loud in 2 minutes each, then check `training/_answers/technical-questions.md`.

1. `Task` has a composite FK `(projectId, organizationId) → Project(id, organizationId)`. Why does `Project` need
   `@@unique([id, organizationId])` when `id` is already the primary key? What would PostgreSQL say without it?
2. `AuditEvent` has no foreign keys. Which of its columns *could* safely get one without breaking "history survives deletion"?
3. A teammate adds `Comment { taskId, organizationId }`. Write the relation line so the DB rejects a comment whose tenant
   differs from its task's. What must exist on `Task` first?
4. Your RLS policy uses `current_setting('app.organization_id', true)`. What does the `true` do, and what happens to a query
   when the app forgot to set it? Why is that the behavior you want?
5. Prisma pools connections. Walk through exactly how `SET app.organization_id = 'demo_maple'` leaks Maple's rows to a Cedar request.
6. With `docker-compose.yml` as it is today, would enabling RLS on `Project` change anything the API returns? Why not?
7. `attachTenantContext` is mounted on `/api/projects` only. Propose a structural change so a new router *can't* forget it,
   and name which routes must stay outside.
8. `errors.ts` maps P2003 to 409 "The record changed or is still referenced". Give one INC-001-style case where that message
   misleads the user, and one where it's exactly right.
9. The login limiter is a per-process `Map` keyed by `req.ip`. Describe the failure after you scale to 3 instances behind a
   load balancer without `trust proxy`.
10. The project list uses `OFFSET (page-1)*20` up to page 10,000 plus `count(*)`, inside a RepeatableRead transaction. What
    does one tenant with 2M projects do to the other tenants, and what are your two cheapest mitigations?
