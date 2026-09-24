# SEALED — answers to interview/TECHNICAL_QUESTIONS.md

1. A foreign key must reference columns covered by a **unique constraint or primary key on exactly those columns**. The PK on
   `id` alone doesn't qualify for `(id, organizationId)`. Without `Project_id_organizationId_key`, `ADD CONSTRAINT ... FOREIGN KEY`
   fails with "there is no unique constraint matching given keys for referenced table". The unique index costs a little write
   overhead and buys a DB-enforced tenant match.
2. `organizationId → Organization(id)`. Organizations are never deleted (`onDelete: Restrict` everywhere), so the FK can't
   erase history. `actorId → User(id)` is also possible, but then users can never be hard-deleted, which is a GDPR trade-off.
   `resourceId` must stay unconstrained, because that is the point of retention.
3. `task Task @relation(fields: [taskId, organizationId], references: [id, organizationId], onDelete: Restrict)`, which requires
   `@@unique([id, organizationId])` on `Task` first (see Q1). The same pattern fixes INC-001, with `OrganizationMember(userId, organizationId)` as the parent.
4. `missing_ok = true` returns NULL instead of raising when the setting was never set. `"organizationId" = NULL` is never true,
   so the query returns **zero rows**: fail closed. You want that because the alternative is either an error that someone
   "fixes" by setting a default tenant, or, without RLS, every tenant's rows. Pair it with an alert, because "empty" is a silent failure.
5. Request A borrows connection #3 and runs `SET` (session scope). A's work finishes, and #3 returns to the pool *with the setting
   still on*. Request B (Cedar) borrows #3. If B's code path forgets to set the tenant, or sets it after its first query, it reads
   under Maple's setting. `set_config(name, value, true)` inside `$transaction` resets at COMMIT/ROLLBACK, so the dangerous state can't outlive the transaction.
6. No. The app connects as `tenant_dev`, the image's `POSTGRES_USER`, which is a **superuser**. Superusers bypass RLS even with
   `FORCE ROW LEVEL SECURITY`. You need a `NOSUPERUSER NOBYPASSRLS` runtime role, with the owner kept for migrations.
7. Make a `tenantApi` router with `tenantApi.use(attachTenantContext)` and mount every tenant resource under it; `app.use("/api", tenantApi)`
   goes after `/api/auth` and `/api/me`. `/health`, `/api/auth/login` and `/api/me` stay outside (no tenant yet; `/api/me` lists memberships).
   Add a CI grep: `x-org-id` may appear only in `tenantContext.ts`. Add a test matrix: every tenant route × non-member org → 403.
8. Misleading: a cross-tenant `assigneeId` rejected by the compound FK. The user is told "record changed, refresh", which
   hides both a bug and a possible probing attempt, and nothing is logged. Right: deleting a project whose tasks were added
   concurrently (FK `Restrict`). That really is "still referenced".
9. Every request's `req.ip` is the LB's address, so all users share one bucket per instance. 20 logins per instance per 15 min (successes
   count too) locks out everyone routed there. Buckets differ per instance, so behaviour looks random. The 1,000-IP cap is irrelevant
   (1 IP). Fix: `app.set("trust proxy", <hops>)`, key on IP + email, reset on success, and use a shared store (Redis) or the edge WAF.
10. Deep OFFSET scans and discards up to 199,980 index entries, and `count(*)` walks every row, in a transaction holding a snapshot.
    That is sustained I/O and CPU on the shared database, a noisy neighbour for every other tenant. Cheapest mitigations:
    **keyset pagination** on `(createdAt, id)` with an index that matches the sort direction (review M7), and drop or approximate the exact total
    (or cap it: "10,000+"). Next steps: per-tenant rate limits and a statement timeout for list queries. See curriculum 10 and 14.
