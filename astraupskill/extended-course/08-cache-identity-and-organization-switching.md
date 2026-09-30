# 08. Cache identity and organization switching

[Course index](README.md) · [Worked review](answers/02-browser-boundaries.md)

Sources: [application session state](../../frontend/src/App.tsx), [project queries](../../frontend/src/features/projects/pages/ProjectsPage.tsx), and [request scope](../../frontend/src/api/client.ts). This chapter treats cached data as a scoped observation, not as a generic list that can be reused whenever its URL looks similar.

## A query key describes the meaning of a result

The project page prefixes query keys with user ID and organization ID. Project-list keys then include the resource name, search value, and page. Task-list keys also include project identity, task search, status, and task page. These dimensions are not decoration. Changing any one of them can change which rows the result means. A cache collision occurs when two different questions are represented by the same key.

Consider a user who belongs to North and South organizations. Both organizations have a project called Launch. A project-list cache keyed only by the word projects and the search Launch could return North's observed result while the UI says South. The backend may still enforce organization scope perfectly on every network request; the browser can nevertheless present a misleading old observation if it reuses the wrong cache entry. Tenant isolation therefore has a presentation component as well as a server authority component.

The user prefix matters even when organization IDs are globally unique. Different accounts may have different authority, and signing out should terminate the previous account's local browsing context. The application clears the query client after login and on sign-out. The prefix and clearing operation serve related purposes: one prevents accidental key collisions; the other discards the previous session's retained observations. Neither replaces authentication or membership checks on the server.

## Component identity is another boundary

ProjectsPage is keyed by user ID and organization ID. Switching organizations therefore creates a fresh instance for the new scope rather than retaining the old selected project and draft state inside the same component instance. This is an intentional use of component identity. Without it, every scope-sensitive state field would need a carefully maintained reset path, including selected project, selected task, searches, pagination, dirty flags, and notices.

The application checks a guard before changing organization. Busy work prevents leaving. Dirty work asks for confirmation, with an export reminder. The project page reports guard state upward through an effect. This makes navigation a cooperation between the page that knows about drafts and the parent that controls organization selection. It does not make navigation impossible under every browser lifecycle event, which is why the page also registers a beforeunload warning.

The alive reference prevents an unmounted page from applying late results to its old component state. It does not cancel the server operation. An organization switch that is normally blocked during a mutation is still worth testing through unmount schedules, because tests and future routing changes can expose paths that normal controls currently avoid. The correct claim is that the page checks liveness before selected state updates; a stronger claim about all network activity would need separate evidence.

## Invalidation should match the affected scope

After an accepted mutation, refresh invalidates queries under the user-and-organization prefix. That can refresh project lists, task lists, and audit observations belonging to the active workspace. Invalidating only the currently visible list would be narrower, but it might leave another relevant observation stale. Invalidating every user's data would be broader than necessary. The chosen prefix expresses a practical consistency boundary for this small application.

This does not mean every query result becomes fresh at the exact same instant. Invalidation schedules query work; network calls complete independently. During refresh, a list may still display previously loaded data with an error or fetching state. The page explicitly acknowledges previously loaded project records when a project query errors. Learners should distinguish a retained observation from a newly confirmed one when explaining the UI.

The application disables automatic query retries and refetch-on-window-focus globally. Those settings affect when observations are refreshed and how many requests occur after failure. They do not change the backend version rules. A user can still explicitly refresh lists or load current editor values. A design review should connect these settings to the intended interaction, especially when discussing why switching back to a tab does not automatically replace what the user was reading.

## Test meaning, not the spelling of a key

A unit assertion that a key contains five array elements is weak. A meaningful test seeds North and South with visibly different records, changes the selected organization, and verifies that North's project does not appear under South's heading. Another test signs out and signs in as a different account, then verifies that old cached records are not presented as the new account's work. A focused query-key test can still be useful, but it should represent a real collision the key must prevent.

For task queries, hold project identity constant while changing status, then hold status constant while changing project. This separates two cache dimensions. For pagination, use enough records that page two differs from page one. Avoid fixtures where every result is empty: they can make a broken cache appear correct because both questions happen to have the same answer.

### Exercises

**MT08 A.** Remove organization ID from a hypothetical project-list key and construct the smallest two-organization example that exposes the collision. Explain why a secure backend does not make the browser presentation correct.

**MT08 B.** List the state that a component remount resets during organization switching. Identify one piece of state that would be especially dangerous to retain and describe a behavior-level assertion for it.

**MT08 C.** Compare invalidating the current project-list key, the active organization prefix, and the entire cache. Choose one for a task creation and justify the affected observations. State the current implementation separately from your tradeoff analysis.
