# Transfer the idea into Grok multitenant project

## Contract comparison before implementation

Write a two-column comparison between the lab and the real `listInput` schema. Do not silently change an established API to match the lab. Choose one documented behavior that lacks a test and add an API-level assertion for it in a practice branch.

Trace one invalid request through `projectController` and the error-handling layer. Confirm the response status and shape, and that the repository was not asked to execute an invalid query. If a schema deliberately coerces a value, test that contract instead of declaring it wrong by preference.

Add a frontend check that an unreadable response does not discard a user's draft. Distinguish the fetch wrapper test from a component test showing that draft preservation is visible to the user.

Deliver: contract comparison, one request/response fixture, a failing-then-passing test at the correct boundary, and a short note on why trusted organization context comes from the authenticated service path rather than query input.

## Review a proposed change

An agent changes the service to `repo.findByOrganizationId(query.organizationId, {...query, page: parseInt(query.page) || 1})`. Identify both the trust-boundary change and the ambiguous parsing. Ask for validation at the existing boundary and preservation of authenticated tenant context, with an integration assertion instead of only a parser unit test.

## Evidence boundary

Work in your own practice branch or isolated workspace and inspect existing changes first. Do not switch or reset the owner's working tree. Describe any uncommitted source your exercise depends on; a worktree from HEAD does not include it. Use the existing package scripts after reading their targets. Run one repository at a time, with disposable fixtures for data tests. The authoring pass supplied exercises, not these application changes.

For a TS repository, sketch the input/output types and one discriminated union before implementation. Name which invalid input still needs runtime validation. For GitJira's JS code, use its existing JSDoc/shared-schema conventions instead of converting the app to TypeScript.
