# Contracts, data ownership, and consistency

The tables are **proposed design contracts** for the worked case. They are not migration files, verified production schemas, or a claim that these exact endpoint paths exist. Compare them with the [source map](README.md) before any implementation.

## Data model

| Entity | Identity / candidate key | Important fields | Owner or purpose |
|---|---|---|---|
| OrganizationMembership | (organization_id, user_id) | role/capabilities, active_state | Trusted context input |
| Project | (organization_id, project_id) | name, description, version, created_at | Conditionally updated authoritative record |
| Task | (organization_id, project_id, task_id) | status, version, project relationship | Tenant/project relationship must remain valid |
| AuditEvent | event_id | organization_id, actor_id, resource_id, action, version | Committed explanation of accepted changes |

Distinguish entity identity from operation identity. A record can receive many commands; a retry of one command should not automatically become a new intent. Include scope where it changes meaning. A globally unique-looking ID still needs authorization, and an opaque identifier should not be normalized as if it were human search text.

## Public API examples

| Illustrative endpoint | Input boundary | Accepted outcome | Other outcomes |
|---|---|---|---|
| GET /organizations/{org}/projects | Requested org resolved to trusted scope; query/page | 200 items and within-request count | 403/404 policy for inaccessible scope |
| PATCH /projects/{id} | expectedVersion and accepted fields | 200 current saved version | 409 stale version; 404 absent within scope; validation error for forbidden fields |
| DELETE /projects/{id} | expectedVersion and trusted capability | 200 deleted identity under dependency policy | 409 stale record or remaining tasks; no implicit cross-project deletion |

For one write, add literal examples of omitted, explicit null, zero, wrong-type, stale, and unauthorized input where meaningful. Do not collapse them with a truthiness default. Return an outcome that lets the UI distinguish rejection, accepted-but-not-yet-observed work, and an uncertain response. A timeout does not prove the effect rolled back.

## Query and constraint review

Review the actual ordered predicates before proposing (organization_id, created_at, id). Composite relationships should prevent a task from referring to a project in another tenant. These are review targets: inspect the schema and query plan before claiming a proposed index or constraint is already present.

Write the actual predicate and order before proposing an index. Compare the read improvement with write/storage cost and use representative data when examining a plan. A complete cursor must match the complete order; a cursor alone does not freeze a changing dataset across requests. An index improves access to data, while a constraint or conditional transition enforces a different kind of rule.

## Consistency worksheet

Fill four rows for the design: authoritative mutation, immediate read after that mutation, another user's projection, and asynchronous notification/progress. For each, state the source of truth, acceptable staleness, and recovery action. Do not label the entire system strongly or eventually consistent without naming which operation the statement concerns.

The invariant to protect is **Every read and write is restricted to trusted tenant scope, and a stale expected version cannot silently replace a newer accepted project change.**. Identify the exact write predicate, transaction, or durable identity that enforces it. If the rule spans several records, explain why concurrent operations cannot each pass an earlier check and then commit an invalid combination. A transaction boundary and an isolation choice must be examined together.

## Compatibility, retention, and deletion

When adding a field or outcome, describe what an older client or stored object does. A safe proposal can expand readers first, backfill deliberately, and later require the new writer contract; the exact sequence depends on the repository. Do not call a schema sketch a completed migration.

Choose retention separately for authoritative records, command receipts, work intents, audit history, private source material, and cache entries. Expiring a receipt too early can change retry behavior. Keeping every private payload forever can create unnecessary exposure and operating cost. Record the product decision and recovery consequence rather than inventing a universal retention period.
