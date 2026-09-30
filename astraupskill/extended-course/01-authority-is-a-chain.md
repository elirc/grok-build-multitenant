# 1. Follow the complete authority chain

This course expands Tenant Workspace through the current application source. Its first question is deliberately concrete: why may this request change this row? A useful answer must identify the authenticated user, selected organization, verified membership, operation permission and row predicate. A visible button or a supplied organization identifier does not answer all five questions.

Start with [tenantContext.ts](../../backend/src/middleware/tenantContext.ts), then [projectService.ts](../../backend/src/services/projectService.ts) and [projectRepository.ts](../../backend/src/repositories/projectRepository.ts). Draw one arrow for each handoff. Label the value that crosses it and the check that makes that value trustworthy for the next operation. Keep authentication upstream of membership verification; this chapter does not treat an arbitrary userId as authenticated merely because a TypeScript type accepts it.

## Organization selection is a request

attachTenantContext first requires req.userId. It then parses the x-org-id header with the identity schema. A missing authenticated user produces the sign-in error before membership lookup. An invalid organization header produces a selection error. A syntactically valid organization identifier still needs a matching OrganizationMember row for that user and organization.

Use a fixture with user Ada belonging to Cedar as OWNER and Birch as MEMBER. Selecting Cedar does not prove ownership until the membership lookup returns that role. Selecting Birch must use the Birch membership, not Ada's most privileged role from another organization. Selecting Elm, where Ada has no membership, must not yield a context just because Elm exists.

The constructed TenantContext contains userId, organizationId and role. It represents the result of that request's membership lookup. It is not a permanent authorization token for every future action. If a later design allows membership administration, the lifetime of this observation becomes an important concurrency question. The current source reading establishes when the lookup occurs, not how every future revocation policy should work.

## Operation permissions differ

The service calls requireManager for project creation, update and deletion. That function permits OWNER and ADMIN and rejects other roles. Task creation, update and deletion do not call this manager gate in the inspected service. The accompanying error message explicitly says members can manage tasks. Therefore a matrix that marks every write as administrator-only would misdescribe the current contract.

Build a table with rows project create, project update, project delete, task create, task update, task delete and read operations. Give OWNER, ADMIN and MEMBER their own columns. Add a final column naming the enforcing method. Do not infer permission from an operation's HTTP verb alone. Two POST operations can have different policies because they affect different domain objects.

Permission to manage tasks also does not mean permission to touch any task in the database. The repository still needs organization and project predicates. The role gate and row scope cooperate; neither substitutes for the other.

## The row is another boundary

projectIn searches by project ID and parsed organization ID. taskIn searches by task ID, project ID and organization ID. Updates and deletes include the same ownership fields in their mutation predicates, alongside expected version. The task's parent is therefore part of the addressed resource, not a display-only label supplied by the browser.

Construct Cedar project P and Birch project Q. A request with verified Cedar membership but Q's ID should fail to find Q through the Cedar-scoped path. A task T under P should not be found through another Cedar project R merely because the organization matches. These two fixtures distinguish cross-organization isolation from parent-child consistency within one organization.

Avoid a test that violates both conditions at once when you intend to isolate one guard. If a task belongs to another organization and another project, any one rejection may hide a missing predicate. Use adjacent fixtures that satisfy every earlier condition and violate exactly the boundary under review.

## Trusted context is an internal assumption

Service functions receive TenantContext directly. A unit test can construct any object of that shape. Such a test is useful for role and repository behavior, but it does not execute the middleware's membership lookup. Conversely, a middleware test that produces a context does not prove every repository query uses its organization ID.

Write two evidence rows: context construction and context consumption. For the first, assert which membership lookup occurred and whether next received an error or a request with the expected context. For the second, assert the relevant query or mutation predicate and eventual state. A full integration fixture can connect both, but its prerequisites and database scope must be stated separately.

This decomposition is especially useful when reviewing an optimization. Caching membership, passing a context to a background job or reusing a service object can change the observation's lifetime. Ask who owns invalidation and which changes must take effect immediately. Do not claim that a type alias by itself supplies those policies.

## Failure communication

The current errors distinguish sign-in, organization selection, missing membership, insufficient role and missing resource. A product may choose different external disclosure policies, but the course should begin by recording the actual distinctions. A test should assert both response category and absence of unintended writes. A request rejected before repository entry should not produce an audit event describing a successful change.

Operator notes should retain the selected organization and operation identity without logging unnecessary credentials. If a user says a project disappeared after switching organizations, compare selection, membership and resource scope before assuming data was deleted. The same ID viewed through a different authorized context can legitimately be absent.

## Exercises

MT01-A: fill the operation-role matrix for Ada in Cedar and Birch, then add a no-membership Elm request. Name the exact boundary that rejects each prohibited action.

MT01-B: design two task lookup fixtures, one violating only organization and one violating only project. Explain why one doubly invalid fixture would provide weaker evidence.

MT01-C: propose membership caching with a declared revocation policy. Identify which current source observations remain true and which new guarantees would require tests. Do not present the proposal as implemented behavior.

[Course index](README.md) · [Foundation answers](answers/01-foundations.md)
