# 11. Request boundaries and error contracts

[Course index](README.md) · No worked review has been written for lessons 10-12 yet; compare your answers with the cited source and tests instead.

Sources: [application setup](../../backend/src/app.ts), [project routes](../../backend/src/routes/projectRoutes.ts), [validation](../../backend/src/lib/validation.ts), and [error handler](../../backend/src/lib/errors.ts). This chapter asks how malformed requests become understandable failures without being mistaken for accepted work.

## Middleware order is part of behavior

The application assigns a request ID and response headers before CORS, JSON parsing, authentication, and project routing. That gives later failures a correlation identity. The JSON parser has a 32 KiB limit and strict mode. Project routes then reject mutation query parameters and require application/json for non-GET requests before calling the service layer.

These checks operate on different representations. The body-size limit concerns received JSON bytes. The schema's name and description limits concern parsed strings after trimming. A body can fit the transport limit and still contain an overlong field. Conversely, a very large body can be rejected before the service parser ever examines its fields. A useful test suite distinguishes those stages because their error categories and evidence differ.

Mutation query parameters are rejected rather than silently ignored. That avoids ambiguous inputs such as a version in the URL and another version in the JSON body. The current routes expect versioned mutation data in the body. A future API change should preserve one clear source of truth or explicitly define precedence; accepting several locations casually makes both validation and client recovery harder to explain.

## CORS is a browser-origin policy

The configured frontend origin is allowed, an unrelated supplied origin is rejected, and requests without an Origin header are not rejected by that origin comparison. This is consistent with a server that can be called by nonbrowser clients. CORS therefore should not be described as the authentication mechanism. A command-line client can omit Origin, but it still needs valid authentication and membership for protected routes.

The response exposes Location and X-Request-Id to browser code. Location is useful for a created resource, while the request ID supports correlation. The application also sets no-store, nosniff, and no-referrer headers. These are concrete response behaviors that can be verified in an HTTP test. They do not replace tenant-scoped queries or justify claims about every possible deployment proxy configuration.

When teaching CORS failures, include the request path and supplied origin but avoid including bearer tokens in shared notes. A blocked browser request may look like a generic network failure to the frontend. The server-side request ID and controlled reproduction can help distinguish origin policy from expired authentication or database unavailability.

## Error categories should preserve useful distinctions

The error handler translates known application errors, parser errors, selected Prisma conflicts, initialization failures, and malformed or oversized request bodies. It avoids returning raw internal exception text for unexpected server failures. That protects implementation details while still giving the user a recovery-oriented message and request ID.

Validation errors are summarized from a bounded number of issues. A learner should understand why this is preferable to dumping an unbounded nested error object into the browser. The response needs to explain the user's next action without becoming a debug log. At the same time, excessively generic messages can make harmless input mistakes difficult to fix. The schema paths in validation messages provide a practical compromise for this application.

Database conflict categories can include more than optimistic version mismatch. Uniqueness, foreign-key restrictions, and transaction conflicts may map to a refresh-oriented conflict message. That means a 409 alone does not identify a single root cause. An investigation should connect the operation, request ID, current data, and known constraints rather than assume every conflict means two people edited the same name.

## Correlation is not full observability

For server-side failures, the handler logs a compact object containing request ID, status, and an event name. This is useful for connecting the response to a failure record without printing request bodies or credentials. It is not a complete diagnostic trace of the database exception or transaction timeline. The course should neither criticize the absence of every possible telemetry field nor claim the current log can answer questions it does not record.

A future observability exercise can propose structured internal error categories, operation names, and safe resource identifiers. Each added field should have a specific investigative purpose and a data-handling policy. Avoid logging full draft descriptions merely because they are available. The user may have placed private planning information there, and most operational questions can be answered with less content.

## Design an error contract table

Use columns for trigger, earliest layer, response category, draft handling, retry guidance, and durable-state expectation. For malformed JSON, the service should not have accepted a mutation. For a stale version, the current row remains and the draft should be retained for reconciliation. For a timeout, the durable outcome is uncertain. For a server failure caused by an audit insertion inside a transaction, the intended durable result is rollback, but the integration test must verify it.

This table is especially valuable for frontend contributors. It prevents a generic retry button from treating every failure the same way. A validation error needs correction; a membership denial needs access review; a conflict needs fresh state; a transport failure needs outcome investigation. Clear recovery behavior follows from the error's meaning, not merely its color in the UI.

### Exercises

**MT11 A.** Compare an oversized body with an overlong project name inside a small body. Identify the responsible layer and the assertion that no project was inserted.

**MT11 B.** Explain why omitting Origin does not bypass the application's authentication and membership requirements. Construct a test that separates CORS policy from authorization.

**MT11 C.** Draft a six-row error contract table for the project editor. Include an uncertain timeout and an accepted save followed by refresh failure so that recovery guidance does not overstate rejection.
