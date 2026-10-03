# Helpdesk (Angular + Node.js + PostgreSQL)

A support-ticket system with role-based access. Customers open tickets and follow the conversation. Agents and admins triage them: change status, assign them and reply.

## What it demonstrates
- **Role-based access control:** customers only see their own tickets. Staff see everything. Other people's tickets return 404, not 403, so their existence is not leaked.
- **A ticket state machine:** statuses can only move along allowed transitions (open, in progress, resolved, closed, reopen). The API returns the allowed next statuses, so the UI never duplicates the rules.
- **Modern Angular:** standalone components, signals, the new control flow (`@if`, `@for`), lazy-loaded routes, functional guards and interceptors, typed reactive forms.
- **RxJS in practice:** debounced search with `debounceTime` and `distinctUntilChanged`, `switchMap` to cancel stale requests, `combineLatest` and `BehaviorSubject` for reload and pagination state.
- **Server-side filtering and pagination** with parameterized SQL and indexes.
- **Validation with zod**, centralized error handling, JWT auth and bcrypt.
- **Tests:** the business rules (transitions and visibility) are pure functions covered with Vitest.

## Stack
Angular 18 · RxJS · TypeScript · Node.js · Express · PostgreSQL (node-postgres, plain SQL) · zod · JWT · Vitest

## Roles
| Role | Can do |
|---|---|
| customer | Register, create tickets, see and comment on own tickets |
| agent | See all tickets, comment, change status, assign |
| admin | Same as agent (kept separate for future admin features) |

## Data model
```
users 1──* tickets (created_by)      users 1──* tickets (assignee_id)
tickets 1──* comments (author_id -> users)
```

## Run locally
```bash
docker compose up -d
cd server && npm install && npm run seed && npm run dev
cd web && npm install && npm start
cd server && npm test
```
Open http://localhost:4200. Demo accounts (password `password123`): `customer@example.com`, `agent@example.com`, `admin@example.com`.

If you started the database before, recreate it so the schema runs: `docker compose down -v && docker compose up -d`.

## API
| Method | Route | Access |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | public |
| GET | `/tickets?status=&q=&page=&pageSize=` | any user (scoped by role) |
| POST | `/tickets` | any user |
| GET | `/tickets/:id` | owner or staff |
| PATCH | `/tickets/:id` | staff (status, priority, assignee) |
| POST | `/tickets/:id/comments` | owner or staff |
| GET | `/agents` | staff |

## Decisions and trade-offs
- **Plain SQL with node-postgres** instead of an ORM, to show query design, joins and parameterization.
- **RxJS services instead of NgRx:** for this size, a store would add boilerplate without benefit. NgRx would be the next step if shared state grew.
- **JWT in localStorage** keeps the demo simple. A production app should prefer httpOnly cookies.
- **Offset pagination** is fine at this scale. Keyset pagination would suit very large tables.

## Limitations and next steps
- [ ] Angular component tests and API integration tests against a real database
- [ ] Migrations tool instead of a single schema file
- [ ] Email notifications and attachments
- [ ] Refresh tokens and rate limiting
- [ ] Deploy a live demo and add the link and screenshots here
