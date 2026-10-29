import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import emailRoutes from './routes/email.routes.js';
import { AppError } from './utils/errors.js';
export const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));
const bundledUi = path.resolve(here, '../public');
const localUi = path.resolve(here, '../../frontend/dist');
const uiDirectory = existsSync(path.join(bundledUi, 'index.html')) ? bundledUi : localUi;
app.use(helmet({ contentSecurityPolicy: false })); app.use(cors({ origin: env.frontendUrl })); app.use(express.json({ limit: '30kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-7', legacyHeaders: false }), authRoutes);
app.use('/api/emails', emailRoutes); app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
if (existsSync(path.join(uiDirectory, 'index.html'))) {
  app.use(express.static(uiDirectory));
  app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => res.sendFile(path.join(uiDirectory, 'index.html')));
} else {
  app.get('/', (_req, res) => res.json({ name: 'Dispatch Email Scheduler API', status: 'ok', api: '/api', health: '/api/health', hint: 'Build the frontend or run the Docker Compose stack to serve the UI here.' }));
}
app.use((_req, _res, next) => next(new AppError('Route not found.', 404)));
app.use((error, _req, res, _next) => { const status = error.status || (error.name === 'ZodError' ? 400 : 500); if (status >= 500) console.error(error); const message = status === 500 && error.code?.startsWith('ECONN') ? 'Database is unavailable. Start PostgreSQL and check DATABASE_URL in backend/.env.' : (error.name === 'ZodError' ? error.issues[0]?.message || 'Invalid request.' : error.message || 'Internal server error.'); res.status(status).json({ error: message }); });
