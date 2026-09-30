# 03. Grok multitenant project: system design

**Design case:** Design tenant-safe project writes and predictable list reads.

This track adds a focused system-design route to the [existing reinforcement pack](../README.md), [interview practice](../interview-03/README.md), and [worked learning material](../guided-04/README.md). It preserves them all. Start with one user journey, one hard invariant, and one failure timeline; then justify each component you add.

## Study route

| Step | Material | Artifact to produce |
|---|---|---|
| 1 | [Worked architecture](01-worked-design.md) | Explain authority and every arrow |
| 2 | [API and data contracts](02-contracts-data.md) | Request examples, keys, consistency rules |
| 3 | [Failure and recovery lab](03-failure-recovery.md) | Crash/race trace and proof plan |
| 4 | [Capacity and scaling](04-capacity.md) | Reproduce arithmetic and challenge assumptions |
| 5 | [Decision record and journal](05-design-decisions.md) | Defend one choice and a revisit trigger |
| 6 | [Timed interview](06-interview-lab.md) | A coherent forty-five-minute design |
| Review | [Separate reference notes](_answers/REFERENCE.md) | Compare guarantees, not diagram size |

The [shared design guide](<../../../opusorganize/junior-reinforcement/system-design-05/DESIGN-METHOD.md>) covers requirements, consistency, ownership, caches, queues, storage, recovery, and communication. The [all-project route](<../../../opusorganize/junior-reinforcement/system-design-05/README.md>) gives the progression across all ten cases.

## What the inspected source establishes

The repository predicates project/task reads by organization. Its update uses id, organizationId, and expected version in updateMany, increments the version, and writes an audit inside a transaction. List items and count are read in a RepeatableRead transaction with page size20. These observations are source traces, not a new concurrency test run.

- [backend/src/middleware/tenantContext.ts](<../../backend/src/middleware/tenantContext.ts>)
- [backend/src/repositories/projectRepository.ts](<../../backend/src/repositories/projectRepository.ts>)
- [backend/src/services/projectService.ts](<../../backend/src/services/projectService.ts>)

Everything labeled proposed, design contract, target architecture, exercise load, or journal is teaching material. Diagrams show a worked design, not an assertion that every depicted component is deployed. API paths, fields, and storage keys below are illustrative contracts unless the source observation explicitly says otherwise. No migration or application implementation is performed by this track.

**Invariant to defend:** Every read and write is restricted to trusted tenant scope, and a stale expected version cannot silently replace a newer accepted project change.

Human mastery remains unassessed. A correct capacity calculation or a source trace does not establish production throughput or complete a learner's design defense.
