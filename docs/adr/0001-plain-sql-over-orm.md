# 1. Plain SQL with node-postgres instead of an ORM

Status: accepted

## Context

The API has three tables and a handful of queries, but those queries carry the interesting behaviour: role-scoped
visibility, filtered and paginated listing, and joins that return denormalised rows for the UI.

## Decision

Use `node-postgres` with parameterised SQL, validated at the edge with zod, and numbered `.sql` migrations applied by a
small runner (`apps/api/src/migrate.ts`) that records them in `schema_migrations` and takes an advisory lock.

## Consequences

- Every query is visible and reviewable, and indexes (including the trigram indexes behind search) are designed
  alongside the queries that need them.
- No ORM abstraction to learn or work around, and a smaller serverless bundle.
- Row-to-object mapping is manual. If the model grew substantially, a query builder (Kysely) would add type safety
  without hiding the SQL. That is the next step rather than a full ORM.
