# Training (B06 DRILL): tenant isolation enforced in the database

This folder is apprenticeship material. The app code itself is untouched.
**About the base:** `main` (41a9785) is far behind the working tree. The incidents therefore branch from
`training/base/working-tree-snapshot` (06d0205), a copy of the **uncommitted working tree** (tracked plus untracked,
non-ignored files) committed on a side branch. Your uncommitted work on `main` hasn't been staged, stashed or changed.

## Suggested order (about 7 h)

| # | File | What you do | Time |
|---|---|---|---|
| 1 | `review/LEGACY_DIFF_REVIEW.md` | Grok starter (`main`) vs the hardened rewrite: what the rewrite fixed, what it missed, and whether it's ready to ship | 90 min |
| 2 | `review/EXERCISE.md` | Blind 60-minute review of the hardened tree, then fill in `review/COMPARE.md` | 60 + 20 min |
| 3 | `incidents/001-task-assignee.md` | SEV-2: a stranger assigned to a task (branch `training/incidents/001-task-assignee`) | 75 min |
| 4 | `incidents/002-status-report.md` | SEV-1: a cross-tenant read via a dashboard endpoint (branch `training/incidents/002-status-report`), plus the RLS design question | 75 min |
| 5 | `interview/TECHNICAL_QUESTIONS.md` | 10 questions, answered out loud in 2 minutes each | 40 min |
| 6 | `interview/PROJECT_STORIES.md` | Finish the 4 STAR stories with what *you* observed in steps 1–4 | 30 min |

The sealed answers are in `_answers/` (one file per exercise). Open each one only after you've written your own answer.

Running an incident: `git worktree add ../inc-001 training/incidents/001-task-assignee`, then in that folder run
`npm ci`, then `node scripts/test-database.mjs backend`. That starts a throwaway native PostgreSQL 18 cluster with no Docker.
Remove the worktree when you're done.

Concept pages are in the central curriculum (`Desktop/opusorganize/apprenticeship/curriculum/`) and aren't copied here:
05 (verify before trust), 07 (zero-downtime migrations), 10 (query plans and keyset pagination), 14 (load and back-pressure).
There's no central Postgres RLS page yet. It has been requested in the B06 report.
