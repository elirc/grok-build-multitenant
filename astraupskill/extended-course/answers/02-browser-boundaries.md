# Worked review: browser boundaries

[Course index](../README.md). These answers concern the page and request helper as inspected, with proposed tests clearly separated from executed labs.

## MT07 A: keep the reviewed revision attached to the proposal

Initially both editors hold version seven and the same accepted fields. Alice changes her description draft while her selected Project remains version seven. Her request carries that version and her copied draft. On acceptance the server returns version eight; the page adopts the response, updates the baseline, and clears dirty state. Bruno still holds version seven, with a different name in his local draft. His request is stale even if the field he changed is different from Alice's field.

Bruno's export should retain version seven. That is the revision on which his proposal was based. Substituting eight without showing him its accepted values would assert a review that never happened. A future field-level merge can use the original baseline, his draft, and the new row to identify nonoverlapping edits, but it must make that policy explicit. The current repository accepts or rejects a whole versioned update; it does not infer a three-way merge from field differences.

The timeline should finish with Bruno's draft still available and a conflict visible. Do not end it with the draft automatically cleared merely because the promise rejected. The useful failure behavior is preservation of work plus an honest statement that it has not been accepted. This gives Bruno the information needed to export, load current values, and decide what to reapply.

## MT07 B: a later refresh error does not undo an accepted save

Resolve the mutation promise with a project at version eight whose name has been normalized. Then reject the promise returned by cache invalidation. The save callback has already called adoptProject and set a success notice before awaiting refresh. The selected record and draft therefore contain the accepted response, and dirty state is false. The generic catch may also set an error describing unsaved values as available. That message can be confusing because the mutation itself succeeded.

A useful assertion set checks the visible version, normalized input value, dirty-state label, and error message together. Checking only that an alert exists would miss the semantic problem. The proposed improvement is to handle accepted mutation state and refresh failure separately, perhaps keeping the accepted-save notice and adding a list-refresh warning. This course documents the current ordering and supplies the test design; it does not claim to have changed the page.

## MT07 C: three-way reconciliation needs an explicit policy

Present the original accepted value, local proposed value, and current server value for each field. If only the local value differs from the original, it is a candidate to reapply. If only the current server value differs, preserve that accepted change. If both differ, require a decision unless a domain-specific merge rule is safe and understandable. Even a same-field change to the same final value should be treated deliberately rather than falling through a generic conflict banner.

After the user reviews the reconciliation, submit against the current server version. Another writer may win before that new submission, so the conditional update still matters. A merge screen reduces cognitive work; it does not eliminate concurrency. Retain the user's reconciled proposal if another conflict occurs, and avoid entering an automatic retry loop that repeatedly substitutes newer versions without review.

## MT08 A: a cache can mislabel a correct old result

Give North a project named Launch with ID north-launch and South a different Launch with ID south-launch. Sign in as an account that belongs to both. Query North with search Launch and page one. If the key omits organization, switching to South asks the cache for the same key even though the scope header has changed. A retained North result can then appear beneath South's heading. The server's response to any actual South request may be perfectly scoped; the browser reused the wrong observation before or instead of that request.

The test must make the two result sets visibly different. Empty fixtures do not expose the collision. Assert both the organization heading and the absence of the foreign project's label or ID in the rendered list. A lower-level key test can document the dimensions, but the user-visible assertion explains why the dimension exists.

## MT08 B: component identity resets more than the selected row

The keyed page instance holds project and task selection, their drafts and dirty flags, both sets of search and page state, task status, busy state, notices, and errors. Remounting for a new user-and-organization identity resets this local workspace. Retaining a task draft with the old parent ID would be particularly misleading: the new organization heading could frame work that actually belongs to the previous project.

A behavioral test can create a dirty task draft, attempt organization switching, cancel the discard confirmation, and verify that both scope and draft remain. Then accept the discard and verify the new scope has no old selected task or draft. The busy branch should independently block leaving during a controlled pending mutation. These are different guard conditions and deserve distinct assertions.

## MT08 C: invalidate the observations affected by task creation

The current implementation invalidates the user-and-organization prefix. That covers the task list for the parent, any relevant project task counts, and audit observations in that workspace. Invalidating only a project-list key may update a count but leave the visible task list stale. Invalidating the entire cache is simpler but refreshes unrelated scopes and makes it harder to reason about what changed.

A narrower implementation could identify exact affected keys, but it would need to maintain that dependency list as features evolve. The active-organization prefix is a reasonable small-application boundary. The explanation should not claim all queries become fresh simultaneously: each request still has its own completion and failure. A refresh error can leave old observations visible, which is why loading and error labels matter.

## MT09 A: transport failure leaves two possible durable histories

In the first timeline, the browser sends a valid update, the transaction commits version thirteen, the response is delayed or lost, and the local timer aborts fetch. In the second, the request never reaches acceptance or the transaction fails, and the browser still reaches its timeout. The browser sees a rejected request in both cases. A fresh authorized read of the object and, where helpful, its audit history supplies additional evidence about the durable outcome.

That evidence may require interpretation. If another writer has already advanced the row again, matching only the current name is not a complete explanation of the history. The exported baseline and proposed values help reconstruct intent, while the version and audit events describe accepted changes. The recovery process should acknowledge when the available metadata cannot conclusively attribute a particular value to the timed-out request.

## MT09 B: parseability precedes typed adoption

The helper calls response.json and throws an unreadable-response ApiError if parsing fails. A 200 response containing HTML therefore cannot become a Project object. After successful parsing, the helper checks response.ok and either throws the returned error message or casts the data to the requested generic type. It does not validate that the parsed object has every Project field with the correct runtime type.

This distinction supports two separate tests: malformed JSON should trigger the unreadable-response path, while valid JSON with the wrong shape exposes the current absence of response-schema validation. The latter is a design exercise rather than a claim that the helper already rejects all incompatible payloads. Avoid using TypeScript's generic parameter as evidence of a runtime check.

## MT09 C: uncertain creation needs a search before repetition

Record the organization, intended name and description, approximate submission time, and whether any response or request identifier was captured. Search current projects in that organization and inspect plausible matches before creating another. A name match alone is not necessarily unique, so compare details and audit timing where available. Preserve the draft while investigating.

Creation has no accepted baseline version and no durable request key in this workspace. A repeated POST can therefore represent a second new record. An existing update has a version condition that will normally make an already-accepted old-version retry conflict, but that conflict still requires a current read to interpret. Neither operation should be described as automatically safe to retry merely because the browser timed out.
