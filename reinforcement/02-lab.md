# Isolated lab: Parse a synthetic project-list query without accidental coercion

This is a small executable model, deliberately separate from the application. It uses Node's built-in test runner and has no package install, service, database, network call, or paid API dependency. It is JavaScript so you can focus on behavior first; the transfer task connects it back to this repository's JS/TS code.

## Contract

Implement `parseListQuery(input)` returning exactly `{q, page, pageSize}`.

- Input must be a non-null object and not an array. Unknown fields are ignored in this model; they never become trusted identity.
- Absent `q` becomes `''`. Present q must be a string, trimmed, with at most 80 characters after trimming.
- Absent page/pageSize become 1/20. Present values must be strings of ASCII decimal digits only, and convert to safe integers. Leading zeros are accepted.
- page is 1–10000 inclusive; pageSize is 1–100 inclusive. Reject empty strings, arrays, numeric values, fractions, signs, whitespace around numbers, and suffixes.
- Invalid input throws `TypeError`. Never mutate the input.

These exact ranges and coercion choices belong to this lab. Compare them with `listInput` before proposing any change to the real API.

## Work sequence

1. Read `lab/contract-check.mjs`. Predict the output of two cases on paper before editing anything.
2. Run the command below. The checked-in starter throws `Not implemented`; this first failure is intentional.
3. Implement only `lab/exercise.mjs`. Keep the tests unchanged until the supplied contract passes.
4. Add one test from your own boundary case. Explain which plausible wrong implementation it rejects.
5. Change one line of your implementation to a plausible mistake and show a test turns red. Undo only that experimental change.
6. Write down the distinction between this pure model and the real app boundary. Continue to [transfer](03-transfer.md).

From this pack's directory:

```powershell
node --test lab/contract-check.mjs
```

Or from the repository root, use `reinforcement/lab/contract-check.mjs` in that command.
Node 22.16.0 was available during authoring; no dependencies are needed for these `.mjs` files.

## Debugging prompts

- If `1x` passes, did you parse only a prefix?
- If an empty value becomes zero, did a conversion happen before validation?
- If a numeric value passes, did you forget this contract models raw URL strings?
- If an unknown organization ID reaches the output, did you accidentally spread untrusted input?

## Completion evidence

Record the input, expected result, actual result, and the first place they diverge. A passing test with an assertion deleted does not count. Leave the app's source untouched while solving this lab.

After your attempt, compare [the reasoning guide](_answers/GUIDE.md). The separate reference implementation is checked with:

```powershell
node lab/contract-check.mjs --reference
```

That command exercises the answer, not your solution. It is for comparison after the attempt and for validating the teaching material.
