# Progressive practice: extend the contract without weakening it

Part A needs only Node 22: copy a few lines of real source into a scratch file outside the repo and check them with `node --test`. Part B changes the application and is checked with `npm run test:api` from the root (PostgreSQL helper). For Part B, begin each exercise with a design note and acceptance criteria, and preserve organization scoping, role policy, captured versions, transactional audits, and rejected drafts. Read [solution reasoning](06-SOLUTIONS-AND-REVIEW.md) after your first attempt.

## Part A: runnable drills (no install, no database)

Start a scratch file such as `../scratch/tenant.test.mjs` with `import test from "node:test";` and `import assert from "node:assert/strict";`.

### Exercise 1: read the login throttle as a state machine

**Goal:** predict exactly when sign-in returns 429.

Copy the throttle part of the login handler (`backend/src/middleware/auth.ts:77` for the map, lines 82-98 for the logic) into `makeLimiter()` returning `attempt(ip, now)`, with `now` passed in instead of `Date.now()`. Return `429` where the handler throws and `"checked"` where it would go on to compare passwords. Assert: 20 attempts from one IP pass and the 21st is 429; the same IP passes again at `now = 15 * 60 * 1000`; after 1000 distinct IPs have one attempt each, a *new* IP gets 429 while a tracked one still passes.

**Check:** `node --test ../scratch/tenant.test.mjs` passes. Then answer from the code: does a successful login count toward the 20 (yes: `entry.count++` at line 97 runs before the password is checked and is never reset), and what does the 1000-entry cap mean for a legitimate user arriving while an attacker controls many addresses?

### Exercise 2: literal search and the role gate

**Goal:** confirm two small policies by computation.

Copy `literal` (`backend/src/repositories/projectRepository.ts:17-18`) and assert that `literal("100%_done")` equals `"100\\%\\_done"`. Copy the role list from `requireManager` (`backend/src/middleware/tenantContext.ts:50-56`) into `isManager(role)` and assert `OWNER` and `ADMIN` are true and `MEMBER` false.

**Check:** the test passes. Then find the three services that do *not* call `requireManager` (`createTask`, `updateTask`, and `deleteTask` in `backend/src/services/projectService.ts:65-97`) and confirm that matches the error message "Members can manage tasks."

### Exercise 3: extend the version lab with project deletion

**Goal:** model the delete rules next to the existing update schedules.

Copy `astraupskill/extended-course/labs/version-schedules.mjs` to your scratch folder and run it once (`assertions: 18`). Add a `remove(store, { organizationId, expected })` that mirrors `remove` in `projectRepository.ts:122-147`: a foreign organization is not found, a stale version conflicts, a project that still has tasks is refused, and an accepted delete writes one audit entry. Add assertions for each outcome, checking stale before tasks as the real code does (lines 137-142).

**Check:** your copy prints `"passed":true` with `assertions` equal to 18 plus the number you added (23 with five new checks).

## Part B: application changes (PostgreSQL helper required)

### Exercise 4: add task due dates

**Goal:** an optional calendar date on tasks, end to end.

Choose one representation for absence, validate actual dates, and add a forward migration. Include the field in create, update, responses, editor exports, and the list display. Changing only the input element would leave the feature incomplete.

**Check:** a valid leap day round-trips; an impossible date returns 400 before any write; an existing row stays readable with no invented due date; a stale editor cannot replace a newly saved date (409, value unchanged). See the worked solution in 06.

### Exercise 5: add a project progress summary

**Goal:** counts of tasks per status for one project.

Decide whether counts describe all tasks or the filtered list, and show that scope in the UI. Use a grouped query scoped by organization and project; if counts and rows promise one snapshot, compute them in the same read transaction, as `listTasks` already does (`projectRepository.ts:148-183`).

**Check:** create, status change, and deletion change the counts; a failed refresh does not turn an accepted save into an error; requesting the summary for another organization's project id returns 404.

### Exercise 6: add durable create idempotency

**Goal:** a retried project or task create returns the same record instead of a duplicate.

Generate a request key once per new draft. Store a normalized payload fingerprint and the accepted id with the create and audit, scoped to user, organization, and operation. A working example of the pattern is `checkout` in `backend/src/repositories/orderRepository.ts` of the grok-build-ecommerce repository (advisory lock, fingerprint, receipt, replay-or-409); read it after your own attempt.

**Check:** identical retries return the same id; a changed payload under the same key is 409; two concurrent identical requests create one row; reusing the key in another organization cannot reveal the first organization's result.

### Exercise 7: add membership administration

**Goal:** invitations and role changes without a privilege leak.

Decide which roles may grant which privileges and how to prevent removal of the final owner. Enforce it in the API and the transaction, not only the controls.

**Check:** a member cannot promote themselves; a changed `x-org-id` cannot modify another organization's membership; two concurrent owner removals cannot leave zero owners (one 200, one 409).

### Exercise 8: add an outbox for notifications

**Goal:** record notification intent atomically with a task change and deliver it separately through a fake adapter.

**Check:** an adapter failure leaves retryable work; a restarted worker resumes it; a repeated attempt follows your documented deduplication rule; the intent keeps its organization id. Write down the remaining crash window between external delivery and recording completion.

For every Part B exercise, include one adversarial test involving tenant selection or competing requests.
