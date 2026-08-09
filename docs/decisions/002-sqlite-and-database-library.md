# ADR 002: Use SQLite with better-sqlite3

## Context

Iteration 1 needs durable local storage for one simple entity. The database should be easy to inspect and should not create an artificial abstraction for a future PostgreSQL migration.

## Options considered

1. SQLite through an ORM such as Prisma or Drizzle.
2. SQLite through `better-sqlite3` and prepared SQL.
3. PostgreSQL from the start.

## Decision

Use SQLite with `better-sqlite3` and prepared SQL statements.

## Rationale

The schema and queries fit in one small repository file. Keeping SQL visible is educational and removes migration tooling and ORM schema duplication from the MVP. Prepared statements provide safe parameter handling.

## Consequences

The API has a local native dependency and synchronous database calls, both acceptable for this small local use. A PostgreSQL migration later requires rewriting this repository and adding migrations; the application contract keeps that change contained.
