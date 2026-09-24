# Legacy-rescue review: the Grok starter vs the hardened rewrite

**Time box:** 90 min · **Sealed answer:** `training/_answers/legacy-diff-review.md`
**Skills:** reviewing AI output, legacy rescue, and saying clearly what a "fix" actually fixed.

## Situation

You inherit this repo. Commit `41a9785` (the only application commit on `main`; later commits add just `training/`) is the original AI-generated starter, a multi-tenant SaaS demo that
its own README calls "strictly isolated". Someone later rewrote it by hand. That rewrite was **never committed**: it lives in
the working tree, and a verbatim copy is on the branch `training/base/working-tree-snapshot`. Your lead asks:

> "Before we build on this, tell me in one page what the rewrite actually fixed, what it missed, and whether any of the old
> starter's habits came back in the new code. I don't want adjectives. Give me files and mechanisms."

## How to get the diff (this is part of the exercise)

```powershell
git -C . diff --stat HEAD                          # modified tracked files only
git -C . status --short                            # note the ?? lines
git diff --stat 41a9785 training/base/working-tree-snapshot   # the whole rewrite, new files included
git show 41a9785:backend/src/middleware/tenantContext.ts
```

Before you start, answer this in one line: which of the first two commands would have made you miss `backend/src/app.ts`,
`backend/src/middleware/auth.ts` and the migration, and why?

## Deliverable (write it in `training/review/my-legacy-diff.md`)

1. **Fixed.** At least 10 concrete defects in the starter that the rewrite removed. For each, give the starter file, the defect in
   one line, the rewrite's mechanism, and the test that now proves it (or "no test").
   Include at least one **frontend↔backend contract** defect, where both halves looked fine alone but could never work together.
2. **Claims vs reality in the starter.** List every place where the starter *says* it isolates tenants, including comments,
   README, UI copy and tests, and give the line that shows it doesn't.
3. **Missed.** At least 5 things the rewrite did not fix or only documented. Rank them by production risk. Mark which ones are
   *acknowledged* in `README.md` or `astraupskill/VERIFICATION.md` and which are *silent*.
4. **Regressions of habit.** Find at least one pattern the rewrite removed from the starter's tests and then reintroduced
   in a new test file.
5. **Verdict.** Answer "safe to put a paying tenant on?" as yes or no, with the three changes you'd require first.

Don't open `astraupskill/` or `dfableandopus/` before step 3. They contain partial answers.
