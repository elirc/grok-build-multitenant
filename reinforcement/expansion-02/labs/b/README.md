# Lab B: Compare-and-update with an allowlisted patch

Practice the public outcomes of a stale-write boundary before testing its database implementation.

## Exact teaching contract

Export `update(rows,{id,expectedVersion,patch})`. Rows are validated unique records with id,version,name,description. Patch is an object whose own keys may only be name and description, both strings; any other key or non-string value throws TypeError before lookup. Missing ID returns `{status:'missing',rows}`. Wrong version returns `{status:'conflict',rows}`. Otherwise apply the patch, increment version even for an empty patch, and return `{status:'updated',rows:newRows}`. Preserve unrelated identities and never mutate inputs. This synchronous model does not establish real database atomicity.

## Work the examples before the implementation

Start version 3, apply two updates both expecting 3, and predict the second result. Repeat with an empty patch and with a forbidden version field inside patch.

Read `check.mjs`, write expected results for two cases, and then run it. The starter deliberately throws `Not implemented`. Implement `exercise.mjs` yourself and keep the supplied assertions unchanged. Add one test for an edge that is not already asserted, then demonstrate a plausible wrong implementation fails it.

From this lab directory:

```powershell
node --test check.mjs
```

The file is explicitly named `check.mjs` rather than a test/spec filename so conventional app test discovery does not collect an unfinished teaching exercise. There is no npm install, database, network, paid model, or payment call. These are small JavaScript models; types and application integration are separate practice tasks.

## Connect the model to the application

Trace repo.update and its storage predicate. Require a database test for concurrent same-revision requests; a model or always-successful repository mock is insufficient.

Record what is simplified: input validation already assumed, event ordering promised by the caller, a missing persistence layer, or an injected clock. A passing model is useful only when you can name the guarantee the real app still needs.

After your own attempt, read [the reasoning guide](../../_answers/GUIDE.md). The separate reference is checked with:

```powershell
node check.mjs --reference
```

This second command verifies the author's answer, not your solution. If your solution differs but meets every stated contract, compare invariants and failure cases instead of matching lines. Save the failing output, corrected output, your extra assertion, and a short explanation of why the correction is sufficient for this model.
