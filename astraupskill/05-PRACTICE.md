# Progressive practice: extend the contract without weakening it

Use a dedicated practice database and fictional accounts. Begin each exercise with a design note and acceptance criteria. Preserve organization scoping, role policy, captured versions, transactional audits, and rejected drafts. Read [solution reasoning](06-SOLUTIONS-AND-REVIEW.md) after your first implementation attempt.

## 1. Add task due dates

Add an optional calendar date to tasks. Choose one representation for absence, validate actual dates, and introduce a forward migration for existing task rows. Include the field in create, update, responses, editor exports, and the list display. Acceptance: a valid leap day round-trips; an impossible date fails before mutation; an old row remains readable with no invented due date; a stale editor cannot replace a newly saved date. Explain why changing only the input element would leave the feature incomplete.

## 2. Add a project progress summary

Display counts of tasks in each status. Define whether counts describe all tasks or the currently filtered list, and make that scope visible. Use a grouped query scoped by organization and project. If the count and rows promise a single snapshot, compute them in the same read transaction. Acceptance: create, status change, and deletion update counts; a failed refresh does not turn an accepted save into an error; a caller cannot request another tenant's summary by guessing a project ID.

## 3. Add durable create idempotency

A working implementation of exactly this exercise exists in the sibling course: `grokbuildecommerceproject/backend/src/repositories/orderRepository.ts` (the `checkout` function, from the `pg_advisory_xact_lock` line): per-caller advisory lock, request fingerprint, durable receipt row, replay-or-409. Read it after you have attempted your own.

Generate a request key once for a new project or task draft. Store a normalized payload fingerprint and accepted identity transactionally with the create and audit. Scope the key to the authenticated user, organization, and operation. Acceptance: identical retries return the same identity; a changed payload conflicts; concurrent identical requests create one record; reusing a key in another tenant cannot reveal the first tenant's result. Define behavior after later edits and deletion before choosing receipt retention rules.

## 4. Add membership administration

Design invitation and role-change operations. Decide which roles may grant which privileges and how to prevent removal of the final owner. Apply authorization in the API and database transaction, not only the controls. Acceptance: a member cannot promote themselves; changing the selected tenant cannot modify another organization's membership; concurrent owner removals cannot leave zero owners. Start with local fictional identities and an invitation state machine before connecting real email delivery.

## 5. Add an outbox for notifications

Store a notification intent in the same transaction as a meaningful task change. Process it separately with a fake delivery adapter. Acceptance: an adapter failure leaves retryable work; the worker can restart; a repeated attempt follows an explicit deduplication contract; tenant information stays attached to the intent. Explain the remaining crash window between external delivery and recording completion. An outbox by itself does not make arbitrary external effects exactly once.

For every exercise, deliver a small patch, example requests, a migration or compatibility note, and evidence for both success and failure. Include one adversarial test involving tenant selection or competing requests. Mid-level work is demonstrated by clearly justified behavior when assumptions fail, not by expanding the feature list without revisiting existing guarantees.
