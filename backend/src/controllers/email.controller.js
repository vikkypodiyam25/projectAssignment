import { z } from 'zod';
import * as emails from '../services/email.service.js';
const scheduleInput = z.object({ recipient: z.string().email().max(254), subject: z.string().trim().min(1).max(200), body: z.string().trim().min(1).max(20000), scheduledAt: z.string().datetime({ offset: true }).refine((value) => new Date(value).getTime() >= Date.now() - 5000, 'Scheduled time must be in the future.') });
export async function schedule(req, res) { res.status(201).json({ email: await emails.schedule(req.user.id, scheduleInput.parse(req.body)) }); }
export async function list(req, res) { const status = req.query.status ? z.enum(['scheduled','processing','sent','failed','cancelled']).parse(req.query.status) : undefined; res.json({ emails: await emails.list(req.user.id, status) }); }
export async function get(req, res) { res.json({ email: await emails.get(req.user.id, req.params.id) }); }
export async function remove(req, res) { res.json({ email: await emails.deleteEmail(req.user.id, req.params.id) }); }
export async function dashboard(req, res) { res.json(await emails.dashboard(req.user.id)); }
