# Project stories (STAR skeletons). Finish them *after* doing the work

Fill in the bracketed parts with what **you** observed: real test names, real numbers. An interviewer can tell a story you lived
from one you read. `dfableandopus/02-STORIES-AND-RESUME.md` already has a "trusted header → membership" story; these
cover different ground.

## 1. Legacy rescue: "What did the rewrite actually fix?" (review.LEGACY_DIFF_REVIEW)
- **S:** An AI-generated SaaS starter whose README, comments and UI copy all said "strictly isolated", plus an uncommitted rewrite.
- **T:** Tell the lead, with evidence, what was fixed, what was missed, and whether it could take a paying tenant.
- **A:** [How you found the untracked files `git diff` hid; the frontend/backend `orgId` contract mismatch; the tautological tests.]
- **R:** [Your verdict and the three required changes; which "missed" items were silent vs acknowledged.]

## 2. Incident: a new relation that the database happily accepted (INC-001)
- **S:** A task-assignee feature shipped with green CI. A customer saw a stranger's name on their task.
- **T:** Find the blast radius, fix it, and make the DB refuse it next time.
- **A:** [Two-column blast-radius query; compound FK to `OrganizationMember(userId, organizationId)`; repair-then-constrain migration; `Restrict` vs `SET NULL` decision.]
- **R:** [Regression test that bypasses the repository; what member revocation does now.]

## 3. Incident: raw SQL outside the tenant middleware (INC-002)
- **S:** A dashboard N+1 fix added a raw `GROUP BY` endpoint. A contractor read another tenant's project names.
- **T:** Contain it, explain why the PR's own isolation test passed, and propose defense in depth.
- **A:** [Log correlation of 403 → 200; mount fix; hostile-caller test; the RLS design: non-superuser role, `set_config(..., true)`, FORCE.]
- **R:** [What RLS would and wouldn't have prevented. Be precise; interviewers probe this.]

## 4. Trade-off: where should tenant isolation live? (review H1/H2)
- **S/T:** App-level `where organizationId` everywhere vs a scoped client vs Postgres RLS.
- **A:** [Your ranking and why you'd keep all three layers; the pooled-connection `SET` trap you saw in the probe.]
- **R:** [What it costs: migrations as owner, seed changes, test resets that silently delete 0 rows.]
