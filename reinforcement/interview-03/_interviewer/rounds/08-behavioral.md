# Interviewer notes: Grok multitenant project / Project explanation and behavioral interview

Keep this file closed during a first attempt. Accept behaviorally correct alternatives that satisfy the declared contract. Source-grounded explanations and honest limitations matter more than matching these words. Return to the [candidate round](../../rounds/08-behavioral.md) to run a new attempt.

## How to evaluate this round

Evaluate ownership and reasoning, not polish alone. The candidate should distinguish reading existing code, completing a teaching lab, writing a proposed test, and verifying an application change. Those are all useful activities, but they support different claims. Ask which exact artifact demonstrates the candidate's own work.

A good explanation connects the technical choice to a user consequence. It names one invariant, one rejected alternative, and one observation that supports the decision. It does not spend most of the time listing libraries. When discussing a mistake, the candidate can describe an incorrect prediction from a real practice exercise and how a counterexample changed it; an invented production incident is unnecessary.

For disagreement, ask how the candidate would separate a product-policy question from a code-correctness question. The response should invite a concrete example or acceptance criterion rather than appeal to seniority or a tool's output. For uncertainty, a bounded verification plan is better than pretending an unrun integration check passed.

Score the answer on specificity, ownership accuracy, tradeoff reasoning, evidence, and reflection. Do not award a strong score merely for using a familiar story framework. Junior success is an honest, understandable explanation that survives two follow-up questions. End by asking what assumption would make the chosen approach wrong; the candidate should be able to revise the plan without abandoning the invariant or inflating the evidence.

## 03.8.1 — Organization identity comes from a request

### Expected project reasoning

**Invariant:** Requested organization identity is not automatically authorized tenant context.

Resolve membership and trusted scope before reading the project. Trace the existing tenant middleware and repository predicate. An authenticated caller can still be unauthorized for this organization.

**Plausible wrong approach:** Use the submitted org ID directly because the user is logged in.

Use the exact starting fixture from [the candidate round](../../rounds/08-behavioral.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.


---

## 03.8.2 — An old capability remains in the browser

### Expected project reasoning

**Invariant:** Mutation authorization must use the server’s current trusted policy.

Reject the disallowed write and update the UI with an understandable response. Client capabilities improve presentation but cannot be the final authority. State the consistency assumption for how role changes become visible.

**Plausible wrong approach:** Trust a role string sent back with the form.

Use the exact starting fixture from [the candidate round](../../rounds/08-behavioral.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.


---

## 03.8.3 — Two editors save the same revision

### Expected project reasoning

**Invariant:** A conditional write must compare the expected revision at the write boundary.

Exactly one revision4 write succeeds under the stated model; the other gets a conflict and a reconciliation path. A read-then-write sequence without atomic enforcement still races.

**Plausible wrong approach:** Check the revision with a SELECT and later issue an unconditional UPDATE.

Use the exact starting fixture from [the candidate round](../../rounds/08-behavioral.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.


---

## 03.8.4 — An ID exists in another organization

### Expected project reasoning

**Invariant:** A valid identifier does not bypass the scope predicate.

Return the application’s chosen inaccessible-resource result and leave orgB unchanged. Test with two organizations so an unscoped query cannot pass by accident. Separate response policy from the invariant of no unauthorized access.

**Plausible wrong approach:** Test only the organization that owns every seeded project.

Use the exact starting fixture from [the candidate round](../../rounds/08-behavioral.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.


---

## 03.8.5 — Unknown fields reach a generic update

### Expected project reasoning

**Invariant:** A public patch must permit only explicitly writable fields.

Validate and construct the accepted patch shape. Reject or explicitly ignore unknown keys according to the real schema policy; do not spread the input into a repository update.

**Plausible wrong approach:** Assume a typed frontend makes a generic server spread safe.

Use the exact starting fixture from [the candidate round](../../rounds/08-behavioral.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.


---

## 03.8.6 — Permissions have an explicit revocation

### Expected project reasoning

**Invariant:** Explicit deny wins under this exercise’s stated policy.

Compute the effective set from known capabilities and apply the revocation. Unknown roles and actions fail closed. Explain that this synthetic precedence must be compared with the actual policy before adoption.

**Plausible wrong approach:** Union every permission set and forget that a deny has different meaning.

Use the exact starting fixture from [the candidate round](../../rounds/08-behavioral.md). Require the candidate to predict its outcome before discussing an abstract pattern. If they propose a different product policy, ask them to state it explicitly and show how the acceptance examples change; do not confuse a policy disagreement with a JavaScript error.

### Follow-up and calibration

Ask which responsibility belongs to tenant context, service authorization, and repository predicate and which belongs to the organization project list and editor. Then remove one assumption the candidate relied on: validated input, stable identity, one caller, one process, or unchanged scope. Require an updated example, not a new collection of buzzwords.

Award 0 for an unsupported or incorrect answer, 1 for a correct explanation without a discriminating example, and 2 for a correct mechanism plus a counterexample and an appropriately scoped observation. Record separate scores for mechanism, contract, verification, and communication. Do not score an unrun browser or database check as observed evidence. The notes provide a reasoning direction, not a memorization script or a substitute for inspecting the repository.
