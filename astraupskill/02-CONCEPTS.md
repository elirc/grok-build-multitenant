# Selection, authorization, concurrency, and consistency

Selecting an organization is different from being authorized to use it. The browser sends `x-org-id` because the user may belong to several workspaces. The server verifies the token's user and looks up that user's membership in the selected organization. An arbitrary header alone grants nothing. Every repository operation then includes the organization predicate, including single-record reads, updates, deletes, and audit queries.

Consider a user who owns Cedar Studio but is only a member of Maple Works. The same token identifies the same user in both places. The selected membership determines the role. Owners and administrators manage projects; members can manage tasks. The API checks these rules even if a caller manually constructs requests that the UI would never offer. Hiding a button improves usability but does not enforce authorization.

Identity and version solve another problem. A project's ID remains stable when its name changes. Its version advances on accepted edits. A draft retains the version it loaded:

```text
+ Editor A loads project P, version 1, in Cedar.
+ Editor B loads the same P, version 1, in Cedar.
+ A saves with expected version 1: accepted as version 2.
+ B saves with expected version 1: conflict; B keeps its draft.
```

Fetching version two immediately before attaching it to B's old draft would bypass the protection. The expected version must describe the draft's baseline. The repository uses a conditional update matching identity, organization, and version, then checks the affected-row count. Delete also requires a version, since deleting another editor's changed record can lose work just as an update can.

Transactions keep related writes consistent. The project or task mutation and its audit insertion share one Prisma transaction. A deliberately failing audit trigger proves that the entity change rolls back. Audits retain minimal metadata after deletion; they do not contain every prior value and cannot recreate an entire deleted record.

Referential integrity protects relationships. A task includes both project and organization IDs, and its composite foreign key points to the matching pair on Project. The database therefore rejects a task that claims one organization while referencing another's project. Project deletion refuses nonempty projects instead of silently cascading through tasks.

Read consistency matters too. List rows and total counts run in one repeatable-read transaction, use stable ordering, and return twenty records per page. Search escapes SQL wildcard characters before Prisma's contains filter so percent and underscore mean literal text. Parameterized queries and literal search behavior address different concerns.

Finally, a timeout is not proof of rejection. A create may commit before the browser loses its response. This implementation preserves input and asks the user to inspect before retrying; durable create idempotency is a later exercise. State exactly which guarantee exists rather than treating every failure as safely retryable.
