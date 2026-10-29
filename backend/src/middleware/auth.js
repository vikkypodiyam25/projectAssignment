import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
export function authenticate(req, _res, next) {
  try { const token = req.get('authorization')?.replace(/^Bearer\s+/i, ''); if (!token) throw new AppError('Please sign in to continue.', 401); req.user = jwt.verify(token, env.jwtSecret); next(); }
  catch (error) { next(error instanceof AppError ? error : new AppError('Your session has expired. Please sign in again.', 401)); }
}
