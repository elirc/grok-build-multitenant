# Coding reasoning: Compose capability grants and explicit denials

Attempt the [candidate challenge](../coding/README.md) first. The [reference implementation](reference.mjs) is one valid solution to the written contract, not a recommended production replacement.

This is set difference after intersection with a known capability set. With g grants and d denials, expected set operations cost O(g+d); sorting at most three capabilities is bounded in this contract. If the known vocabulary becomes dynamic, state its sorting cost separately. The significant interview discussion is where these arrays came from and whether the final operation rechecks current scope. A mathematically correct set helper cannot turn untrusted browser grants into authority.

## Review the mechanism

Have the candidate annotate the branch that enforces each relevant rule: identity, ordering, rejection, preservation, and output construction. Then change one input while keeping the contract valid. They should predict the result before executing the code. If two implementations differ only in style while producing the same required behavior, discuss readability rather than inventing a correctness defect.

## Strengthen the test evidence

The seven supplied cases check representative positive, boundary, and preservation behavior. Ask for an additional case and the wrong implementation it would detect. Avoid a test that simply copies the implementation's intermediate variables into an assertion. Prefer a public input/output example or an unchanged-input observation.

## Connect to this project

The actual boundary is tenant context, service authorization, and repository predicate. The model omits infrastructure and may choose fields or policy that differ from the application. Ask the candidate to locate the real caller and explain which validation, authorization, transaction, or UI behavior remains outside this helper. A useful answer can conclude that the application already has the behavior and only characterization evidence is needed.

The reference passing is author verification. The learner must still demonstrate an independent solution, a counterexample, and an explanation of the evidence limits. Mark a copied implementation as studied rather than independently solved.
