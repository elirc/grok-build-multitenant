# Transfer workbook: Grok multitenant project

Complete one variation per short session. Write your first answer without an agent or answer key, then revise it after checking source or running a small experiment. For each variation, supply a concrete input, predicted result, invariant, and test boundary. A paragraph repeating a general principle does not complete the exercise.

## Variation 1: Privileged wrong tenant

An OWNER for organization A tries to update B. Explain why the role cannot override the scope boundary. Write a negative case that is not accidentally rejected because the record ID is nonexistent.

## Variation 2: Member task write

A MEMBER can perform a specific task operation but cannot rename a project. Trace both paths and show why a blanket admin-only write middleware would change the product contract.

## Variation 3: Same-value update

Two clients save the same text from the same revision. The lab advances on the first and conflicts on the second. Argue for or against no-op detection and identify its effect on audit history and revisions.

## Variation 4: Missing versus forbidden

A resource belongs to a different organization. Decide whether the API should expose missing or forbidden under the existing convention. Explain what information is revealed by each choice.

## Variation 5: Deleted while editing

A project is removed after the editor loads. Distinguish missing from stale and decide whether the UI retains the draft for copying. Specify an assertion on visible recovery behavior.

## Variation 6: Mock that always accepts

A repository mock returns success for every expectedVersion. Identify which tests remain useful and which claims become invalid. Design the smallest real-database regression that fills the gap.

## Review without an answer key

Choose two variations and exchange them with a reviewer, or ask an agent to challenge only your assumptions. Require a counterexample, not a rewritten solution. Record the strongest objection, whether you accepted it, and the evidence that settled it. Keep disagreements about product policy separate from disagreements about code behavior.

## Retrieval schedule and score

Tomorrow, reproduce one transition or boundary table from memory. In seven days, write an edge test without reading the reference. In three weeks, transfer the idea to a different project and identify the assumption that changes.

Score 0–2 each for source tracing, lab A, lab B, application evidence, and explanation. A 2 requires your own counterexample and supporting observation; a 1 means a correct explanation without independent evidence; a 0 means missing or incorrect. Target 8/10, but leave application work pending if you did not run it. Scores describe this exercise, not a professional seniority level.

Record: date; commit/worktree context; original prediction; observation; revised rule; verification still pending; next repetition date. Human mastery is **not assessed** until you provide this evidence.
