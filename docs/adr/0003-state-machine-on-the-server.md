# 3. Ticket status rules live on the server, and the API tells the UI what is allowed

Status: accepted

## Decision

Valid status transitions are defined once, as a pure function in `apps/api/src/ticket.rules.ts`. The API enforces them
(HTTP 422 for an invalid move) and returns `allowedStatuses` with every ticket detail. The Angular app renders exactly
that list and never duplicates the transition table.

## Consequences

- A rule change is a one-file change with unit tests, and the UI follows automatically.
- Customers always receive an empty `allowedStatuses`, so the controls never render for them.
- The e2e suite asserts the real option lists (for example, an open ticket offers only "In progress" and "Closed").
