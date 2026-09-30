# Sealed reasoning: Grok multitenant project

Read after writing your own attempt. This guide answers only the new reinforcement exercises; it does not disclose the existing incident solutions.

## Parse in stages

Validate the outer shape, handle absence explicitly, check primitive types, check the whole numeric string, convert, and finally check safe-integer/range constraints. Do not use truthiness to choose defaults: an empty or malformed present field should not silently become the default under this contract.

Leading zeros are accepted because the contract says decimal digits, not canonical numeric spelling. Signs, whitespace and numeric primitives are rejected. That is a teaching choice, not a universal HTTP standard. Unknown fields are ignored, so the output consists only of the three named fields.

## Read the actual boundary honestly

The real service passes authenticated context.organizationId and `listInput.parse(query)` to the repository. The dangerous review patch lets a client replace trusted context and bypasses the existing schema. A parser test alone cannot prove tenant authorization remains correct.

The frontend wrapper returns JSON through a generic assertion; TypeScript does not execute that type at runtime. Separately, AbortController can stop waiting without reversing an already committed server operation. Preserve drafts and reconcile state before retrying an uncertain mutation.

## Evidence quality

A valid app transfer may be a characterization test rather than a behavior change. Record the chosen revision and uncommitted dependencies. The existence of a documented snapshot does not imply the current working tree is identical to it.

## Reference limits

`reference.mjs` implements the simplified contract in this pack. It is not a production patch or a recommendation to replace existing library behavior. The app transfer requires its own tests, source review, and runtime evidence.
