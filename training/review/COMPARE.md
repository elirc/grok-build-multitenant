# Compare: my findings vs the model review

Fill this in after reading `training/_answers/review.md` (and `_answers/legacy-diff-review.md` for the diff drill).

| # | Model finding (id + one line) | Did I find it? (yes / partly / no) | If partly or no: what I looked at instead |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| … | | | |

Findings I had that the model didn't (defend or retract each one):

-

## Pattern behind my misses

Circle the ones that apply and add evidence:

- I trusted a comment, README line or test name instead of the mechanism
- I reviewed only the files that changed (the `git diff` blind spot for untracked files)
- I checked the app layer and never asked what the database enforces
- I didn't ask "what does the *next* engineer's code get for free?"
- I ignored operability (logs, error mapping, what on-call can see)
- I ignored the tests' ability to fail

One habit I will use on the next review:

>
