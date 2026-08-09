# Persistence and SQLite

## Concept

SQLite is an embedded relational database: the database is a file, while SQL supplies schema constraints, indexes, transactions, and queries. It is a real database, not a browser cache.

## How it works here

`sqlite-fragment-repository.ts` creates the table on startup, uses prepared statements for all values, and maps snake_case database columns to camelCase application fields. ISO timestamps sort lexicographically in chronological order, allowing a simple indexed lookup.

## Why this solution

One entity with five operations does not justify an ORM. Seeing schema and query choices side by side makes the persistence model easy to inspect and learn from.

## Alternatives and trade-offs

An ORM can make migrations, relations, and changing databases more convenient later, but adds an additional model and generated tooling. `better-sqlite3` executes calls synchronously; this is comfortable for a local app but should be reconsidered for a high-concurrency server.

## What to learn

Follow the mapping between database and domain, then consider how a future `user_id` or many-to-many context relation would affect the schema, indexes, and query ownership checks.
