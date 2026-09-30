# 3. Explain one accepted edit under competition

The update methods in [projectRepository.ts](../../backend/src/repositories/projectRepository.ts) place expected version and ownership directly in updateMany. This is stronger than reading a version, comparing it in application code and later updating by ID alone. Your learning goal is to explain the accepted write and the follow-up error classification without attributing guarantees to an unexecuted database test.

## The mutation predicate

For a project update, the predicate includes ID, organization ID and expected version. The data includes the parsed project values and a version increment. A single matching row is the accepted result. Any other count triggers a scoped read to distinguish absence from a version conflict.

Use a project P in Cedar at version four with name Old. Two editors both loaded version four. Editor A requests name Alpha; editor B requests name Beta. A valid serialized outcome accepts one update, producing version five, while the other expected-four predicate matches no row. The rejected editor must not overwrite the winner merely because its network response arrives later.

The source expresses the conditional predicate, but a real PostgreSQL concurrency test is the evidence for the configured provider's behavior. A mock that returns count one for A and zero for B verifies error-path handling, not database isolation. Keep the two layers separate in a report.

## Zero matches is not one universal error

After a zero-match update, projectIn searches by ID and organization. If no row exists in that scope, it throws not found. If a row does exist, the repository throws the version-conflict error. The lookup intentionally does not search globally to tell the caller that the ID belongs to another organization.

Create four fixtures: existing same-organization row with stale version, absent row, foreign-organization row, and existing row with matching version. The expected categories are conflict, not found, not found and success. A fixture with an invalid identifier is separate because validation can reject before these repository decisions.

Error precedence can change under concurrent deletion. A zero-match mutation followed by a scoped read describes the state observed by that follow-up query. Do not claim that its classification proves every detail of the resource's state at initial request arrival. A precise account says which statement produced the observation.

## The returned version

After a successful update, the repository writes an audit event with expected plus one and returns a fresh scoped read inside the transaction. The audit version names the accepted mutation. The client should use the returned record as its next editing baseline rather than assuming a local timestamp supplies the same concurrency token.

Accepted full-object replacement and browser draft preservation solve different problems. The database prevents stale overwrite, while the UI must help the rejected user recover their intended text. A response code alone does not preserve a draft if the client resets the form in a finally block or refetches over it. Later lessons inspect that client boundary directly.

## Same-value edits

The repository increments version for an accepted update even when supplied values equal the current values. The conditional write does not contain an equality early return. This means version represents accepted mutation steps rather than only visibly different content.

A proposed optimization that suppresses no-op versions changes audit and retry semantics. An exact repeated command may still carry an old expected version after the first acceptance. Treating identical state as evidence that the same command succeeded is unsafe when another actor could have produced that state. Command receipt identity and resource version answer different questions.

## Version exhaustion

The request schema accepts versions through 2,147,483,646, and an accepted increment can produce 2,147,483,647. Subsequent ordinary update envelopes cannot supply that stored value under the current schema. This is a boundary case, not a claim that normal workloads will reach it soon.

Build a characterization fixture at the upper accepted value and a proposed lifecycle policy for exhaustion. Options include a wider database type, a new token representation or explicit administrative migration. A policy must preserve stale-client rejection across the transition. Resetting version to one without another epoch can make an ancient token meaningful again.

## Controlled test design

A useful integration schedule starts two transactions with the same observed version and releases their writes together. Inspect final row values, returned versions, error categories and audit rows. Do not merely assert that one promise rejected; it might have rejected due to a fixture error, connection timeout or invalid input.

Record the exact outcome family allowed by the contract. Either Alpha or Beta may win unless the harness imposes an order. The final row and audit must agree with the accepted operation. A test should not assume task creation order determines lock acquisition order.

## Exercises

MT03-A: build the four-fixture error table and identify the predicate and follow-up query behind each result.

MT03-B: design a two-editor schedule with an independent final-state oracle. Include audit count and version, and state what a mock-only test would fail to prove.

MT03-C: explain a same-value accepted update and the maximum-version boundary. Propose a version migration with a counterexample that an unsafe reset would admit.

[Course index](README.md) · [Foundation answers](answers/01-foundations.md)
