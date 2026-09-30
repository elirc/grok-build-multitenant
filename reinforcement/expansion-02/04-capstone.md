# A bounded application change

## Story: explain and prevent stale project overwrites

Keep the existing trusted tenant middleware and schema boundaries. Add or characterize a project-edit flow that submits the revision the user actually saw. A conflict should preserve the local draft and offer a reload/compare decision rather than automatically retrying against a newer revision.

Acceptance table: authorized owner/admin update succeeds; member project update is rejected; a member's permitted task operation still works under the actual policy; another organization's resource cannot be changed; a stale expected version conflicts; unrelated records remain unchanged; malformed version input is rejected before repository execution.

Do not fold authorization into a frontend button check. Use a role/action unit matrix plus HTTP wiring checks, and a real persistence check for the stale-write predicate. If the application already meets these cases, add the missing evidence and a source trace instead of replacing it with the teaching functions.

Exclude a new role system and a tenant-schema migration. The focused deliverable is a reviewable editor/API contract, clear recovery behavior, and proof that the existing permissions and compare-and-update boundary remain intact.

## Delivery contract

Produce a one-page proposal, an acceptance table, a focused practice diff, and a verification note. If the relevant code already behaves correctly, deliver the missing regression or characterization evidence instead of rewriting it. If setup is blocked, deliver the proposed diff and precise reproduction plan with runtime status pending; do not mark the capstone implemented.

Before accepting an agent's patch, explain the smallest failing example yourself. Limit its allowed files, name an excluded adjacent feature, and ask it to list assumptions. Review the whole diff, including removed assertions and changed defaults. Your final explanation must distinguish the application's existing guarantees from the new teaching model's choices.

Completion requires a before/after example visible at the right boundary, one unrelated behavior preserved, and one limitation stated plainly. “All tests pass” is not sufficient if the relevant case was never in the suite. End with a 90-second explanation aimed at a teammate who did not see these exercises.
