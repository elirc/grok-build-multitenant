# Interviewer notes: Grok multitenant project / TypeScript, schemas, and public contracts

Keep this file closed during a first attempt. Accept behaviorally correct alternatives that satisfy the declared contract. Source-grounded explanations and honest limitations matter more than matching these words. Return to the [candidate round](../../rounds/03-typescript.md) to run a new attempt.

## How to evaluate this round

Look for a clear distinction between compile-time reasoning and runtime trust. A cast changes what the checker assumes; it does not inspect a payload. The candidate should name the validator or construction boundary and explain why downstream functions may rely on its output. Not every internal helper needs to validate the same data again if the ownership and preconditions are explicit.

Ask the candidate to enumerate the legal outcome combinations. A discriminant should let the consumer handle the variant's required data without a chain of unrelated optional checks. In a TypeScript sketch, an exhaustive branch can expose a newly added variant during compilation; the candidate should still explain how an older deployed client handles an unfamiliar server value at runtime.

For optional values, insist on concrete examples rather than slogans. A missing patch field can mean preserve, null can mean clear, and zero can be a valid number, but the actual endpoint decides those meanings. Reject accidental policies introduced by truthiness or a generic object spread. Ask whether validation should reject unknown keys or strip them, and require that choice to be visible in tests.

Finish with a migration question: can a stored record or an older client still cross this boundary? Accept a narrowly scoped fallback with an old fixture. Do not reward a schema rewrite that silently changes behavior for existing callers. Junior success is an explainable contract with representative runtime examples, not the most elaborate generic type.

## 03.3.1 — Organization identity comes from a request

### Expected project reasoning

**Invariant:** Requested organization identity is not automatically authorized tenant context.

Resolve membership and trusted scope before reading the project. Trace the existing tenant middleware and repository predicate. An authenticated caller can still be unauthorized for this organization.

**Plausible wrong approach:** Use the submitted org ID directly because the user is logged in.

Use the exact starting fixture from [the candidate round](../../rounds/03-typescript.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.


---

## 03.3.2 — An old capability remains in the browser

### Expected project reasoning

**Invariant:** Mutation authorization must use the server’s current trusted policy.

Reject the disallowed write and update the UI with an understandable response. Client capabilities improve presentation but cannot be the final authority. State the consistency assumption for how role changes become visible.

**Plausible wrong approach:** Trust a role string sent back with the form.

Use the exact starting fixture from [the candidate round](../../rounds/03-typescript.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.


---

## 03.3.3 — Two editors save the same revision

### Expected project reasoning

**Invariant:** A conditional write must compare the expected revision at the write boundary.

Exactly one revision4 write succeeds under the stated model; the other gets a conflict and a reconciliation path. A read-then-write sequence without atomic enforcement still races.

**Plausible wrong approach:** Check the revision with a SELECT and later issue an unconditional UPDATE.

Use the exact starting fixture from [the candidate round](../../rounds/03-typescript.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.


---

## 03.3.4 — An ID exists in another organization

### Expected project reasoning

**Invariant:** A valid identifier does not bypass the scope predicate.

Return the application’s chosen inaccessible-resource result and leave orgB unchanged. Test with two organizations so an unscoped query cannot pass by accident. Separate response policy from the invariant of no unauthorized access.

**Plausible wrong approach:** Test only the organization that owns every seeded project.

Use the exact starting fixture from [the candidate round](../../rounds/03-typescript.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.


---

## 03.3.5 — Unknown fields reach a generic update

### Expected project reasoning

**Invariant:** A public patch must permit only explicitly writable fields.

Validate and construct the accepted patch shape. Reject or explicitly ignore unknown keys according to the real schema policy; do not spread the input into a repository update.

**Plausible wrong approach:** Assume a typed frontend makes a generic server spread safe.

Use the exact starting fixture from [the candidate round](../../rounds/03-typescript.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.


---

## 03.3.6 — Permissions have an explicit revocation

### Expected project reasoning

**Invariant:** Explicit deny wins under this exercise’s stated policy.

Compute the effective set from known capabilities and apply the revocation. Unknown roles and actions fail closed. Explain that this synthetic precedence must be compared with the actual policy before adoption.

**Plausible wrong approach:** Union every permission set and forget that a deny has different meaning.

Use the exact starting fixture from [the candidate round](../../rounds/03-typescript.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.
