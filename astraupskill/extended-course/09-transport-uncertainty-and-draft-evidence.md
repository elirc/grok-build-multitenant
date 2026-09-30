# 09. Transport uncertainty and draft evidence

[Course index](README.md) · [Worked review](answers/02-browser-boundaries.md)

Read [the request helper](../../frontend/src/api/client.ts), [the page's run wrapper](../../frontend/src/features/projects/pages/ProjectsPage.tsx), and [the route layer](../../backend/src/routes/projectRoutes.ts). A request is not a single indivisible event from the browser's perspective. Sending bytes, accepting a transaction, reading a response, parsing JSON, and updating the editor are separate stages.

## Draw the full path of one save

Suppose a user submits project version twelve. The browser constructs JSON and sends it with the bearer token and organization header. The server authenticates, resolves membership, validates the payload, and attempts a conditional update. If that update commits, version thirteen is accepted. Only after that can the response travel back through the network and be parsed by the browser. Failure in the return path does not reverse the earlier database decision.

The request helper sets a fifteen-second timer and aborts its controller with a message warning that the request may already have completed. This wording is important because it preserves the uncertainty. An AbortController controls the local fetch operation. It does not issue a database rollback receipt. The helper also forwards an external abort signal, which is used by query calls. External cancellation and timeout share a mechanism but may have different user-facing reasons.

The helper removes the external listener and clears the timer in finally. This cleanup applies on success, HTTP error, unreadable response, and abort. Resource cleanup is easy to overlook when reading only the happy path. A test that repeatedly mounts and unmounts queries can expose leaked listeners or lingering timers, but the basic source review should first identify which object owns each resource and where its lifetime ends.

## HTTP status does not guarantee a readable body

The helper attempts response.json before deciding whether response.ok is true. If parsing fails, it throws an ApiError carrying a message about an unreadable response and the HTTP status. This can happen even when the status code is successful. A gateway, development proxy, or misconfigured route might return HTML where the client expected JSON. The client cannot adopt a typed project row from unreadable bytes merely because the server sent a 200 status.

The generic request type is a compile-time promise at the call site. The helper returns parsed data as T; it does not perform a runtime schema check on successful response bodies. That is a useful review distinction. Input validation on the backend is not the same as response validation in the browser. A future API compatibility exercise could add a response schema, but the present lesson should not claim one already exists.

Headers are assembled from scope, body presence, and supplied options. Authorization and organization identity normally come from scope. The final spread of options.headers can override earlier values. This is convenient for a general helper but means callers are part of the trust story. A code review should examine whether any application caller supplies conflicting scope headers. The helper's existence alone does not prove that every possible caller is unable to override them.

## Preserve work without pretending it is accepted

The page keeps failed editor values and offers a JSON export. Project exports include organization, object ID when present, baseline version when present, and the proposed project fields. Task exports additionally include parent project identity. These files help a person remember what they intended after a conflict or uncertain response. Their provenance is local and user-controlled; they are not signed receipts from the backend.

For an existing update, recovery begins by loading current accepted state and comparing it with the exported intent. If the current row already matches the intended change, the user may have recovered evidence of a successful request. If it differs, the user needs to decide whether to reapply any part of the draft. For creation, this repository does not have a checkout-style idempotency key. Repeating a create after an uncertain response could create another record. That is a concrete difference between this workspace and the commerce project.

An export can also contain sensitive business text. The application creates a local download, not a server backup. The lesson should teach users to store that file deliberately and avoid casually attaching it to public issues. This is a practical data-handling property of the feature, not a reason to remove it. A good recovery workflow preserves useful context while keeping credentials out of the draft artifact.

## Build failure tests with controlled boundaries

Create separate fixtures for a server rejection with valid JSON, a success status with malformed JSON, a timeout before response, and a successful response followed by a UI refresh failure. These failures occur at different stages and should not be represented by one catch-all mock. The expected user message and retained editor state may differ, especially after the application has already adopted an accepted server row.

For cleanup, use a fake timer and a supplied AbortController. Verify that an already-aborted external signal results in an aborted internal signal, that timeout fires at the intended boundary, and that success clears the pending timer. Keep assertions focused on observable requests and cleanup rather than private variable names. For server outcome uncertainty, use a documented integration schedule; a fake fetch cannot prove whether a real database commit happened.

### Exercises

**MT09 A.** Draw two timelines that both end in a browser timeout: one where the transaction committed and one where it did not. Name the additional observation needed to distinguish them.

**MT09 B.** Explain why a successful HTTP status with HTML content must not be treated as a saved project row. Identify what the current helper checks and what runtime response validation it does not perform.

**MT09 C.** Design a recovery note for an uncertain create request. Include the organization, draft values, time window, and a search strategy. Explain why immediately repeating the create is a different decision from retrying a versioned update.
