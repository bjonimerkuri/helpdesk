# Contributing

## Setup

```bash
nvm use                 # Node 20
docker compose up -d    # PostgreSQL (creates the helpdesk and helpdesk_test databases)
npm ci
npm run db:migrate && npm run db:seed
npm run dev             # API on :3001, web on :4200
```

## Before you push

```bash
npm run check           # format, lint, typecheck, unit tests, build
npm run test:int        # API tests against a real database
npm run e2e             # Playwright; starts the API and web app for you
```

## Conventions

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- **Schema changes:** add a new numbered file to `apps/api/migrations`. Never edit one that has shipped.
- **Business rules** (status transitions, visibility) live in `apps/api/src/ticket.rules.ts` as pure functions with unit
  tests. The UI asks the API what is allowed instead of re-implementing the rules.
- **Accessibility:** every interactive element needs a visible label and a visible focus state. The e2e suite runs axe on
  key pages.
