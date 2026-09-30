# 03. Grok multitenant project: interview preparation

A multitenant project tool must scope reads and writes to an authorized organization. Explain how identity becomes trusted context, how capabilities differ from membership, and why the repository query still needs the appropriate scope.

This is an additive third block. Keep the [original foundations](../README.md) and [second practice block](../expansion-02/README.md). This block focuses on explaining, implementing, testing, and defending decisions under interview conditions. The scenarios are synthetic practice cases anchored to the source map, not claims of newly discovered application bugs.

## Start with one interview round

| Round | Practice | Timebox |
|---|---|---|
| 1 | [JavaScript reasoning and live coding](rounds/01-javascript.md) | 30 min per case |
| 2 | [React component and interaction interview](rounds/02-react.md) | 35 min per case |
| 3 | [TypeScript, schemas, and public contracts](rounds/03-typescript.md) | 25 min per case |
| 4 | [Asynchronous JavaScript and API boundaries](rounds/04-async-api.md) | 30 min per case |
| 5 | [Debugging and test-design interview](rounds/05-debugging.md) | 35 min per case |
| 6 | [Junior system-design and data-model interview](rounds/06-design.md) | 40 min per case |
| 7 | [Code-review and take-home defense](rounds/07-review.md) | 30 min per case |
| 8 | [Project explanation and behavioral interview](rounds/08-behavioral.md) | 25 min per case |

Each round has six project scenarios. That makes **48 scenario/round combinations**, not 48 unrelated production incidents. Revisit the same situation from different engineering roles: an algorithm can be correct while its UI ownership, API scope, or verification claim is wrong. Interviewer guidance is kept in a separate folder; close it until after your attempt.

Use the [coding challenge](coding/README.md), [study plan](STUDY-PLAN.md), [project defense](PROJECT-DEFENSE.md), and [scorecard](SCORECARD.md). The three complete mocks are [frontend](mocks/frontend.md), [full stack](mocks/full-stack.md), and [project defense](mocks/project-defense.md). The [all-project interview route](<../../../opusorganize/junior-reinforcement/interview-03/README.md>) explains how to choose projects without trying to finish everything in one sitting.

## Six scenarios

1. **Organization identity comes from a request:** A caller changes an organization header while keeping a valid session. A junior is asked whether authentication alone protects the project read.
2. **An old capability remains in the browser:** A member loses project-management rights while the editor is open. Its cached button state still says editing is allowed.
3. **Two editors save the same revision:** Two users load revision4 and submit different project names. The exercise asks for conflict detection rather than silent last-writer-wins.
4. **An ID exists in another organization:** A project identifier is valid but belongs to an organization outside the current scope. Choose a deliberate API response policy and avoid leaking extra existence information.
5. **Unknown fields reach a generic update:** The server receives a project patch containing name and tenantId. A generic object merge would allow fields outside the public update contract.
6. **Permissions have an explicit revocation:** A synthetic policy grants read/write through a role and revokes write for one resource. The interview tests composition rather than memorized role names.

## Actual source to inspect

- [frontend/src/api/client.ts](<../../frontend/src/api/client.ts>)
- [frontend/src/features/projects/pages/ProjectsPage.tsx](<../../frontend/src/features/projects/pages/ProjectsPage.tsx>)
- [backend/src/lib/validation.ts](<../../backend/src/lib/validation.ts>)
- [backend/src/services/projectService.ts](<../../backend/src/services/projectService.ts>)
- [backend/src/controllers/projectController.ts](<../../backend/src/controllers/projectController.ts>)
- [training/README.md](<../../training/README.md>)

Read current symbols and callers before attributing a guarantee to the application. A lab fixture may introduce an explicit version, policy, or field that the app does not have. The local Node challenge verifies its written teaching contract only. React sketches, TypeScript/JSDoc sketches, database plans, and browser claims require their own checks.

The intended audience is a junior software engineer practicing fundamentals and project explanations. Scoring is educational and is not an employer's hiring rubric or a guarantee of interview outcomes. Personal mastery starts **not assessed**.
