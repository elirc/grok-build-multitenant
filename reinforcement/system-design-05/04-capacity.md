# Capacity, bottlenecks, and growth decisions

All numbers here are **hypothetical exercise inputs**, not observed traffic, a benchmark, a production capacity claim, or a vendor quote. Units and boundaries are part of the calculation. The [machine-readable worksheet](capacity.json) is checked by the shared offline calculator.

| Question | Assumptions | Calculation | Worked result |
|---|---|---|---|
| Illustrative scoped list reads | active=600, readsPerMinute=6 | active × readsPerMinute / 60 | 60 requests/s |
| Project mutation exercise | active=600, writesPerHour=12 | active × writesPerHour / 3600 | 2 writes/s |
| Thirty-day logical change payload at sustained 2 writes/s | writesPerSecond=2, bytesPerWrite=1200, days=30 | writesPerSecond × bytesPerWrite × 86400 × days / 1,000,000,000 | 6.2208 decimal GB |

## What these results imply—and what they do not

The first likely questions are query shape, deep-page cost, connection usage, and a hot tenant, not immediate database sharding. The logical payload estimate excludes indexes, task fanout, audit overhead beyond the chosen row size, and backups. Measure one large tenant separately from aggregate averages so a benign overall rate does not hide skew.

**Illustrative scoped list reads:** Counts the stated active population at the stated rate; not daily active users automatically acting simultaneously.

**Project mutation exercise:** Averaging over an hour can conceal bursts and hot records. The load distribution is a separate assumption.

**Thirty-day logical change payload at sustained 2 writes/s:** Decimal payload GB only. This deliberately excludes indexes, replicas, backups, compression, object media, and unmodeled fanout.

## A second pass: remove the comfortable assumption

Choose the busiest tenant, world, route, event, or job represented by this design. Concentrate a substantial fraction of traffic there while leaving the aggregate rate unchanged. Explain whether the bottleneck becomes one row, one ordered stream, one subscription fanout, or a downstream quota. Aggregate averages can conceal that skew.

Now consider a cold cache, a worker restart, or a provider slowdown, whichever is relevant. Recalculate the request or drain rate using the same units. For a queue, if service capacity is equal to or below ongoing arrivals, an initial backlog has no positive drain rate under the model. Returning zero seconds would be a false result; the worksheet calculator uses null for that condition.

## Choose an intervention with a falsifiable trigger

Start with bounded queries, connection/concurrency budgets, and the actual dominant cost. Add caching only for eligible representations. Add workers only when downstream capacity and the ordering/ownership contract permit parallelism. Add a separate read projection or index only with an update, replay, and deletion story.

If proposing partitioning, name the partition key and the operations that cross it. If proposing replicas, identify reads allowed to be stale and the read-after-write behavior. If proposing admission control, explain the user outcome and fairness policy. These choices should preserve the invariant rather than merely move overloaded work out of view.

## Run the arithmetic checks

From the central system-design folder:

```powershell
node --test tools/check-capacity.mjs
```

The checks compare thirty hand-specified worksheet results and additional calculator boundary cases. They validate arithmetic and model preconditions only. They do not measure this application's performance. Keep load-test plans and actual measured evidence separate from these worked numbers.
