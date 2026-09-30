# Failure and recovery: Grok multitenant project

This is a tabletop and integration-planning lab. It introduces no deliberate application defects and does not run infrastructure.

## Worked timeline

| Event or failure point | Authoritative/durable state | User or worker consequence |
|---|---|---|
| Editors A and B load revision4 | Both hold independent local drafts | No lock is implied by opening the editor |
| A conditionally updates revision4 | Record and audit commit at5 | A sees success |
| B submits expected4 | Predicate changes no eligible row | B sees conflict, draft preserved |
| B loads the current record and reconciles | New intent can target revision5 | No automatic overwrite of A |
| A cross-tenant ID is supplied | Scoped lookup remains empty/inaccessible | Other tenant remains unchanged |

The invariant across the timeline is **Every read and write is restricted to trusted tenant scope, and a stale expected version cannot silently replace a newer accepted project change.**. Mark which transitions are atomic, which are observations, and which can be delivered again. A repeated message and a repeated effect are not the same thing. Selection, claiming, execution, committing, and acknowledging should remain separate words until the actual implementation proves they share a boundary.

## Focused proof plan

Use two real tenants and two competing transactions for the focused integration plan. Assert the accepted version, rejected stale outcome, audit consistency, and untouched other-tenant record. Do not substitute a mock that always returns correctly scoped data. Characterize existing behavior before proposing a code change.

Preserve the fixture and initial state. Inject one failure at a named point, inspect all relevant effects, then recover using the same logical identity when the contract requires it. A test that only checks an exception can miss leaked durable changes. A test that mocks the critical repository may assume the property it was intended to establish.

## Three additional disturbances

**Dependency unavailable:** choose the dependency this design actually needs. Specify whether the operation fails, queues durably, serves a permitted stale read, or continues in a reduced mode. Define a bound on fallback work so recovery does not overload the next dependency.

**Duplicate or reordered input:** reuse an operation/event identity and vary delivery order. Explain which replays are harmless, which conflicting payloads must be rejected, and which outcomes require reconciliation. Do not promise exactly-once transport when the guarantee is really one durable effect per accepted identity.

**Old worker or client resumes:** let an earlier owner finish after scope, revision, session, or lease ownership changes. Identify the check at application/commit time that prevents obsolete work from taking ownership. Cancellation at launch is not enough to explain this case.

## Recovery and observability

Track scoped query latency, conflict outcomes, authorization denials by bounded reason, and audit write failures. Avoid high-cardinality user IDs as metric labels; use scoped structured logs with an appropriate access policy when an individual investigation needs identity.

Set a hypothetical recovery objective for the authoritative dataset and a separate one for rebuildable projections. State the allowable data-loss window (RPO) and time to useful restored service (RTO), then describe a restore rehearsal that could measure them. Do not claim those objectives are achieved merely because a backup command exists.

After a restore, decide how outstanding receipts, delayed events, and external effects reconcile with the restored state. A database restored to an earlier point can forget a previously accepted operation while an external effect still exists. The recovery plan needs that case, not only row counts after restoring a file.

## Handoff artifact

Write one page containing the failure trigger, expected durable state, exact identity used on retry, distinguishing observation, recovery action, and remaining uncertainty. A teammate should be able to tell whether your evidence comes from source reading, a pure model, a database exercise, or an external integration. Human learning and runtime guarantees remain separate assessments.
