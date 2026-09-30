# Tests that reject a plausible wrong implementation

## Scenario: a permission test passes for the wrong reason

An API test expects 403 for a MEMBER editing a project, but its fixture uses a project from another organization. The route may be rejecting only the organization mismatch. Add an in-organization project case to prove the role rule, then add an ADMIN case in the wrong organization to prove scope is independent of privilege.

## Scenario: both stale writes say success

Clients A and B both read version 3. A changes the name; B changes the description. A mock repository simply returns whatever object it is given, so both service tests pass. Write a sequential model test first, then specify a real concurrent database test in which both requests carry expectedVersion 3. The expected outcome is one accepted update and one conflict, not two successful writes.

Inspect whether the actual update predicate includes organization, identity, and expected version. Record the returned affected-row count and how it maps to the public response. Avoid declaring a regression solely from the mock behavior; read the real repository and reproduce at the storage boundary.

## Investigation method

Start with two competing hypotheses. For each, predict an observation that would be different if it were true. Inspect the smallest relevant boundary before editing. Preserve the original failing input and record whether you observed a symptom, reproduced a mechanism, or merely reasoned about it.

Build three layers of evidence: a pure contract case; the real module or adapter with controlled dependencies; and one user-visible or database-visible outcome. State explicitly which layers you ran. Avoid replacing the boundary under investigation with a mock that already assumes the desired answer.

For timing cases, control a clock or promise rather than sleeping. For data cases, include at least two organizations or two independent entities where relevant. For mutation cases, assert both the returned outcome and unchanged unrelated state. Include a negative test that would reject the tempting shortcut named in the scenario.

After the first passing fix, introduce one small wrong variation in your own lab solution, run the relevant check, and revert only that variation. Keep the failing assertion as evidence that the test can detect the mechanism. Do not seed defects in the application's main working tree.

Write a short handoff: symptom; reproduction input; confirmed cause or remaining hypotheses; smallest change; tests actually run; remaining integration risk. A reviewer should be able to resume without reading your entire chat history.
