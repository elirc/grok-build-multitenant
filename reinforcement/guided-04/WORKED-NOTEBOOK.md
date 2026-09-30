# Runnable worked notebook: Compose a known capability set with denials

This notebook adds three solved examples around the existing `effectiveCapabilities` teaching reference. It preserves the earlier unfinished starter. Reading or running these solved examples is study, not an independent completion of that exercise.

## Contract and owner

Inputs are validated arrays of string tokens. Known capabilities are read, write, and admin. Return a new array of distinct known grants that are not in denies, in code-unit alphabetical order. Ignore unknown tokens; explicit denials win. Case is significant and no wildcard exists. Empty grants returns empty. Do not mutate inputs. This is a synthetic policy-composition helper; it does not authenticate, resolve membership, or authorize a database query.

The [original coding exercise](../interview-03/coding/README.md) contains the complete practice workflow. The [reference source](../interview-03/_interviewer/reference.mjs) is deliberately separate from the starter. The new runner imports that reference and checks the literal expected values printed below; it does not call the live application.

## A slow walk through the main example

Begin with grants read, write, admin, and root. The known vocabulary excludes root. The deny set removes write and admin from the remaining known grants. Only read survives. This arithmetic does not tell us who supplied the grants or whether the current request belongs to the organization; those remain trusted-context questions.

**The distinction to retain:** A correct set calculation cannot turn an untrusted list from a browser into server authority.

Before looking at code, draw the state after each meaningful step. If the operation maintains an index or a set, write what enters it and what its key means. If it makes a transition decision, write the branch order and the first branch that accepts or rejects the input. These two ways of tracing make hidden assumptions more visible than jumping straight from input to final output.

Do not change the expected result merely to match an implementation. When there is a disagreement, return to the written contract. Decide whether the input violates a stated precondition, the expectation misreads a policy, or the implementation fails the rule. Each possibility leads to different corrective work.

## Example 1: Unknown grant and explicit denials

Arguments, in parameter order:

```json
[
  [
    "read",
    "write",
    "admin",
    "root"
  ],
  [
    "write",
    "admin"
  ]
]
```

Expected returned value:

```json
[
  "read"
]
```

Read the arguments before the result. Identify the entity identity, meaningful order, and boundary values. Then compare every result field, including preserved values and empty collections. A partial assertion can miss the exact distinction the example was chosen to expose.


## Example 2: Case remains significant

Arguments, in parameter order:

```json
[
  [
    "READ",
    "read",
    "read"
  ],
  [
    "READ"
  ]
]
```

Expected returned value:

```json
[
  "read"
]
```

Read the arguments before the result. Identify the entity identity, meaningful order, and boundary values. Then compare every result field, including preserved values and empty collections. A partial assertion can miss the exact distinction the example was chosen to expose.


## Example 3: An empty grant set stays empty

Arguments, in parameter order:

```json
[
  [],
  [
    "read"
  ]
]
```

Expected returned value:

```json
[]
```

Read the arguments before the result. Identify the entity identity, meaningful order, and boundary values. Then compare every result field, including preserved values and empty collections. A partial assertion can miss the exact distinction the example was chosen to expose.

## Run the worked examples

From this guided block's `examples` directory:

```powershell
node --test check.mjs
```

Three named checks compare complete returned values and confirm that the supplied argument values remain unchanged. The runner freezes input structures recursively, so accidental mutation is also exposed in these fixtures. It uses Node's built-in test and assertion modules and needs no install, server, database, account, or network call.

The reference function is imported from the preceding interview block. If you move this folder independently, preserve that relative relationship or update the import deliberately. The source link and import target are included in the local navigation checks. This runner does not alter or mark your earlier starter as solved.

## Read the implementation after the trace

This is set difference after intersection with a known capability set. With g grants and d denials, expected set operations cost O(g+d); sorting at most three capabilities is bounded in this contract. If the known vocabulary becomes dynamic, state its sorting cost separately. The significant interview discussion is where these arrays came from and whether the final operation rechecks current scope. A mathematically correct set helper cannot turn untrusted browser grants into authority.

Now connect the explanation to actual lines in the reference. Mark input validation or assumed preconditions, identity construction, the main decision, output construction, and preservation of caller-owned state. Not every helper has every category. If a category is absent because the contract delegates it to the caller, write that rather than imagining hidden validation.

Compare the first example with each variation. Identify the changed dimension before looking at the new result. The empty or boundary case is not an afterthought: it reveals what the function means when ordinary work is absent or when a threshold is exactly reached. A deterministic tie or scope check can be decisive even when most fields look identical.

## From solved reading to independent practice

Close the reference and reconstruct the main decision in a separate practice file. Keep your first attempt, including its mistakes. Add a fourth fixture that rejects a plausible wrong implementation. Write the expected result before execution and explain why it follows from the contract.

If your code differs from the reference, compare behavior rather than spelling. Another loop, data structure, or decomposition can be valid. State its time and space costs and its effect on clarity. Do not add a framework or dependency merely to make the exercise look more advanced.

## Connect the model back to Grok multitenant project

The project boundary to inspect is tenant context, service authorization, and repository predicate. The model can explain a policy while omitting authorization, persistence, browser interaction, or concurrent execution. Locate the real caller and name the missing guarantee before proposing an application change.

An accurate learning journal can say that the three solved examples ran and matched their expected values. It cannot turn that result into a claim that the application was built, deployed, browser-tested, or verified against an external provider. Record your own source trace and integration evidence separately when you perform them.

## Explain it without the code

Use this speaking sequence: the user wants __; the input identifies __; the function preserves __; the surprising branch is __; the result is __; the real application still needs __. Then have a listener change one input. If you can predict the changed result and identify the decisive step, you have evidence of understanding beyond recognizing the reference.
