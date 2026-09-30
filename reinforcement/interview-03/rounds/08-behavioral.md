# Grok multitenant project: Project explanation and behavioral interview

Work one case at a time in approximately 25 minutes. These are six distinct scenarios viewed through this interview round. Select a case you have not recently rehearsed. The [source map](../README.md), [scorecard](../SCORECARD.md), and [project defense](../PROJECT-DEFENSE.md) support your attempt. Afterward use the [separate interviewer notes](../_interviewer/rounds/08-behavioral.md).

## How to run this round

Use this case to practice explaining technical work to a teammate and then to a non-specialist. If you have not personally implemented or investigated it, present it as a study or design exercise. Do not turn the supplied scenario, another author's implementation, or a reference answer into a fabricated personal achievement.

Prepare a ninety-second account: the user's problem, your actual role, the constraint, a decision you made or would test, the evidence you observed, and a remaining limitation. For a hypothetical case, use conditional language throughout and state the experiment you would run. Avoid invented users, performance gains, outages, revenue, or team conflicts.

The interviewer will ask why you rejected an alternative, what feedback changed your mind, and what you would do with one more day. Answer with the case's concrete input and boundary. If you do not know a detail, explain how you would verify it instead of substituting a confident generic story.

Deliver a short spoken answer, an evidence ledger with source/experiment links, and two follow-up answers. Practice a version for a frontend interviewer and one for a backend interviewer while keeping the underlying facts identical.

## 03.8.1 — Organization identity comes from a request

**Scenario.** A caller changes an organization header while keeping a valid session. A junior is asked whether authentication alone protects the project read.

**Starting fixture.** User belongs to orgA; supplied orgB; project belongs to orgB.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.


---

## 03.8.2 — An old capability remains in the browser

**Scenario.** A member loses project-management rights while the editor is open. Its cached button state still says editing is allowed.

**Starting fixture.** Role admin at load; member at save; attempted project rename.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.


---

## 03.8.3 — Two editors save the same revision

**Scenario.** Two users load revision4 and submit different project names. The exercise asks for conflict detection rather than silent last-writer-wins.

**Starting fixture.** A expects4 writes X; B expects4 writes Y after A commits5.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.


---

## 03.8.4 — An ID exists in another organization

**Scenario.** A project identifier is valid but belongs to an organization outside the current scope. Choose a deliberate API response policy and avoid leaking extra existence information.

**Starting fixture.** Scope=orgA; lookup id=P9; stored tenant=orgB.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.


---

## 03.8.5 — Unknown fields reach a generic update

**Scenario.** The server receives a project patch containing name and tenantId. A generic object merge would allow fields outside the public update contract.

**Starting fixture.** Patch {name:New,tenantId:orgB}; existing tenantId=orgA.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.


---

## 03.8.6 — Permissions have an explicit revocation

**Scenario.** A synthetic policy grants read/write through a role and revokes write for one resource. The interview tests composition rather than memorized role names.

**Starting fixture.** Role grants read/write; resource denies write; caller asks write.

Your user is a organization member; the affected surface is the organization project list and editor. Keep trusted organization membership visible in the model. The user-facing operation is to read or update a project.

### Project-specific follow-through

Start at the [project source map](../README.md), then trace tenant context, service authorization, and repository predicate. Locate one current symbol that supports your explanation and one assumption the fixture adds. If the application already handles the scenario, characterize that behavior instead of inventing a fix. Record the repository state you inspected so later changes do not silently invalidate your answer.

Before opening the interviewer notes, write a result for the supplied fixture and one counterexample of your own. Ask the interviewer to vary exactly one fact, then explain what changes and what stays invariant. Finish with one sentence naming the evidence that would be needed to move from this practice answer to an application claim.

**Evidence to keep:** your first prediction, the artifact requested in this round, the strongest follow-up question, your revised explanation, and any check that remains unrun. Repeating the same answer faster is not the goal; surviving a changed input is.
