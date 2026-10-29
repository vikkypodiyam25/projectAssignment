# Dispatch — Email Job Scheduler

Dispatch is a React/Express email scheduler with PostgreSQL, Redis/BullMQ, and a Nodemailer worker.

## Run locally with Docker Compose

If you do not already have a root `.env`, copy `.env.example` to `.env` and replace the placeholder values with local secrets. Preserve an existing `.env`. Then run from the project root:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm start
```

Compose starts the frontend/API, worker, PostgreSQL, and Redis as separate local containers. The same UI is available at <http://localhost:5173> and <http://localhost:4000>. API health: <http://localhost:4000/api/health>.

To start only the local database and queue:

```powershell
npm run db:up
```

Stop containers with `docker compose down`; named volumes retain data. `docker compose down -v` deletes the local PostgreSQL and Redis data.

For manual development, keep PostgreSQL and Redis running, configure `backend/.env`, then use separate terminals for `npm run backend`, `npm run worker`, and `npm run frontend`. Initialize the schema once with `npm run db:init`.

## Render free hobby deployment

The root `render.yaml` defines a free Render Web Service, free Render Postgres, and free Redis-compatible Key Value service. Render doesn't provide free background-worker instances, so the web service starts the API and worker together. Postgres and Redis remain separate managed services.

No deploy or repository push has been performed. To deploy later, connect the repository in Render and create a Blueprint from `render.yaml`. Keep the web service, Postgres, and Key Value in the same region. During Blueprint setup, provide SMTP settings if you have a provider; do not put credentials in `render.yaml` or in Git.

### Free-tier limits

This is for a hobby/demo, not reliable production scheduling. Render's free web service sleeps after 15 minutes without incoming traffic, so the worker pauses too; due emails wait until the service wakes. Free Postgres expires after 30 days, and free Key Value is memory-only. The worker rebuilds missing BullMQ jobs from scheduled PostgreSQL rows after restart, but it cannot restore messages after the Postgres database expires. SMTP ports 25, 465, and 587 are blocked on Render free services; configure a mail provider that supports an available port such as 2525. These limits come from [Render's free plan docs](https://render.com/docs/free) and [Key Value docs](https://render.com/docs/key-value).

For more reliable sends, use an always-on paid worker and persistent/paid database and queue services. Render's free plan does not offer a separate background worker.

## Environment variables

- `JWT_SECRET`: required signing secret. Compose reads it from the ignored root `.env`; Render generates it.
- `DATABASE_URL`: local backend connection string or Render-managed Postgres URL.
- `REDIS_URL`: local Redis URL or Render-managed Key Value URL.
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: local Compose database initialization values.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`: mail transport settings. Without SMTP configuration the worker uses an Ethereal test account, which captures mail instead of delivering it to recipients.

The Compose-only `COMPOSE_DATABASE_URL` points at the `postgres` service name. `DATABASE_URL` in `.env.example` points at localhost for manual development.

## API

Routes include `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/emails/dashboard`, email create/list/detail/delete routes, and `GET /api/health`. Authenticated routes use `Authorization: Bearer <token>`.

## Tests

The repository has no test files or `test` scripts. The Docker build compiles the frontend and packages the backend; Compose health checks cover the API, PostgreSQL, and Redis.
