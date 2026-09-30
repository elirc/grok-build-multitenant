# Foundations: HTTP input parsing and trustworthy runtime contracts

## Follow one search input

Read `fetchProjects` in `frontend/src/api/client.ts`, `getProjectsForOrganization` in `projectService.ts`, and `listInput` in `backend/src/lib/validation.ts`. Record the browser values, URL representation, Express query value, validated service input, and repository call. Explain why a TypeScript annotation on `request<T>` cannot establish that a JSON response actually has type T.

Build a boundary table for `page`: absent, `1`, `0`, `-1`, `1.5`, `1x`, an empty string, a repeated query value represented as an array, and a very large integer. Predict before checking the actual schema. Then distinguish the current app contract from the deliberately stricter teaching contract below.

## Coercion is a design choice

Compare `Number('')`, `parseInt('1x', 10)`, and a whole-string decimal check followed by Number. Each can be appropriate in a different context. A pagination API should choose deliberately rather than accidentally accepting whichever conversion happens to be convenient.

## Error and retry reading

In `request<T>`, identify the timeout, cleanup in finally, unreadable-response error, and warning that a request may already have completed. Explain why aborting the browser request cannot prove a server mutation was rolled back. Trace which layer turns validation failures into HTTP errors; do not expose stack traces as a substitute for a useful error contract.

## Git reading task

Use the training README to understand the working-tree snapshot. List why a diff of tracked files alone can miss a new validator or auth module. Your source trace must name whether it refers to current working files, committed HEAD, or the documented snapshot.

## Before you code

Write one prediction you are least sure of and name the smallest observation that would settle it. Distinguish a fact you read in source from behavior you actually ran. Use the source map in [README](README.md) to check the exact files.
