# Worked change: turn tenant selection into an enforced boundary

The starter accepted an arbitrary `x-org-id` and defaulted to a demo organization. Its frontend sent an organization query parameter instead, so the two sides did not even agree on selection. A comment saying data was isolated could not establish that behavior. The improvement connects authenticated identity, verified membership, scoped data access, and failure-aware editing.

Start at the token. Login returns an expiring token whose subject is a user ID. The authentication middleware verifies its algorithm, issuer, audience, and expiry. It does not trust a role from a request body or organization from a client-generated token payload. Tenant middleware then looks up the selected user/organization membership on each request. If membership is absent, the request fails before reaching project operations.

A project update has this shape:

```json
{
  "version": 1,
  "project": {
    "name": "Customer portal",
    "description": "Show customers their current request status."
  }
}
```

The path identifies the project. The verified context identifies the organization and actor. The body contains editable values and the captured baseline version. Unknown fields such as `organizationId` inside the project value are rejected. This separation prevents user input from replacing authority established by middleware.

Read `update` in [the repository](../backend/src/repositories/projectRepository.ts). Its conditional write matches project ID, organization ID, and expected version. If zero rows change, a scoped lookup distinguishes a missing record from a stale version. A valid edit increments the version, inserts an audit event with the verified actor, and reads the accepted record within the same transaction. The adapter returns it only after the transaction finishes.

Now read [the React editor](../frontend/src/features/projects/pages/ProjectsPage.tsx). The loaded `project` object is the baseline; `projectDraft` contains current form values. Saving captures both before awaiting the request. Success adopts the server's result and clears the draft flag. A conflict leaves the draft available for export and explicit reconciliation. Refreshing the project list does not replace an editor's baseline automatically.

Test the feature from two directions. First, use a Cedar project ID while selecting Maple with a user authorized in both organizations. A scoped read must report no matching project, and a Maple manager must not update it. Second, load the same Cedar project in two tabs and save competing descriptions. Only one update should advance the version; the other tab should retain its input.

A reviewer should see a connected argument: authentication identifies the caller, membership authorizes selection, role policy permits the action, scoped predicates constrain records, captured versions preserve intent, transactions protect consistency, and the UI keeps rejected work. Each layer answers a different question. Removing any one weakens the feature even if a simple create-and-list demo still appears to work.
