# 07. Editor baselines and conflict recovery

[Course index](README.md) · [Worked review](answers/02-browser-boundaries.md)

Read [ProjectsPage](../../frontend/src/features/projects/pages/ProjectsPage.tsx) and [the repository](../../backend/src/repositories/projectRepository.ts) together. The browser and repository cooperate through a version, but they have different jobs. The page preserves a human's proposed values; the repository decides whether those values can be accepted against the revision the human actually saw.

## Separate three values before discussing saving

An editor has an accepted baseline, a current draft, and eventually a server response. In this page, the selected Project object carries the accepted version. The projectDraft state carries editable name and description. The dirty flag describes whether the user has work that should be protected by navigation guards. None of these values is interchangeable. Updating the draft must not quietly update the accepted version; otherwise a later save could falsely claim the user reviewed a newer revision.

The save handler copies the current draft and captures the selected baseline before starting asynchronous work. Existing records are sent with baseline.version and the copied project values. New records use a different request shape because there is no accepted server revision yet. This local snapshot is important even when a fieldset is disabled during saving: it makes the intended request explicit and avoids treating mutable editor state as a promise about what was submitted.

On success, adoptProject replaces the selected record and draft with the server row and clears the dirty flag. That is the acceptance boundary in the UI. It also respects server transformations such as trimming. If the server accepted a name with surrounding whitespace removed, the editor should display the accepted name rather than continue showing a local spelling that no longer matches stored data.

## A conflict is a decision point

Imagine Alice and Bruno both load project version seven. Alice changes the description and saves, producing version eight. Bruno changes the name while retaining version seven. The repository's conditional update does not accept Bruno's write against the newer row. It returns a conflict after confirming that the resource is still visible in the current organization.

The page's run wrapper sets an error and leaves the unsaved values available when the request fails. That preserves Bruno's work. It does not automatically merge his name with Alice's description. Automatic merging would require a field-level comparison with a known common baseline and a policy for overlapping edits. This implementation instead gives the user export and load-current actions. Those actions are simple enough to explain and review, but the user still has to make an informed reconciliation decision.

Loading current values asks for confirmation because it replaces the editor. Exporting a draft records organization, object identity, baseline version, and proposed values. Those fields are useful evidence for manual recovery. A draft file is not a write authorization token, and this page does not provide an import endpoint that blindly accepts it. If an import feature were added, it would have to revalidate scope, syntax, and revision expectations.

## Saving and refreshing can fail at different times

The success path adopts the server row and sets a notice before awaiting query invalidation. That ordering means the mutation may be accepted even if subsequent refresh work fails. The generic run catch appends wording about unsaved editor values remaining available. In this particular schedule, the draft has already been adopted and its dirty flag cleared. The lesson is not to assume that every caught exception means the mutation was rejected.

Draw a boundary between mutation result handling and cache refresh. The actual code places both inside one asynchronous work function. A future improvement could preserve an accepted-mutation notice while separately reporting that list refresh failed. Before proposing such a change, write a test that resolves the save response and then rejects the refresh promise. Assert what the editor contains, which version is shown, and what the message claims. This exercise targets a concrete sequencing issue rather than merely asking whether an error banner appears.

The same reasoning applies to a timeout before any response is read. The browser cannot know from a transport exception alone whether the database accepted the update. For an existing versioned update, reloading current state gives evidence. Blindly resubmitting with a freshly substituted version would discard the user's original review boundary and could overwrite someone else's work. A recovery flow should compare the intended change with current accepted data before making another write.

## Build a useful review artifact

Create a timeline with columns for browser baseline, browser draft, database version, request payload, and visible message. Use four rows for initial load, local edit, competing acceptance, and failed save. Then add two alternative recovery branches: export before loading current values, and deliberate discard. The timeline should show that a retained draft can be valuable even when it is no longer directly saveable.

For a component test, control the response promises rather than relying on arbitrary delays. Resolve the initial fetch, edit a field, reject the save with a conflict, and inspect the input value. A separate test should resolve the save with normalized server data. These tests examine behavior a user can observe and protect against accidentally clearing work in a catch or finally block. A repository unit test can inspect version predicates, but it does not substitute for these browser-state assertions.

### Exercises

**MT07 A.** Write the exact state sequence for Alice's successful description edit and Bruno's conflicting name edit. Identify which version Bruno should retain in an exported draft and why replacing it automatically with eight would misrepresent what he reviewed.

**MT07 B.** Design the controlled-promise test for a successful save followed by failed invalidation. State the accepted record, expected dirty state, and potential message ambiguity without claiming the scenario has already been executed.

**MT07 C.** Propose a manual reconciliation screen using the original baseline, local draft, and current server row. Explain how it should handle changes to different fields and changes to the same field. Keep the proposal distinct from the current implementation.
