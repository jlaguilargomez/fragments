# ADR 001: Use npm workspaces for the monorepo

## Context

The project has a Vue web app, an Express API, shared TypeScript contracts, and learning documentation. We need a way to keep those together without operational overhead.

## Options considered

1. Separate repositories.
2. A dedicated monorepo tool such as Turborepo or Nx.
3. npm workspaces.

## Decision

Use npm workspaces.

## Rationale

It is built into npm, provides local package linking for `@fragments/shared`, and supports workspace scripts. The project does not yet need remote task caching, package publishing, or complex build orchestration.

## Consequences

The repository has one lockfile and simple root commands. Build orchestration remains basic; if it becomes slow or the project grows into many packages, a task runner can be introduced with evidence.
