# Foundation review: authority, mutation and query evidence

Attempt MT01 through MT06 before reading this guide. Answers describe the inspected implementation and identify proposed extensions separately. A correct answer must name the boundary that supplies its evidence. A mocked query expectation and a real database outcome can both be useful without proving the same thing.

## MT01: authority chain

Ada as Cedar OWNER may create, update and delete projects. Ada as Birch MEMBER fails requireManager for those project operations. The inspected service permits members to manage tasks, subject to scoped parent/task access and valid input. A request selecting Elm without membership fails context construction before it should enter the operation service.

The organization header selects a claimed organization; the membership row supplies the trusted role for that user in that organization. Ada's OWNER role in Cedar must not be reused for Birch. Syntax validation of the header establishes only an allowed identifier shape, not membership or resource ownership.

To isolate task predicates, first use the correct project and task identities under a different selected organization. Then use the correct organization and task ID but a different project route. Both should be absent in the addressed scope, but each tests a different missing predicate. A fixture violating both conditions can pass even if one important check is removed.

A membership-cache proposal must define whether revocation affects already-started operations, the next request or requests after a bounded interval. It needs a cache key including user and organization, plus invalidation or expiry behavior. Those are new guarantees. The current middleware establishes a membership lookup during context construction; it does not supply a distributed revocation protocol.

## MT02: validation vectors

A padded valid project name becomes trimmed. Omitted project description becomes empty. Whitespace-only name rejects. An unknown nested project field rejects because the object is strict. A null description rejects because the field is a string, even though empty string is accepted. A task status of lowercase done rejects while DONE is accepted. A version string rejects while an in-range numeric integer is accepted.

The identity schema accepts underscore and hyphen along with letters and digits, but it rejects surrounding spaces and more than sixty-four characters. A null byte inside text rejects. An internal tab is not rejected by the selected control-character ranges merely because it is whitespace. These distinctions should appear in exact input vectors rather than a broad description such as sanitized text.

For an existing project description Keep me, a valid update envelope with a required name but omitted description parses description to empty. That asks the repository to replace the description with empty text. If the client intended preservation, it needed to send the existing value under the current full-object contract or use a separately designed patch contract. Omission, explicit empty text and preservation are not interchangeable.

Page one as text is accepted and transformed to a number. Page one as a number is rejected by the string schema. Zero-prefixed text is rejected. Ten thousand is accepted, while ten thousand and one is rejected by the bound. A direct service test must supply the raw representation it intends to exercise; it cannot assume HTTP query parsing already occurred.

## MT03: conditional writes

For an existing same-organization record with a stale version, updateMany changes zero rows and the scoped follow-up read finds the record, so the repository throws conflict. For an absent record, the follow-up read throws not found. For a foreign-organization record, the same scoped lookup also yields not found. A matching organization, ID and version allows one accepted update and a version increment.

In the two-editor fixture, either Alpha or Beta can win unless the test imposes an order. The final row must match the successful edit, its version must advance from four to five, and the accepted update should have the corresponding audit metadata. The losing expected-four edit must not produce another successful-change audit. A mock can exercise count-based branching but cannot demonstrate that PostgreSQL enforces the competition as expected.

An accepted same-value update still increments version in the inspected repository. At the maximum accepted expected version, the next stored version can exceed what the ordinary request schema accepts. A proposed reset to one without another epoch is unsafe because an ancient version-one client could become accidentally current. A wider token or explicit epoch migration should preserve the distinction between old and new histories.

## MT04: audit semantics

Create records CREATE with the new row's initial version. Update from four records UPDATE at five. Delete at expected four records DELETE at five even though the live row is gone. The deletion event's version is command-history metadata, not proof that a current version-five resource exists.

AuditEvent has scalar identifiers rather than a cascading relation to the live Project or Task. A deleted resource can therefore retain history. The history query uses organization, resource type and resource ID, returns descending creation time and ID, and takes thirty. With thirty-five uniquely ordered events, the newest thirty appear and the oldest five do not. An answer calling this the complete lifetime is too broad.

An audit insert failure inside the transaction motivates a rollback test that inspects both resource and audit tables afterward. A lost response after successful commit is different: both rows may already exist. The safe recovery observation uses stable identities and accepted evidence, not the assumption that every exception means nothing happened. If an idempotent create receipt is proposed, it belongs in the same acceptance transaction with the resource and audit.

## MT05: relationships and deletion

A Cedar task referencing Cedar project P is valid under the composite relationship. A Cedar task referencing Birch project Q violates the tenant-parent agreement. A task referencing a missing project violates existence. These are schema-level expectations that need an actual migrated database test to establish provider enforcement.

Deleting an absent or foreign project yields not found within the selected organization. A stale version on a project with children yields version conflict first. A current version with children yields the explicit cleanup conflict. A current empty project can be removed, with retained audit metadata. The classification order matters because it determines what the caller learns and which correction is useful.

For create-versus-delete competition, the invariant is no surviving task without its referenced parent. The winner can depend on ordering. A suitable integration test controls statement progress and inspects final rows and constraints. It should not require creation to win merely because its promise was constructed first.

A proposed task move must declare destination authorization, whether cross-organization movement is allowed, expected version and audit of both locations. The current audit shape does not automatically retain arbitrary before/after parent values. Add those requirements explicitly rather than treating a generic action string as a complete movement history.

## MT06: populations and pages

With P23 through P1 and twenty rows per page, the first page contains P23 through P4 and the second P3 through P1. After insertion of P24, an offset of twenty begins at P4, producing a duplicate from the earlier response. RepeatableRead can make rows and count consistent within one request while leaving different requests on different snapshots.

Percent and underscore fixtures should distinguish literal matching from SQL wildcard matching. Alpha_One should match an underscore query under the intended literal contract while AlphaXOne should not. Percent%Plan should match a percent query without turning that query into every row. A mock verifies the escaped parameter; a real provider fixture verifies how it is interpreted.

Task status counts need an explicit population. All tasks in a project, tasks matching title search and tasks currently visible on one page are three different counts. If a report promises rows and counts from one snapshot, derive them under the corresponding transaction or snapshot boundary. A correct number can still be misleading under an imprecise label.

## Assessment

Award full credit when the learner identifies current behavior, constructs a discriminating fixture and states the evidence limit. Request revision when they infer membership from a header, infer database behavior from a mock, call versioning idempotency, or treat a page as a permanent snapshot. These mistakes all skip a boundary that the source keeps separate.

The transfer exercise is to review a new repository method without relying on its name. List its accepted input, authority context, mutation predicate, transactional companions, result and failure classification. That small ledger is reusable across projects and becomes the foundation for the later durable-command capstone.

[Course index](../README.md)
