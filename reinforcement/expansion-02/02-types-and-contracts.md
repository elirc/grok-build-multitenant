# Types, runtime values, and compatibility

Define VerifiedContext so it is constructed only by the trusted middleware path in your design. A TypeScript type alone cannot prevent a developer from asserting arbitrary JSON into it, so name the construction and review boundary too.

Sketch a union for read, writeTask, and writeProject actions, then an exhaustive mapping from role to allowed actions. Describe how adding an action should require a deliberate policy decision. Unknown input still needs validation before reaching this typed layer.

Model UpdateResult as missing, conflict, or updated. Updated carries the new record; conflict may carry an authorized current revision if the product contract permits it. Explain why a stale expectedVersion should not be silently replaced with the latest version and retried: that would turn conflict detection into last-write-wins without the user's consent.

## Contract worksheet

Write five concrete examples before coding: valid input, missing input, explicitly empty input, wrong primitive type, and a value valid yesterday but stale now. Record whether each is rejected, normalized, ignored, or accepted with a distinct outcome. “TypeScript catches it” is insufficient for JSON, browser storage, events, or a database row returned through an unchecked cast.

Use a discriminated union for outcomes that require different UI behavior. In a TypeScript practice file, make a consumer switch exhaustive and demonstrate which new variant should force a review. In GitJira, use its JSDoc and schema conventions rather than converting the project. Keep proposed type snippets in your practice work until you have verified the actual application contract.

Choose one backwards-compatibility risk: an old caller omits a new field, a saved object has an older shape, or an older client interprets a new outcome as success. Describe a migration or fallback and a test using an old fixture. A renamed property is a contract change even when all currently compiled callers are updated.
