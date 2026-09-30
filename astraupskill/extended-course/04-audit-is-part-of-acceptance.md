# 4. Treat audit persistence as part of the command

Tenant Workspace writes audit events inside repository transactions. Read the audit helper and its call sites in [projectRepository.ts](../../backend/src/repositories/projectRepository.ts), then inspect [the schema](../../backend/prisma/schema.prisma). This chapter distinguishes an accepted database change with retained metadata from console logging, external notification and a complete historical event stream.

## What the event records

An audit row includes organization, actor, resource type, resource ID, action and version. The schema also supplies an event identity and creation timestamp. The helper receives the transaction client, so a create, update or delete calls the audit insert within the same transaction callback as the resource mutation.

Write a concrete create trace. Ada creates project P in Cedar. The project row receives its initial version. The audit row records PROJECT, P, CREATE and that version under Cedar and Ada. If the audit insert fails, the transaction should not accept the resource change as though auditing were optional. An actual rollback test is needed to establish that behavior against the configured database; the source placement identifies the intended boundary.

For an update from version four, the event records version five. For deletion at expected version four, the event records expected plus one even though no version-five resource row remains. That deletion version is retained command metadata, not a readable current project revision. The report or UI should not present it as proof that a version-five row still exists.

## Metadata survives resource deletion

AuditEvent stores identifiers as scalar fields and has no relation that cascades from Project or Task in the inspected schema. The schema comment explicitly describes retained metadata. This permits history records to remain after deletion. It also means referential existence is not enforced through a project foreign key on every historical row.

That is a tradeoff to explain rather than an automatic defect. A historical event may legitimately refer to a deleted resource. A malformed event written through an unintended path could also refer to something that never existed. The trusted write boundary and validation of event construction matter because a database relation is not carrying that entire responsibility.

## History is bounded

The history method scopes by organization, resource type and resource ID, orders by descending timestamp and descending event ID, and takes thirty rows. It does not first require that the live resource still exists. That supports viewing retained history, but a returned list is the newest bounded slice rather than the complete lifetime of a busy record.

Create a synthetic resource with thirty-five accepted events. Predict which rows appear under a unique timestamp fixture. Then create tied timestamps and use event ID ordering to define a deterministic expected slice. A chart that labels the returned array total changes would undercount unless the API supplies a separate complete count or pagination contract.

The history endpoint's authority still depends on the current caller context and routing. The repository's organization predicate is one component. Do not infer a public anonymous audit API from the existence of a repository function.

## Audit and outbox are different

An audit row describes an accepted internal change. An outbox intent would describe work that should be delivered elsewhere, with delivery identity, attempts and outcome. The current AuditEvent model does not by itself implement a worker, acknowledgment protocol or exactly-once external effect.

If a future task-change notification is required, design an outbox record in the same acceptance transaction and process it separately. Keep the audit event as historical explanation and the outbox as a delivery obligation. They may share a cause identity, but their lifecycles differ: an audit should remain stable while an outbox attempt can move through pending, attempted, delivered or unresolved states.

## Repeated commands and audit duplication

The current create path does not accept a durable request key in the shown schema. Repeating a create can therefore represent another accepted command and another audit event. The update path uses expected version, which prevents blindly replaying the old version after acceptance, but it does not return a durable command receipt that identifies the original response.

A proposed idempotent create design should store resource creation, audit and receipt together. Exact replay should recover the prior command without writing another successful-change audit. Conflicting reuse of the same request key should not silently overwrite the accepted payload. The later capstone develops this proposal explicitly.

## Failure experiments

Design a transaction test that injects audit failure after a successful resource mutation statement. After the transaction ends, inspect both tables through a new context. A mocked transaction that invokes the callback without rollback cannot establish durable all-or-nothing behavior. It can still help verify that the audit call receives the correct fields and that errors propagate.

Also design a lost-response case after commit. The database may contain both resource and audit even though the client reports a network error. That is different from the rollback fixture. A reliable incident note names which phase was last confirmed before recommending retry or recovery.

## Exercises

MT04-A: create expected audit rows for project create, update and delete, including version interpretation.

MT04-B: calculate the newest-thirty history slice for thirty-five events and explain how a deleted resource can still have visible history.

MT04-C: compare rollback after audit failure with response loss after commit. Specify independent observations and safe next actions for both cases.

[Course index](README.md) · [Foundation answers](answers/01-foundations.md)
