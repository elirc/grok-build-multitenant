# Sealed reasoning guide

Attempt both labs and write the investigation hypotheses before reading. These answers concern only this expansion, not the existing Opus incidents.

## Capability table

The teaching policy first requires verified context, then matching organization, then a recognized role/action combination. MEMBER can read and writeTask; ADMIN and OWNER can also writeProject. Unknown roles and actions are denied. Returning a reason makes the decision inspectable, but a production API may intentionally translate reasons to avoid disclosing resource existence.

The middleware source shows membership lookup after header parsing. That distinction matters: client-selected scope is not trusted until checked. The lab accepts an already-verified context and therefore does not exercise authentication, membership revocation, or route wiring.

## Versioned updates

An accepted update creates one new record with version plus one and preserves other object identities. Wrong revision returns conflict without changing the collection. A missing ID returns missing. Allowed patch fields are name and description; unknown keys are rejected by this teaching contract instead of being spread onto the record.

The model's sequential calls make the second version-3 write conflict after the first advances to 4. In a real database this result requires an atomic conditional write. A pre-read followed by an unconditional update is not equivalent under concurrency.

## Evidence critique

Use independent negative cases for tenant and role. The wrong-organization MEMBER fixture proves neither dimension alone. Service mocks can test response mapping, but cannot prove the database predicate or affected-row semantics. Keep the UI draft on conflict so the user controls reconciliation rather than silently accepting last-write-wins.

## Compare mechanisms, not spelling

For each difference from the reference, classify it as another valid implementation, a violated contract, or an assumption absent from the exercise. Show a concrete input for the second category. If you cannot produce one, do not call a stylistic preference a correctness defect.

Return to the application source before adopting a model. The reference deliberately omits infrastructure guarantees that would require browser, database, or provider evidence. It is an executable explanation, not a production patch.
