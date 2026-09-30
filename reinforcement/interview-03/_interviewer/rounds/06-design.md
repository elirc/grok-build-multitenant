# Interviewer notes: Grok multitenant project / Junior system-design and data-model interview

Keep this file closed during a first attempt. Accept behaviorally correct alternatives that satisfy the declared contract. Source-grounded explanations and honest limitations matter more than matching these words. Return to the [candidate round](../../rounds/06-design.md) to run a new attempt.

## How to evaluate this round

For a junior interview, a clear single-service design can be stronger than a large distributed diagram. The candidate should connect every component to a requirement and show where the authoritative decision occurs. Ask which part is needed now and which is a future response to measured pressure.

Evaluate the data model through the fixture. Can the proposed identity distinguish scopes, retries, and revisions where required? Does a uniqueness constraint or conditional update enforce the invariant at the actual write boundary? A sequence of independent reads and writes does not become atomic because it appears in one function. Conversely, do not require distributed coordination when one existing transaction is sufficient.

Walk the failure window explicitly. If an external effect can occur before local confirmation, ask how an unknown result is reconciled. If a derived read model is temporarily stale, ask what the UI communicates and how it eventually learns the authoritative result. A queue can decouple work but adds delivery, retry, and ownership questions; naming it does not answer them.

For scale, require arithmetic with labeled assumptions and units. A candidate may estimate requests per second or retained records, but should not present invented numbers as observed project performance. Observability should include the signal's writer and the action it confirms. Junior success is a coherent small design, an explicit tradeoff, and a failure story that preserves the case invariant.

## 03.6.1 — Organization identity comes from a request

### Expected project reasoning

**Invariant:** Requested organization identity is not automatically authorized tenant context.

Resolve membership and trusted scope before reading the project. Trace the existing tenant middleware and repository predicate. An authenticated caller can still be unauthorized for this organization.

**Plausible wrong approach:** Use the submitted org ID directly because the user is logged in.

Use the exact starting fixture from [the candidate round](../../rounds/06-design.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.


---

## 03.6.2 — An old capability remains in the browser

### Expected project reasoning

**Invariant:** Mutation authorization must use the server’s current trusted policy.

Reject the disallowed write and update the UI with an understandable response. Client capabilities improve presentation but cannot be the final authority. State the consistency assumption for how role changes become visible.

**Plausible wrong approach:** Trust a role string sent back with the form.

Use the exact starting fixture from [the candidate round](../../rounds/06-design.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.


---

## 03.6.3 — Two editors save the same revision

### Expected project reasoning

**Invariant:** A conditional write must compare the expected revision at the write boundary.

Exactly one revision4 write succeeds under the stated model; the other gets a conflict and a reconciliation path. A read-then-write sequence without atomic enforcement still races.

**Plausible wrong approach:** Check the revision with a SELECT and later issue an unconditional UPDATE.

Use the exact starting fixture from [the candidate round](../../rounds/06-design.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.


---

## 03.6.4 — An ID exists in another organization

### Expected project reasoning

**Invariant:** A valid identifier does not bypass the scope predicate.

Return the application’s chosen inaccessible-resource result and leave orgB unchanged. Test with two organizations so an unscoped query cannot pass by accident. Separate response policy from the invariant of no unauthorized access.

**Plausible wrong approach:** Test only the organization that owns every seeded project.

Use the exact starting fixture from [the candidate round](../../rounds/06-design.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.


---

## 03.6.5 — Unknown fields reach a generic update

### Expected project reasoning

**Invariant:** A public patch must permit only explicitly writable fields.

Validate and construct the accepted patch shape. Reject or explicitly ignore unknown keys according to the real schema policy; do not spread the input into a repository update.

**Plausible wrong approach:** Assume a typed frontend makes a generic server spread safe.

Use the exact starting fixture from [the candidate round](../../rounds/06-design.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.


---

## 03.6.6 — Permissions have an explicit revocation

### Expected project reasoning

**Invariant:** Explicit deny wins under this exercise’s stated policy.

Compute the effective set from known capabilities and apply the revocation. Unknown roles and actions fail closed. Explain that this synthetic precedence must be compared with the actual policy before adoption.

**Plausible wrong approach:** Union every permission set and forget that a deny has different meaning.

Use the exact starting fixture from [the candidate round](../../rounds/06-design.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.
