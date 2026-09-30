# Decision record and worked design journal

## ADR: the boundary chosen for this case

**Status:** proposed teaching decision, not an approved application migration.

**Context:** A member lists projects for an authorized organization, opens a draft, saves against an expected version, and receives either the updated record or an explicit conflict while the draft remains recoverable.

**Required invariant:** Every read and write is restricted to trusted tenant scope, and a stale expected version cannot silently replace a newer accepted project change.

**Decision:** Keep tenant context, capability checks, and scoped repository predicates as explicit layers in the existing application.

**Alternative considered:** Use a database per tenant with the same trusted identity and version checks. It provides stronger operational isolation and per-tenant restore options, but multiplies migrations, connection management, and fleet administration. Prefer it when contractual isolation or noisy-neighbor requirements justify those costs.

**Pitfall to reject:** Trust a frontend role or organization field, or scatter all authorization into ad hoc UI conditions.

**Cost accepted:** The same scope must be carried through service and repository contracts, and integration fixtures need more than one organization to reject accidental global queries.

**Revisit trigger:** Revisit tenant placement only after measured resource isolation or operational requirements appear; retain authorization checks even if tenants move to separate storage.

An alternative can become appropriate under a different workload or requirement. The purpose of the record is to make that change legible. A trigger should refer to measured contention, an operating requirement, a query/evaluation result, or a clear product constraint—not a preference for a more fashionable architecture.

## Worked journal: a fictional design-learning entry

The following paragraph is a teaching narrative, not a claim about the user's work or a new production incident.

My first diagram had one box called auth. Reading the update predicate showed why that box hid too much: deciding the caller belongs to an organization and constraining the actual write are separate obligations. I also noticed the existing code already uses a version predicate, so my task changed from inventing optimistic concurrency to explaining and stress-testing the current boundary. A source observation is useful, but I still need a competing-transaction test before calling the concurrency behavior newly verified.

My next step would be to turn the strongest claim into a falsifiable example. I would state the initial values, put the competing action or failure at a specific boundary, and identify what must remain unchanged. If the source already implements the desired mechanism, I would characterize that behavior and preserve its evidence rather than propose a replacement just to make the exercise look larger.

I would also separate three levels of confidence: the diagram appears coherent, the code contains a relevant mechanism, and an executed test demonstrates the claimed outcome. Each is useful, but they are not interchangeable. The capacity worksheet supplies another kind of evidence: arithmetic under explicit assumptions. It does not fill in a missing benchmark or prove a service meets a latency objective.

## Write your own decision journal

Record the first design you considered, the concrete counterexample that changed it, and the simpler boundary you can now explain. Include one downside of the chosen design. Then change a requirement—higher contention, stricter freshness, a second process, revoked access, or an unavailable dependency—and explain whether the decision still holds.

Keep the actual source observation next to any claim about existing behavior. Label proposed APIs and schemas as proposed. If you later discuss this in an interview, distinguish reading, modeling, implementation, and runtime verification, and identify the artifacts you personally produced.
