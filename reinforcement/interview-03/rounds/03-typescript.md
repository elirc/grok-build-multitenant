# Grok multitenant project: TypeScript, schemas, and public contracts

Work one case at a time in approximately 25 minutes. These are six distinct scenarios viewed through this interview round. Select a case you have not recently rehearsed. The [source map](../README.md), [scorecard](../SCORECARD.md), and [project defense](../PROJECT-DEFENSE.md) support your attempt. Afterward use the [separate interviewer notes](../_interviewer/rounds/03-typescript.md).

## How to run this round

Design the contract around this case without assuming that incoming JSON is already a trusted type. Use TypeScript sketches for a TypeScript project; use JSDoc plus the existing runtime-schema conventions for GitJira. Start the external input as unknown and identify the first boundary that may narrow or reject it.

Write a small outcome union whose variants require different caller behavior. Include the case's successful result and its important failure or uncertain result. Show an exhaustive consumer and explain what should happen when a new variant is introduced. Avoid a boolean plus several optional fields when that representation admits contradictory states.

The interviewer will supply an omitted property, explicit null, an empty string, zero, and a wrong primitive type. State which are meaningful for this contract; do not normalize all of them into one value by default. Add an old-client fixture that lacks a newly optional field and a malicious or malformed fixture that supplies a forbidden field.

Deliver type/schema sketches, an input-decision table, and a compatibility note. These are practice designs until checked against the repository's actual public contract; do not describe an uncompiled sketch as passing type verification.

## 03.3.1 — Organization identity comes from a request

**Scenario.** A caller changes an organization header while keeping a valid session. A junior is asked whether authentication alone protects the project read.

**Starting fixture.** User belongs to orgA; supplied orgB; project belongs to orgB.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.


---

## 03.3.2 — An old capability remains in the browser

**Scenario.** A member loses project-management rights while the editor is open. Its cached button state still says editing is allowed.

**Starting fixture.** Role admin at load; member at save; attempted project rename.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.


---

## 03.3.3 — Two editors save the same revision

**Scenario.** Two users load revision4 and submit different project names. The exercise asks for conflict detection rather than silent last-writer-wins.

**Starting fixture.** A expects4 writes X; B expects4 writes Y after A commits5.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.


---

## 03.3.4 — An ID exists in another organization

**Scenario.** A project identifier is valid but belongs to an organization outside the current scope. Choose a deliberate API response policy and avoid leaking extra existence information.

**Starting fixture.** Scope=orgA; lookup id=P9; stored tenant=orgB.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.


---

## 03.3.5 — Unknown fields reach a generic update

**Scenario.** The server receives a project patch containing name and tenantId. A generic object merge would allow fields outside the public update contract.

**Starting fixture.** Patch {name:New,tenantId:orgB}; existing tenantId=orgA.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.


---

## 03.3.6 — Permissions have an explicit revocation

**Scenario.** A synthetic policy grants read/write through a role and revokes write for one resource. The interview tests composition rather than memorized role names.

**Starting fixture.** Role grants read/write; resource denies write; caller asks write.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.
