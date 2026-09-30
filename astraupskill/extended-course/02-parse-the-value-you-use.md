# 2. Make parsed values the operation contract

[validation.ts](../../backend/src/lib/validation.ts) defines runtime boundaries for identities, text, versions, list queries and mutation bodies. [projectService.ts](../../backend/src/services/projectService.ts) consumes their parsed outputs before calling the repository. This chapter asks you to predict exact values and rejections rather than merely noticing that a validation library is imported.

## A type is not a parser

A caller can send JSON that does not match a TypeScript interface. It can include extra properties, numeric strings, control characters or unsupported enum values. The service's parameters are unknown at important entry points, so the implementation must transform or reject them at runtime. The returned parsed value is the value to pass onward.

Write an input-to-output table for a project with a padded name and omitted description. The name is trimmed, and description defaults to an empty string. Unknown keys are rejected by the strict object schema. A proposed nested relation field cannot become a repository mutation merely because the caller includes it in JSON.

Distinguish rejection from stripping. A strict schema reports unsupported keys; a schema that silently removes them could still produce a safe output but a different client contract. The current course must explain the selected behavior accurately. A test should verify what reaches the repository, not only whether parse was called.

## Text policy is field-specific

The shared text builder trims and bounds strings, allows empty values only where requested and rejects selected control characters. Project names require at least one character after trimming and allow at most one hundred twenty. Descriptions can be empty and allow up to two thousand. Task titles allow up to one hundred eighty, while task status is restricted to TODO, IN_PROGRESS or DONE.

The control-character regular expression does not reject every whitespace character. Tabs and ordinary line breaks are not in the same rejected ranges as a null byte. Trimming affects the ends of a string, while the control-character check examines the whole remaining value. A test author should not replace those precise rules with the vague expectation no whitespace allowed.

Prepare boundary cases at maximum length and one beyond it. Include a padded one-character name, whitespace-only name, an internal tab and a null character. Predict which cases normalize and which reject. Use explicit escaped fixture values in a test so a reader can see otherwise invisible differences.

## Identity syntax and ownership are separate

identity accepts one to sixty-four characters drawn from letters, digits, underscore and hyphen. It does not trim. A syntactically valid identifier does not prove a record exists, belongs to the selected organization or is authorized for the caller. Those checks occur at other boundaries described in chapter one.

This separation helps error diagnosis. A malformed ID can stop before a database lookup. A valid but absent ID reaches a scoped lookup and may produce a not-found result. A guessed foreign ID may be deliberately indistinguishable from absence within the current organization. Do not collapse syntax validation and access control into one test named invalid ID.

## Mutation envelopes

Project updates use a strict envelope containing version and project. Task updates similarly contain version and task. The nested project or task schema describes a full accepted object for that operation, not an arbitrary partial patch. For example, a project name remains required, while description may default when omitted. A client that sends only one changed field must still satisfy the actual envelope and nested schema.

This matters for omission semantics. If an omitted description becomes empty, a client intending preserve the old description can accidentally request its replacement with empty text. The correct test begins with a nonempty stored description, sends the exact update payload and inspects the accepted value. Whether to introduce a partial-patch contract is a separate design decision.

Versions are numeric integers from one through 2,147,483,646. A string containing one is not the same accepted input as the number one. The upper bound leaves one increment within a signed 32-bit range. After a record reaches the next value, the ordinary request schema no longer accepts it as an expected version. A future version-exhaustion policy should be explicit rather than assuming integers grow forever.

## Query strings have their own representation

List page is parsed from a string matching a restricted decimal form and then transformed to a number. The default is the string one before transformation. A numeric JSON value passed directly to the helper does not satisfy that string contract. Leading zeroes, zero and values beyond ten thousand are not accepted by the selected rules.

The query object is strict. q defaults to empty after text processing. Task list status can be one of the three statuses or an empty string, with empty meaning no status restriction. A frontend should construct only supported query fields rather than forwarding an arbitrary search-parameter object.

## Exercises

MT02-A: write twelve validation vectors covering normalization, unknown keys, nulls, missing fields, control characters and enum case. Give the expected parsed value or rejection boundary for each.

MT02-B: compare update payloads with omitted, empty and nonempty description. Design a fixture that reveals whether the server preserves or replaces the previous value.

MT02-C: compare page values one as a number, one as text, zero-prefixed text and ten-thousand-and-one. Explain why HTTP parsing and direct service calls may present different raw representations.

[Course index](README.md) · [Foundation answers](answers/01-foundations.md)
