# Dispatch — Email Job Scheduler

Dispatch is a full stack email scheduler built with React, Vite, Express, PostgreSQL, Redis, BullMQ, and Nodemailer. It includes account registration and login, a dashboard, scheduled email management, and a background delivery worker.

## Run the complete app with Docker

Requirements: Docker Desktop running and Node.js 20+ with npm.

From this folder, run:

```powershell
npm start
```

This builds and starts the frontend, API, worker, PostgreSQL, and Redis. On a new database volume, PostgreSQL creates the schema automatically. The same UI is available at <http://localhost:5173> and <http://localhost:4000>; the API health endpoint is <http://localhost:4000/api/health>.

Stop the app with `Ctrl+C`. `docker compose down` stops the services and keeps data. `docker compose down -v` also deletes the local database and queue data.

For real email delivery, set `JWT_SECRET` and any SMTP settings in a root `.env` before starting. Without SMTP settings, the worker uses an Ethereal test account and logs preview links instead of delivering to real recipients.

## Run the frontend and API in development

Start PostgreSQL and Redis with `docker compose up -d postgres redis`. Copy `.env.example` to `backend/.env` if needed. Then use separate terminals:

```powershell
npm run db:init
npm run backend
npm run worker
npm run frontend
```

Open <http://localhost:5173>. Vite forwards `/api` requests to `http://127.0.0.1:4000`; set `API_PROXY_TARGET` if the API runs at a different address. You can also set `VITE_API_URL` in `frontend/.env` to override the browser API base URL.

## Services and API

| Service | Local address | Purpose |
| --- | --- | --- |
| Frontend | `http://localhost:5173` | React app |
| API | `http://localhost:4000/api` | Express REST API |
| PostgreSQL | `localhost:5432` | User and email records |
| Redis | `localhost:6379` | Persistent scheduled jobs |

API routes include `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/emails/dashboard`, email create/list/detail/delete routes, and `GET /api/health`. Authenticated routes use `Authorization: Bearer <token>`.

See `.env.example` for the available database, Redis, JWT, and SMTP environment variables. Change the local development JWT secret before deployment.

