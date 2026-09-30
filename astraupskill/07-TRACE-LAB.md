# Trace lab: follow authority and accepted state

Complete the local setup in [the root README](../README.md), using fictional demo accounts and a dedicated database. Sign in as `owner@example.test` with the generated demo password. Keep the password and token out of screenshots and shared request logs. The browser stores the token only in memory, but developer tools still display its Authorization header.

Create a Cedar project called API trace practice and add a task called Explain the transaction boundary. In the Network panel, find the project POST. Record the editable body, organization header, response ID, version, and Location header. Explain how the server obtains the user identity and why the body cannot choose the actor or organization independently.

Switch to Maple Works. The same user is a member there rather than an owner. Notice that project-management controls are unavailable while task-management controls remain available on an authorized project. Use a local HTTP client with the same token to request the Cedar project ID while selecting Maple. A scoped read should report no matching project. A client-provided tenant selection is necessary for routing intent, but membership and scoped predicates determine what is allowed.

Switch back to Cedar and open the trace project in two tabs. In tab A, change its description and save. Record the expected version in the PUT body and the advanced response version. In tab B, enter a different description and save. Expect a conflict and preserved input. Export the draft and identify its original version. Load current values only after exporting, then explain how you would merge the two descriptions manually.

Follow the accepted request through [middleware](../backend/src/middleware/tenantContext.ts), [service validation](../backend/src/services/projectService.ts), and [the repository](../backend/src/repositories/projectRepository.ts). Mark the transaction start, conditional write, audit insert, accepted read, and completion. Compare that with the audit-trigger failure test: the entity and audit remain unchanged together. Record which response represents a validation problem, an authorization problem, a stale update, and a database failure.

Now attempt to delete the project while its task remains. The API should require explicit task removal. Delete the task with its current version, then delete the empty project. Inspect retained audit metadata in the test database or the project audit API while using the correct organization. Explain why minimal audit metadata is different from a backup containing every old field value.

Finish by searching for a literal percent sign in a fictional project name and checking pagination with more than twenty matching records. Describe why parameterized SQL and wildcard escaping solve different problems. Your final artifact should contain a request narrative, a transaction diagram, and one failure reproduction. Include the remaining uncertainty: a timed-out create may already have committed, so the current implementation requires inspection before retrying rather than guaranteeing idempotent creation.

## The middleware the trace starts in

The first stage of the request narrative is membership resolution. `backend/src/middleware/tenantContext.ts:12` shows why the body cannot choose the actor or the organization: the user comes from the authenticated request, the organization comes from a header, and membership is looked up before anything downstream runs.

```ts
export async function attachTenantContext(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    if (!req.userId) throw new AppError(401, "Sign in to continue.");
    const parsed = identity.safeParse(req.headers["x-org-id"]);
    if (!parsed.success)
      throw new AppError(
        400,
        "Select an organization using the x-org-id header.",
      );
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: req.userId,
          organizationId: parsed.data,
        },
      },
    });
    if (!membership)
      throw new AppError(403, "You are not a member of that organization.");
    req.tenant = {
      userId: req.userId,
      organizationId: parsed.data,
      role: membership.role,
    };
    next();
  } catch (error) {
    next(error);
  }
}
```

