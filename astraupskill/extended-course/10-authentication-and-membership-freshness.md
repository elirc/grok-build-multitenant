# 10. Authentication and membership freshness

[Course index](README.md) · [Worked review](answers/03-server-evidence.md)

Sources: [authentication middleware](../../backend/src/middleware/auth.ts), [tenant context](../../backend/src/middleware/tenantContext.ts), and [HTTP integration tests](../../backend/src/__tests__/projectRepository.test.ts). The central question is where each part of authority comes from and how recently it was checked.

## Follow identity before role

The issued JWT contains a subject and standard token metadata. Verification specifies HS256, the tenant-workspace issuer, and the tenant-workspace-web audience. The middleware validates the subject's syntax before assigning req.userId. It does not accept an organization or role from the token as the tenant context for project operations.

The project mount subsequently calls attachTenantContext. That middleware parses the x-org-id header, looks up the membership for the verified user and selected organization, and constructs a context from the current membership role. The header selects the requested organization; the database membership determines whether that selection is authorized. A user who belongs to two organizations must still make an explicit selection, and knowing a valid organization ID does not create membership.

This separation makes role changes visible on later project requests without issuing a new token. The existing integration test source includes membership revocation and role-change scenarios. Those tests are useful evidence of intended behavior, but reading them is not the same as executing them in this expansion pass. The course distinguishes inspected test coverage from the independent teaching lab that actually ran.

## A session's display can become stale

The login response includes current memberships for browser navigation. The browser can continue displaying that list while the server's membership records change. On the next project request, attachTenantContext reads the current membership again. Thus the navigation menu is a convenience snapshot, while the request-level membership check is authoritative.

Suppose an owner is demoted to member while editing a project. The browser may still show the save control because its login-time membership snapshot says owner. The server's current role check rejects the project mutation. The local draft should remain available for export or review. A good error flow explains changed access without silently discarding the user's work or pretending the old UI role grants continuing authority.

Revocation has a related but different outcome. If membership is removed entirely, the tenant context cannot be constructed and the request is denied. If the user still belongs to another organization, that other membership does not grant access to the revoked one. This is why tests should use a person with multiple memberships: it prevents a simplistic implementation from treating any membership as sufficient for every selected organization.

## Login defenses have explicit scope

The login route normalizes email through the parser and compares a supplied password against either the found user's hash or a dummy hash. Missing users and incorrect passwords receive the same rejection message. The dummy comparison reduces an obvious difference in the code path, but it is not a measured proof that every observable timing distribution is identical. A careful course states the implementation's intent without turning it into an unsupported constant-time guarantee.

The route also keeps an in-memory map of attempts keyed by request IP, with a fifteen-minute window, an attempt threshold, and a bound on tracked entries. It increments before parsing and credential comparison. This means malformed attempts also consume the local allowance. The map belongs to that running application instance. Restarting the process or running multiple instances changes the effective behavior; the code does not show a shared distributed limiter.

The Retry-After response is set to 900 seconds on the rejection path. That is a simple fixed guidance value, not a precise countdown computed from each entry's remaining lifetime. A learner should trace what the code actually calculates rather than assuming a sophisticated rate-limiting algorithm from the presence of a 429 response.

## Secrets and subjects have different validation needs

validateSecret rejects values shorter than thirty-two bytes and common placeholder prefixes. This catches obvious setup mistakes. It cannot prove that a thirty-two-byte string was generated with sufficient randomness. The function's error message asks for a generated secret, while the implementation checks length and recognizable placeholders. Those are useful checks with a clear limit.

The subject grammar is constrained to a short alphanumeric, underscore, and hyphen identity. That is appropriate for the repository's IDs but is not a universal rule for every JWT subject in every system. The lesson is to connect token claims to this application's identity model. A migration to a different identity provider would need to revisit mapping and validation deliberately rather than broadening the regex without understanding downstream assumptions.

## Build layered authority tests

Start with a valid token and valid membership, then vary one dimension at a time. Invalid signature tests cryptographic acceptance. Wrong audience tests intended recipient. Missing organization header tests selection requirements. Nonmember organization tests membership. Current member role tests operation policy. Foreign project identity inside a valid organization tests resource scope. These cases can all produce failures, but they fail at different boundaries.

A useful review artifact names the earliest expected rejection and confirms that no mutation or acceptance audit was written. Where an HTTP test covers the whole path, also inspect final database state. Where a unit test supplies a fabricated context, state that authentication provenance is outside its scope. This prevents an impressive count of passing unit tests from being mistaken for complete authority coverage.

### Exercises

**MT10 A.** Trace an old valid token after membership revocation and after role demotion. Explain why the two cases differ and which current database record determines each outcome.

**MT10 B.** Explain the scope and limitations of the login attempt map. Describe the behavior after a process restart and across two independent application instances without claiming a distributed policy exists.

**MT10 C.** Build six negative authority cases, each failing at a different boundary. Include the expected absence of accepted data changes and identify which tests require the complete HTTP path.
