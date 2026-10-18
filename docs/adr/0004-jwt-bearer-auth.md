# 4. Stateless JWT bearer authentication, and the trade-offs

Status: accepted, with known limitations

## Decision

Sign an 8-hour HS256 token at login and send it as `Authorization: Bearer`. The server pins the algorithm on
verification, requires a 32+ character secret in production and refuses to start without one.

## Known limitations

- **Token storage:** the token lives in `localStorage`, so an XSS bug could read it. The app ships a strict
  Content-Security-Policy (no inline scripts, same-origin only) to reduce that risk. Because the API is now same-origin,
  the natural upgrade is an httpOnly, SameSite=Strict cookie plus a CSRF check, which would remove the token from
  JavaScript entirely.
- **No revocation or refresh tokens:** a stolen token is valid until it expires. Acceptable for a demo, not for
  production.
- **Rate limiting is per instance:** `express-rate-limit` uses an in-memory store, so on serverless the limit applies
  per warm instance. A shared store (Upstash Redis or Postgres) would make it global.
