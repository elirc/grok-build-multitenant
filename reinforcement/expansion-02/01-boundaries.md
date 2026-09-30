# Boundary lessons: Capability matrices and optimistic writes

## Authentication, organization selection, and capability

Read attachTenantContext and requireManager. Locate where a user identity is established, where the x-org-id header is parsed, and where membership is retrieved. The header selects a requested organization; it does not by itself prove membership. Record the exact point at which the request receives trusted tenant context.

Now read projectService and distinguish project changes from task changes. The inspected requireManager implementation admits OWNER and ADMIN for project changes. Do not generalize that rule to every task operation without tracing its actual service path. A capability matrix is more precise than saying “all writes require admin.”

## Negative space belongs in the matrix

Write a table with no context, wrong organization, MEMBER, ADMIN, OWNER, and unknown role. Add read, task write, and project write actions. Each cell should have an outcome and a reason. An unknown action is not safely handled by falling through to a broadly permissive default.

The teaching matrix is a simplified policy. The application may have additional ownership, assignment, or resource-state restrictions. A pure function proving a role/action table does not show that every HTTP route calls it or that resource lookup is tenant-scoped.

## The read-modify-write window

Trace updateProject through projectUpdate parsing into repo.update. Two clients read version 3. Client one saves and advances the version. What evidence allows client two's save to reject rather than silently replace the first? A comparison in application memory before an unconditional SQL UPDATE leaves a race; the condition must be enforced at the authoritative write boundary.

The lab models that decision synchronously, so it cannot prove database atomicity. Its value is a concrete contract for not-found, conflict, and updated outcomes, including unchanged unrelated records. The real regression must exercise competing writes against the same stored version.

## Failure responses guide recovery

Separate an invalid payload, insufficient permission, a missing resource, and a stale revision. A UI cannot offer sensible recovery if every failure becomes a generic 500. Decide whether a missing resource should be concealed across organizations and use the application's established response convention; do not expose another tenant's existence just to make a test easier.

## Make the boundary visible

For each source trace, record the caller, input representation, validation, state owner, returned value, and visible user consequence. Put a question mark beside every arrow you inferred rather than located. Resolve one question by reading its caller and one by proposing a focused test. A diagram full of accurate filenames can still miss an unhandled outcome.

End with three sentences: the invariant, the failure that would violate it, and the smallest observation that would detect the violation. Use [the source map](README.md) to keep this exercise attached to the actual repository.
