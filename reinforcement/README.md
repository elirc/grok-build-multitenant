# 03. Grok multitenant project: reinforcement practice

Practice turning untrusted query values into a small explicit contract before reading the deeper tenant-isolation incidents.

## What this adds

The existing material emphasizes tenant security and the large legacy rewrite. This pack fills the more basic bridge between URL strings, unknown runtime values, validation, pagination, and a useful public error. It avoids repeating the tenant-isolation fixes.

This pack complements the existing material below. Start after its basic orientation or on-ramp, before the advanced incidents. Source references describe files inspected on 2026-09-26; record your current commit and working-tree differences before transferring an exercise into the app. New lab contracts are explicitly simplified teaching contracts, not claims about existing product behavior.

- [training/README.md](<../training/README.md>)

## Four sessions, about 4–6 hours

| Session | Work | Evidence to keep |
|---|---|---|
| 1 · 45–60 min | [Foundations](01-foundations.md): read the named files and make predictions | Your annotated data flow and prediction table |
| 2 · 60–90 min | [Isolated lab](02-lab.md): implement the starter and add a boundary test | Failing result, passing result, and your explanation |
| 3 · 60–90 min | [Transfer and review](03-transfer.md): plan and, in your own practice branch, implement one small app change | A focused diff and the relevant app-level evidence |
| 4 · 45–60 min | [Checkpoint](CHECKPOINT.md): retrieval practice and a short defense | Score, limits of evidence, and one repeat date |

If setup blocks app work, finish the dependency-free lab and source-reading tasks. Mark the app transfer pending; lab success does not verify a React component, database, or deployed service.

## Source map

- [frontend/src/api/client.ts](<../frontend/src/api/client.ts>)
- [frontend/src/features/projects/pages/ProjectsPage.tsx](<../frontend/src/features/projects/pages/ProjectsPage.tsx>)
- [backend/src/lib/validation.ts](<../backend/src/lib/validation.ts>)
- [backend/src/services/projectService.ts](<../backend/src/services/projectService.ts>)
- [backend/src/controllers/projectController.ts](<../backend/src/controllers/projectController.ts>)
- [training/README.md](<../training/README.md>)

## Concepts to revisit when stuck

- [04-characterization-tests.md](<../../opusorganize/apprenticeship/curriculum/04-characterization-tests.md>)
- [21-legacy-rescue-and-ports.md](<../../opusorganize/apprenticeship/curriculum/21-legacy-rescue-and-ports.md>)

The [shared practice protocol](../../opusorganize/junior-reinforcement/PRACTICE_PROTOCOL.md) explains evidence, Git hygiene, and when to use an agent. Keep answers closed until your own attempt is written. Your personal learning status starts **not assessed**.
