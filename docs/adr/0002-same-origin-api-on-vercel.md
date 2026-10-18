# 2. One Vercel project, with the API on the same origin under /api

Status: accepted

## Context

The app is an Angular SPA plus an Express API. Vercel serves static files and runs serverless functions, and a
separate API host would need CORS, a second deployment and an environment-specific API URL baked into the frontend.

## Decision

Deploy a single Vercel project per repository. The Angular build is served as static output, and `api/index.ts` exports
the Express app as one serverless function. `vercel.json` rewrites `/api/*` to that function and every other path to
`index.html`. In development the Angular dev server proxies `/api` to `localhost:3001`, so the frontend always calls the
relative URL `/api`.

## Consequences

- No CORS configuration and no per-environment frontend config.
- Preview deployments are self-contained: each one has its own API and (through the Neon integration) its own database
  branch.
- Express runs as a function, so each cold instance opens a small connection pool. The pooled Neon connection string
  and `max: 3` per instance keep connection counts safe.
- The in-memory rate limiter is per instance. See ADR 4.
