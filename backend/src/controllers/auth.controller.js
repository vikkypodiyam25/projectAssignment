import { z } from 'zod';
import * as auth from '../services/auth.service.js';
const registration = z.object({ name: z.string().trim().min(2).max(80), email: z.string().email().max(254), password: z.string().min(8).max(100) });
const credentials = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(100) });
export async function register(req, res) { const data = registration.parse(req.body); res.status(201).json(await auth.register(data)); }
export async function login(req, res) { const data = credentials.parse(req.body); res.json(await auth.login(data)); }
export async function me(req, res) { res.json({ user: req.user }); }
