# Reference reasoning: Grok multitenant project

Attempt the [design interview](../06-interview-lab.md) first. This is one defensible direction, not a unique correct architecture or a production patch.

## The core answer

Keep tenant context, capability checks, and scoped repository predicates as explicit layers in the existing application. The invariant remains: **Every read and write is restricted to trusted tenant scope, and a stale expected version cannot silently replace a newer accepted project change.**

Begin with the existing vertical path rather than replacing it with a generic SaaS diagram. Tenant context resolves the organization the caller is allowed to act in; the service checks the operation's capability; the repository still includes scope in its query. These are complementary responsibilities. A correct membership lookup does not repair an unscoped repository query.

The current versioned update already demonstrates a useful conditional-write boundary. Explain why the comparison belongs in the update predicate and why a separate read followed by an unconditional write would race. The audit belongs to the same transaction so an accepted update and its audit do not disagree after a failure.

For list reads, the inspected code obtains items and total in one repeatable-read transaction. That provides a particular within-request read contract; it does not freeze the dataset across several page requests. If pagination becomes unstable or expensive at deep offsets, propose a cursor using the complete ordering tuple and explicitly define behavior under intervening changes.

Keep a shared relational database as the initial design unless concrete isolation, operations, or scale constraints require separation. A tenant-oriented partitioning proposal must explain cross-tenant administration, migration, unique-key scope, backups, and noisy-neighbor controls. It is not an automatic improvement over correct predicates and bounded queries.

## The failure answer must name the boundary

Use two real tenants and two competing transactions for the focused integration plan. Assert the accepted version, rejected stale outcome, audit consistency, and untouched other-tenant record. Do not substitute a mock that always returns correctly scoped data. Characterize existing behavior before proposing a code change.

Reject an explanation that replaces this with a technology name. A queue does not by itself decide ownership, a transaction does not automatically include an external effect, and a cache key does not enforce authorization. Ask the learner to put the failure between two concrete steps and show the accepted, rejected, and unchanged state.

## Capacity and tradeoff answer

The first likely questions are query shape, deep-page cost, connection usage, and a hot tenant, not immediate database sharding. The logical payload estimate excludes indexes, task fanout, audit overhead beyond the chosen row size, and backups. Measure one large tenant separately from aggregate averages so a benign overall rate does not hide skew.

The accepted cost is: The same scope must be carried through service and repository contracts, and integration fixtures need more than one organization to reject accidental global queries. The revisit trigger is: Revisit tenant placement only after measured resource isolation or operational requirements appear; retain authorization checks even if tenants move to separate storage.

Accept alternatives that meet the same clarified contract and expose their costs. Do not reward unnecessary components or a fabricated production traffic number. The strongest follow-up asks what requirement would make this answer wrong and how the candidate would detect that change.

## What counts as completion

The learner can explain one happy path, one competing or failed path, the authoritative data identity, and one calculation with units. They can name the difference between inspected source and proposed design. An application guarantee still needs the corresponding runtime evidence. Historical tests remain historical; no new application verification is implied by reading these notes.
