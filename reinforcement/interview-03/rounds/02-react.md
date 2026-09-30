# Grok multitenant project: React component and interaction interview

Work one case at a time in approximately 35 minutes. These are six distinct scenarios viewed through this interview round. Select a case you have not recently rehearsed. The [source map](../README.md), [scorecard](../SCORECARD.md), and [project defense](../PROJECT-DEFENSE.md) support your attempt. Afterward use the [separate interviewer notes](../_interviewer/rounds/02-react.md).

## How to run this round

Sketch a small React view for this case using the project's existing component style. Start with state ownership: which values are server observations, local drafts, selection, request status, or derived display values? Draw the parent/child boundary and identify the user event that starts the operation. Do not import server-only domain code into the browser to reuse a convenient function.

Write a state table before JSX. Include initial, pending, success with data, empty success, failure, and stale/conflict behavior where relevant. Explain which states cannot occur together and how the component prevents an impossible combination. Keep changes tied to an explicit user event separate from synchronization with an external subscription or resource.

The interviewer will change the selected entity or unmount the view while work is pending. Show what happens to an old response and to any event listener or subscription. Explain the identity of list keys and controlled form values. Add a keyboard-only route through the primary action and describe where an error message should be discoverable.

Deliver a component outline, a transition table, and a user-level test plan. If you did not run a browser, label the focus, timing, and accessibility observations as proposed rather than verified.

## 03.2.1 — Organization identity comes from a request

**Scenario.** A caller changes an organization header while keeping a valid session. A junior is asked whether authentication alone protects the project read.

**Starting fixture.** User belongs to orgA; supplied orgB; project belongs to orgB.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.


---

## 03.2.2 — An old capability remains in the browser

**Scenario.** A member loses project-management rights while the editor is open. Its cached button state still says editing is allowed.

**Starting fixture.** Role admin at load; member at save; attempted project rename.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.


---

## 03.2.3 — Two editors save the same revision

**Scenario.** Two users load revision4 and submit different project names. The exercise asks for conflict detection rather than silent last-writer-wins.

**Starting fixture.** A expects4 writes X; B expects4 writes Y after A commits5.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.


---

## 03.2.4 — An ID exists in another organization

**Scenario.** A project identifier is valid but belongs to an organization outside the current scope. Choose a deliberate API response policy and avoid leaking extra existence information.

**Starting fixture.** Scope=orgA; lookup id=P9; stored tenant=orgB.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.


---

## 03.2.5 — Unknown fields reach a generic update

**Scenario.** The server receives a project patch containing name and tenantId. A generic object merge would allow fields outside the public update contract.

**Starting fixture.** Patch {name:New,tenantId:orgB}; existing tenantId=orgA.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.


---

## 03.2.6 — Permissions have an explicit revocation

**Scenario.** A synthetic policy grants read/write through a role and revokes write for one resource. The interview tests composition rather than memorized role names.

**Starting fixture.** Role grants read/write; resource denies write; caller asks write.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.
