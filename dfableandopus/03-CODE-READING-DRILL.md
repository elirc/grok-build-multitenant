# Code reading drill: six rounds

Answer out loud, then open the `<details>`. Four minutes each.

## Drill 1: explain this middleware

`backend/src/middleware/tenantContext.ts:12-44`.

```ts
export async function attachTenantContext(req, _res, next) {
  try {
    if (!req.userId) throw new AppError(401, "Sign in to continue.");
    const parsed = identity.safeParse(req.headers["x-org-id"]);
    if (!parsed.success)
      throw new AppError(400, "Select an organization using the x-org-id header.");
    const membership = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: req.userId, organizationId: parsed.data } },
    });
    if (!membership)
      throw new AppError(403, "You are not a member of that organization.");
    req.tenant = { userId: req.userId, organizationId: parsed.data, role: membership.role };
    next();
  } catch (error) {
    next(error);
  }
}
```

<details><summary>What a strong answer says</summary>

Four steps and three distinct failures. `req.userId` is set by `authenticate`, mounted earlier at `backend/src/app.ts:53`, so this middleware never parses a token itself; a missing user is 401. The header is validated with the same `identity` schema the repositories use (`backend/src/lib/validation.ts:25-27`), so a malformed value is 400 before any query runs. The membership read uses the compound unique key `userId_organizationId`, which exists because of `@@unique([userId, organizationId])` at `backend/prisma/schema.prisma:41`, so this is an index lookup and not a scan.

The two things worth pointing out unprompted: the role on line 38 comes from the membership row, which is why a role change or a revocation takes effect on the next request rather than at token expiry; and an organization that does not exist and one you were removed from produce the same 403, so a caller cannot enumerate tenants. The `try/catch` with `next(error)` is required because this is an async Express 4 middleware, where a rejected promise would otherwise hang the request.
</details>

## Drill 2: explain this write

`backend/src/repositories/projectRepository.ts:105-120`.

```ts
  return prisma.$transaction(async (tx) => {
    const changed = await tx.project.updateMany({
      where: { id, organizationId: identity.parse(context.organizationId), version: expected },
      data: { ...data, version: { increment: 1 } },
    });
    if (changed.count !== 1) {
      await projectIn(tx, context.organizationId, id);
      throw conflict();
    }
    await audit(tx, context, "PROJECT", id, "UPDATE", expected + 1);
    return projectIn(tx, context.organizationId, id);
  });
```

<details><summary>What a strong answer says</summary>

Three predicates in one statement: the right record, the right tenant, the version the caller captured. The database decides the race, so two managers who both loaded version 3 cannot both succeed.

The `if` block is the part candidates miss. On zero rows it calls `projectIn`, a scoped read, before throwing. If that read fails, the caller gets 404 "Project not found in this organization."; if it succeeds, the record exists in their tenant, so the only explanation is a stale version and the 409 is truthful. Without the re-read, a cross-tenant id would return "This record changed", confirming a record the caller may not see.

The last line re-reads through the same scoped helper rather than returning the update result, so the response is a real row shaped like every other read. And `audit` receives `tx`, so the audit event lives or dies with the change; "rolls back project create update and delete when audit fails" (`backend/src/__tests__/projectRepository.test.ts:383`) is the proof.
</details>

## Drill 3: spot the bug

A mutated copy of `removeTask`, compare with `projectRepository.ts:229-251`.

```ts
export async function removeTask(context, projectId, id, expected) {
  return prisma.$transaction(async (tx) => {
    const removed = await tx.task.deleteMany({
      where: { id, projectId, version: expected },
    });
    if (removed.count !== 1) {
      await taskIn(tx, context.organizationId, projectId, id);
      throw conflict();
    }
    await audit(tx, context, "TASK", id, "DELETE", expected + 1);
    return { id };
  });
}
```

<details><summary>The mutation</summary>

`organizationId: identity.parse(context.organizationId)` was removed from the delete predicate. The real line is `projectRepository.ts:240`.

The damage is asymmetric and that is what makes it nasty. Reads and the failure branch still scope correctly, because `taskIn` carries the organization (`projectRepository.ts:45-51`). So a caller who is an authenticated member of organization B, guessing or learning a task id and project id from organization A, gets a successful delete and then an audit row written with B's organization id at line 248, attributing A's data loss to the wrong tenant. If they guess wrong, the failure branch hides the mistake behind a clean 404.

The composite foreign key does not help here: it constrains which project a task may point at, not who may delete it. The test that fails is "scopes single reads and writes even when the user belongs to both tenants" (`projectRepository.test.ts:179`), which is exactly why that test uses a user who is a legitimate member of both organizations.
</details>

## Drill 4: spot the bug

A mutated copy of the task list query, compare with `projectRepository.ts:153-182`.

```ts
export async function listTasks(org, projectId, query) {
  const where = {
    organizationId: identity.parse(org),
    projectId,
    ...(query.q ? { title: { contains: query.q, mode: "insensitive" } } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  return {
    items: await prisma.task.findMany({ where, orderBy: ordered,
      skip: (query.page - 1) * pageSize, take: pageSize }),
    total: await prisma.task.count({ where }),
    page: query.page,
    pageSize,
  };
}
```

