# Architecture

## Runtime

```mermaid
flowchart LR
  Browser["Angular SPA<br/>(static files)"] -- "/api/*" --> Fn["Express app<br/>(Vercel function)"]
  Fn -- "pooled SQL" --> DB[("PostgreSQL<br/>(Neon)")]
  Dev["ng serve :4200"] -. "proxy /api" .-> Local["Express :3001"]
```

In production the browser, the static files and the function share one origin. Locally, the Angular dev server proxies
`/api` to the API process.

## Data model

```mermaid
erDiagram
  users ||--o{ tickets : "created_by"
  users |o--o{ tickets : "assignee_id"
  tickets ||--o{ comments : has
  users ||--o{ comments : "author_id"
  users { int id PK  text email UK  text role }
  tickets { int id PK  text title  text status  text priority  int created_by FK  int assignee_id FK }
  comments { int id PK  int ticket_id FK  int author_id FK  text body }
```

## Ticket state machine

```mermaid
stateDiagram-v2
  [*] --> open
  open --> in_progress
  open --> closed
  in_progress --> resolved
  in_progress --> open
  resolved --> closed
  resolved --> open
  closed --> open
```

## Request flow for a status change

```mermaid
sequenceDiagram
  participant UI as Angular
  participant API as Express
  participant DB as PostgreSQL
  UI->>API: PATCH /api/tickets/42 { status: "resolved" }
  API->>API: requireAuth, requireStaff, validate body (zod)
  API->>DB: SELECT ticket (404 if the caller cannot view it)
  API->>API: canTransition(current, next)?
  alt invalid move
    API-->>UI: 422 "Cannot move a ticket from open to resolved"
  else valid
    API->>DB: UPDATE tickets SET status, updated_at
    API-->>UI: 200 ticket detail incl. allowedStatuses
  end
```

## Where things live

| Concern | Location |
|---|---|
| Business rules (pure, unit-tested) | `apps/api/src/ticket.rules.ts` |
| HTTP routes and validation | `apps/api/src/routes/` |
| Config and fail-fast env validation | `apps/api/src/config.ts` |
| Schema | `apps/api/migrations/*.sql`, applied by `apps/api/src/migrate.ts` |
| Vercel function entry | `api/index.ts` |
| Angular features / core services / shared UI | `apps/web/src/app/{features,core,shared}` |
| Tests | unit `apps/api/src/*.test.ts`, integration `apps/api/test/`, e2e `e2e/tests/` |
