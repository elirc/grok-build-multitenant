# 5. Enforce the task's parent and organization together

Read the Project and Task models in [schema.prisma](../../backend/prisma/schema.prisma) and the task methods in [projectRepository.ts](../../backend/src/repositories/projectRepository.ts). The schema uses a composite reference from Task's projectId and organizationId to Project's ID and organizationId. This makes the parent relationship carry the tenant boundary rather than relying solely on application convention.

## Two identities in one relationship

A project has a globally identified row and an organization. A task also stores an organization and parent project. If the task referenced only projectId while keeping an unrelated organizationId scalar, the two values could disagree unless another constraint checked them. The composite relation expresses that the parent and tenant must agree.

Use Cedar project P and Birch project Q. A proposed task with projectId Q but organizationId Cedar should violate the relationship in a correctly migrated database. An application service should reject such a request earlier through scoped lookup, but the database constraint remains useful if another writer bypasses that service.

Keep source schema and deployed constraint evidence separate. Reading Prisma declarations tells you the intended relation. Inspecting migration SQL and running a relational fixture establish what the selected database actually enforces. A mocked repository cannot prove a foreign key exists.

## Creation checks the parent first

createTask opens a transaction, calls projectIn for the selected organization and project, creates the task with that same organization and parent, and writes its audit. The client supplies title and status through TaskInput rather than arbitrary organizationId or projectId fields inside the task object. The route and service supply the addressed parent separately.

This division reduces ambiguity. A request cannot legitimately name parent P in the route and Q in a strict body field that is not accepted. If a future API permits moving a task, it should define source parent, destination parent and expected version explicitly, rather than letting an unrestricted object spread change ownership as an incidental update.

## Updates and deletes retain the relationship

updateTask and removeTask include task ID, project ID, organization ID and version in their mutation predicates. A task cannot be addressed through a different project merely because its ID is known. On zero matches, taskIn applies the same parent and tenant scope before classifying a version conflict.

Design three adjacent cases. First, correct tenant and parent with stale task version should conflict. Second, correct tenant but wrong parent should be not found in that project. Third, wrong tenant with an otherwise correct task ID should be not found in the selected scope. These cases isolate different predicates while preserving the user's expected disclosure boundary.

## Project deletion is intentionally guarded

remove deletes a project only when its ID, organization, expected version and tasks-none condition all match. If deletion changes no row, it reads the project within the organization. Absence produces not found. A mismatched version produces the ordinary conflict. Otherwise it reports that tasks must be explicitly deleted first.

This creates an error precedence worth testing. A stale version on a project that also has tasks is classified as version conflict before the child-cleanup message. A matching version with tasks gets the cleanup message. A foreign project does not reveal its child count through this path.

The database's Restrict relationship is another layer against deleting a parent with children. The conditional application delete provides a clearer intended error before a raw constraint failure, while the constraint protects integrity under other writers or races. The two layers serve different purposes.

## A create-versus-delete schedule

Suppose one transaction creates a task while another tries to delete the project. The final database must not contain a task whose referenced project is absent. Depending on ordering and locking, creation or deletion can fail. An integration test should inspect the final relationship and error classification under controlled schedules rather than insisting on one winner without arranging the order.

The source's tasks-none predicate is not a reason to omit the foreign key. A predicate observes a state at its statement boundary; concurrent writers and provider behavior matter. The database relationship supplies a persistent invariant. Explain which part of the experiment checks each layer.

## Proposed task movement

A move operation would be a new feature. Define whether it is allowed only within one organization, which roles may move, and how histories identify the old and new parent. Include the expected task version and a destination existence check. If cross-organization transfer is ever allowed, it needs a separate authority and data migration contract rather than reusing ordinary member task editing accidentally.

Audit representation should preserve both locations if the move matters historically. The current audit helper records resource and action metadata but no arbitrary before/after payload. A proposal must decide whether to extend that shape or add a dedicated movement record. Do not claim the existing generic event already contains the missing fields.

## Exercises

MT05-A: draw the composite relationship and write one valid and two invalid task fixtures.

MT05-B: predict deletion outcomes for absent, foreign, stale-with-children, current-with-children and current-empty projects. Name the order of classification.

MT05-C: design a create-versus-delete integration test and a separate task-move proposal. Include final relational invariants and audit requirements.

[Course index](README.md) · [Foundation answers](answers/01-foundations.md)
