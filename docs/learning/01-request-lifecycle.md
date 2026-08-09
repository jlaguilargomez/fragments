# Request lifecycle and boundaries

## Concept

An HTTP endpoint is an external boundary: clients can send malformed, unexpected, or outdated data. The route should turn HTTP data into trustworthy application input before business logic runs.

## How it works here

`apps/api/src/presentation/fragments-router.ts` uses Zod to validate request bodies and the `date` query parameter. Once parsed, `apps/api/src/application/fragments.ts` can rely on typed values and focus on the use case. Errors are translated back into consistent HTTP status codes at the presentation boundary.

## Why this solution

TypeScript types vanish at runtime, so shared interfaces alone do not validate browser input. Zod provides concise runtime validation while still inferring useful types.

## Alternatives and trade-offs

Validation can live inside every application function, or be handled by a framework with decorators. Both add either repetition or framework coupling. Keeping it in the router is direct for the MVP, but application functions would need their own validation if a second entry point (for example a job or CLI) appears.

## What to learn

Notice the distinction between transport concerns (JSON and status codes) and application concerns (creating or updating a fragment). It makes endpoint changes less likely to leak through the codebase.
