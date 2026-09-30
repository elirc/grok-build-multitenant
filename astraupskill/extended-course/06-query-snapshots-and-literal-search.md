# 6. Understand the population behind a page

The list methods in [projectRepository.ts](../../backend/src/repositories/projectRepository.ts) use a page size of twenty, descending createdAt with ascending ID tie-breaking, and a RepeatableRead transaction for rows and total. This chapter teaches the difference between a consistent single response and a stable traversal across multiple requests.

## Define the selected population

Project listing always includes organizationId. A nonempty query adds an OR across name and description, with case-insensitive contains conditions. Task listing first verifies the parent project, then filters tasks by organization and parent, optionally adding title text and status. The count uses the same where object as the rows query.

Write a fixture of twenty-three projects in Cedar and three in Birch. A Cedar unfiltered first page has twenty items and total twenty-three; page two has three items and the same total if the data is unchanged. Birch rows should not enter either the result set or the total. A test checking only returned items could miss a count query that leaks or mixes another organization's population.

## Literal characters need deliberate treatment

The repository escapes backslash, percent and underscore before passing a contains value to Prisma. Those characters can have pattern meaning in SQL LIKE. The intended user contract is literal search, so a query containing a percent sign should find that character rather than every record.

Prepare names Alpha_One, AlphaXOne and Percent%Plan. Predict matches for an underscore fragment and a percent fragment under literal semantics. Keep SQL escaping distinct from HTML escaping and authorization. A correctly escaped search can still query the wrong tenant if its where clause omits organizationId.

Actual provider tests are important here because a mock can confirm the escaped string but not how the ORM and database interpret it. Use the database configured by the application and retain exact query values in the fixture. Do not replace the provider with a JavaScript includes helper and call it a proof of SQL wildcard behavior.

## Rows and total belong together

The transaction requests RepeatableRead. The intended purpose is for the row query and count query to observe a consistent snapshot during one list operation. Without that, an insert between statements can make the total and returned page describe different moments. A controlled relational test can expose the difference.

This does not mean the first and second browser page requests share one snapshot. Each request starts its own transaction. If a new project appears before the first page's rows, an offset-based second page can repeat a previously seen item. If an earlier row disappears, the next offset can skip an unseen item. Stable ordering makes each snapshot deterministic but does not freeze the population across requests.

## Work an insertion example

Use symbolic rows P23 through P1 ordered newest to oldest, with twenty per page. The first page contains P23 through P4. Insert a newer P24 before requesting page two. Skipping the first twenty current rows now begins at P4, so the second response repeats P4 and then contains P3, P2 and P1.

This is not a failure of the single-response snapshot. It is a property of traversing a changing population with offsets. A product can accept it for an interactive list, reset pagination after mutations, adopt an anchor-based cursor, or create an export snapshot. The course should distinguish these contracts rather than promising that one transaction option solves every paging problem.

## Task counts in project rows

Project listing includes a count of related tasks for each returned project. That number describes the relation count under the selected transaction snapshot. It is not necessarily the number of tasks matching a separate task-search filter or status selection on another screen.

If a future dashboard displays matching tasks, name the filter and count that same population deliberately. Reusing an unfiltered relation count beside a filtered task list can produce confusing but individually correct numbers. The best test asserts the meaning of the label as well as the numerical result.

## Pagination boundaries

The service schema restricts pages to positive decimal strings through ten thousand. The repository calculates skip from page minus one times twenty. An out-of-range page can legitimately return no items with a positive total, because the request refers beyond the current population. That is different from an empty selected organization.

A client can clamp or reset its visible page after a deletion, but doing so should be a declared interaction. Avoid silently replacing an error with an empty list if the request actually failed. Data absence and inability to refresh are different states for the user.

## Exercises

MT06-A: calculate both pages of the twenty-three-row fixture, then the second page after insertion of P24. Explain why RepeatableRead does not prevent the cross-request duplicate.

MT06-B: design literal-search fixtures for percent, underscore and backslash. State what a mocked query test and a real provider test each establish.

MT06-C: propose a report showing task status counts. Define whether counts refer to all tasks or a filtered population, and identify the transaction or snapshot boundary needed for the promised consistency.

[Course index](README.md) · [Foundation answers](answers/01-foundations.md)
