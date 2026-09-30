# 12. Reading integration tests as evidence

[Course index](README.md) · [Worked review](answers/03-server-evidence.md)

Primary source: [projectRepository.test.ts](../../backend/src/__tests__/projectRepository.test.ts). Despite its filename, this file exercises real PostgreSQL and HTTP behavior through the application. Learning to identify the actual test boundary is more useful than inferring it from a directory or filename.

## Inspect setup before assertions

The test file constructs the application, uses supertest for HTTP requests, and accesses Prisma for fixture setup and final-state inspection. Before running, it checks an explicit environment marker and requires a loopback database URL with a particular disposable database name. Its setup deletes existing rows in dependency order and seeds synthetic data. That destructive fixture behavior is why the environment guard matters.

Do not copy the cleanup statements into an arbitrary development database. The course does not run these integration tests during this documentation pass because the backend dependencies are absent and no disposable database environment was established. Reading the test file supplies knowledge of intended coverage; it does not supply a new passing execution result. A trustworthy report keeps those two kinds of evidence separate.

The beforeEach reset makes tests independent at the data level. The synthetic password and accounts are fixtures, not credentials to reuse elsewhere. The application is created after seeding, which also creates fresh in-memory login attempt state for that test instance. These setup choices affect how rate-limit and authentication cases behave, so they belong in the reading exercise rather than being skipped as boilerplate.

## Identify what each assertion proves

The cross-tenant tests check both response status and retained database values. That is stronger than checking only a 404 response: a faulty implementation could return an error after accidentally writing. The final-state assertion makes the absence of a side effect visible. Similarly, the concurrent-update test expects one 200 and one 409, then verifies version two and the expected audit count.

The concurrency test uses Promise.all to launch two requests. That creates overlapping work in normal execution, but it does not place an explicit barrier at a particular database statement. The test is still valuable as an integration regression. For a stronger schedule-specific investigation, add controlled synchronization at a chosen boundary in a disposable test harness. Do not claim that Promise.all enumerates every possible transaction interleaving.

The database parent-matching test directly attempts an invalid task insertion. This bypasses the HTTP service checks and tests the composite relationship itself. It answers a different question from a route test that supplies the wrong parent ID. Both are useful because application checks and database constraints are independent defenses against different caller paths.

## Fault injection should target the acceptance boundary

The failingAudit helper creates a database trigger that raises an exception before audit insertion. It removes the trigger and function in a finally block. Tests then attempt create, update, and delete operations and inspect the original rows and audit counts afterward. This is a meaningful rollback test because the failure occurs inside the database transaction after earlier work may already have been attempted.

A mock that simply throws before the transaction begins would not test the same property. It would prove that an early rejection is handled, but not that prior writes roll back when a later evidence write fails. A useful fault-injection design names the exact failure point and the durable postconditions. It also includes reliable cleanup so one failed test does not poison the rest of the suite.

The response assertions ensure the synthetic internal detail does not leak and the response request ID matches the header. This connects data integrity with error presentation. A rollback can be correct while error handling still reveals implementation details; conversely, a polite message can hide a partial write. The test examines both dimensions.

## Boundary fixtures need values that expose the mistake

The literal-search test creates a name containing percent and underscore characters. Those characters matter because SQL pattern matching can treat them specially. A fixture containing only ordinary letters would not reveal an escaping regression. The pagination test creates twenty-one matching rows, just beyond the twenty-row page size, then verifies page lengths and unique identities across the two pages.

The authorization fixtures also avoid a common weak pattern. They include people with different memberships and a user who can select more than one organization. This exposes implementations that accidentally authorize by any membership or forget the currently selected organization. Good fixtures are chosen because they would fail under a plausible bug, not because they are easy to type.

## Turn test reading into a coverage map

Create a map from invariant to existing test, source implementation, and remaining uncertainty. For example, the invariant that project audit failure rolls back mutation maps to the failingAudit tests and the repository transaction. Remaining uncertainty might include behavior under a different database version or deployment configuration, not the basic assertion already expressed by the test.

Do not label a missing test as a confirmed application defect. A test gap means evidence is absent or incomplete. The next step is to design the smallest useful experiment or inspect another existing test, not to state that the code necessarily fails. This distinction is a core upskilling habit: separate observed failure, plausible risk, intended behavior, and proposed verification.

### Exercises

**MT12 A.** Explain why the test file is an integration suite despite its repository-oriented filename. List the real boundaries it crosses and the environment assumptions it enforces.

**MT12 B.** Compare the audit-trigger rollback test with a mock that throws before transaction execution. Identify the stronger postcondition and the cleanup requirement.

**MT12 C.** Build a coverage map for tenant scope, optimistic updates, parent integrity, literal search, and draft preservation. Mark which concerns this backend test file cannot establish by itself.
