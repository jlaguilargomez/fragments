# Validation and API boundaries

## Concept

DTOs describe what a particular API operation accepts; domain models describe the data the application owns. They overlap but do not need to be identical.

## How it works here

The creation DTO requires content and permits a nullable title. The update DTO permits either field but rejects an empty update. The persisted `Fragment` always has identifiers, timestamps, and `source`, none of which the browser is allowed to submit.

## Why this solution

The distinction prevents accidental client control over server-owned fields and makes the API contract explicit. The shared package contains transport-friendly types, while Zod remains in the API as the runtime authority.

## Alternatives and trade-offs

Schema-first code generation can eliminate some duplication, but it adds a generation workflow. Manual DTOs are clearer while the API is small, at the cost of keeping types and validation aligned.

## What to learn

Look for fields whose authority matters. When authentication is introduced, `userId` belongs to server-side identity, never to a create-fragment DTO.