<details><summary>The mutations</summary>

Three changes, two of them real defects.

First, `projectIn(tx, org, projectId)` is gone. In the real code it is the first statement inside the transaction (line 155), and it is what makes listing tasks of a project in another tenant a 404. Without it the query simply returns an empty page, which is a weaker answer: an empty list and a forbidden project become indistinguishable, and the caller learns nothing.

Second, `literal(query.q)` became a raw `query.q`. Prisma sends `contains` to SQL `LIKE`, so `%` and `_` in a user's search term become wildcards. The comment explaining this is at `projectRepository.ts:16`, and "uses literal wildcard search and stable bounded pages" (`projectRepository.test.ts:441`) covers it.

Third, the `prisma.$transaction` with `RepeatableRead` is gone, so the rows and the total come from two snapshots and the page can show twenty items out of a total of nineteen. This one is a judgement call rather than a defect; dropping the transaction is a reasonable choice at scale, but it should be a decision, not an accident.
</details>

## Drill 5: predict the status code

Give the status and the line that produces it.

1. `GET /api/projects` with a valid token and no `x-org-id` header.
2. The same request with `x-org-id: org_does_not_exist`.
3. A MEMBER sends `POST /api/projects` with a valid body.
4. A MEMBER sends `POST /api/projects/:id/tasks` with `{"title":"Ship it","status":"TODO"}`.
5. An ADMIN sends `PUT /api/projects/:id` with `{"version":2,"project":{"name":"Portal","organizationId":"org_b"}}`.
6. An OWNER sends `DELETE /api/projects/:id` with the correct version for a project that has two tasks.
7. `PUT /api/projects/:id?force=true` with an otherwise valid body.

<details><summary>Answers</summary>

1. **400.** `backend/src/middleware/tenantContext.ts:20-24`, "Select an organization using the x-org-id header." The `identity.safeParse` fails on `undefined` before any database work.
2. **403.** Line 33-34, the same answer a revoked membership gets, which is deliberate.
3. **403.** `requireManager` from `projectService.ts:21`, "An owner or administrator must change projects. Members can manage tasks."
4. **201** with a `Location` header of `/api/projects/<id>/tasks/<taskId>` (`backend/src/routes/projectRoutes.ts:69-72`). Task CRUD does not call `requireManager`.
5. **400.** `projectInput` is `.strict()` (`backend/src/lib/validation.ts:15`), so `organizationId` inside the project object is a Zod issue rendered as `project.organizationId: Unrecognized key` by `backend/src/lib/errors.ts:31-36`.
6. **409** "Delete the project tasks explicitly before deleting this project." from `projectRepository.ts:139-142`, reached because `tasks: { none: {} }` in the predicate matched zero rows and the re-read showed the version was current.
7. **400.** The router guard at `projectRoutes.ts:8-12` rejects query parameters on any non-GET request before the handler runs.
</details>

## Drill 6: review this diff

Three defects. Which block the merge?

```diff
--- a/backend/src/middleware/tenantContext.ts
+++ b/backend/src/middleware/tenantContext.ts
@@
-    const membership = await prisma.organizationMember.findUnique({
-      where: { userId_organizationId: { userId: req.userId, organizationId: parsed.data } },
-    });
-    if (!membership)
-      throw new AppError(403, "You are not a member of that organization.");
-    req.tenant = { userId: req.userId, organizationId: parsed.data, role: membership.role };
+    const cached = cache.get(req.userId + ":" + parsed.data);
+    const membership = cached ?? await prisma.organizationMember.findUnique({
+      where: { userId_organizationId: { userId: req.userId, organizationId: parsed.data } },
+    });
+    if (!membership)
+      throw new AppError(404, "Organization " + parsed.data + " was not found for this user.");
+    cache.set(req.userId + ":" + parsed.data, membership);
+    req.tenant = { userId: req.userId, organizationId: parsed.data, role: membership.role };
```

<details><summary>Review notes</summary>

**Block on the unbounded cache.** It has no TTL and no eviction, so two properties die at once. Revocation stops working until the process restarts, which contradicts "removes access after membership revocation without trusting old JWT roles" (`backend/src/__tests__/projectRepository.test.ts:154`) and the guarantee written into `astraupskill/VERIFICATION.md` that membership is checked for each request. A role change has the same problem, and "reads changed roles from membership for every request" (line 246) fails. Separately, a `Map` keyed by user and organization grows without limit and is per process, so behaviour differs between instances behind a load balancer. A short TTL would be defensible, and the TTL is then literally the revocation delay, which is the sentence I want in the pull request description.

**Block on the status and the message.** Turning 403 into 404 and echoing the organization id back changes an intentional non-answer into a probe: a caller can now distinguish "no such organization" from "not your organization" by reading the text, and the id is reflected into the response body. `tenantContext.test.ts:29` and `:37` exist to keep those two cases identical.

**Raise, do not block: the cache is written before the request is known to succeed.** It is a read cache, so this is harmless today, but the ordering means a future change that validates something after the lookup would still populate the cache from a rejected request.
</details>
