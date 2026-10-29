import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
const publicUser = (row) => ({ id: Number(row.id), name: row.name, email: row.email });
export async function register({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, 12);
  try { const { rows } = await pool.query('INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email', [name, email.toLowerCase(), passwordHash]); return issue(rows[0]); }
  catch (error) { if (error.code === '23505') throw new AppError('An account with this email already exists.', 409); throw error; }
}
export async function login({ email, password }) {
  const { rows } = await pool.query('SELECT id,name,email,password_hash FROM users WHERE email=$1', [email.toLowerCase()]);
  if (!rows[0] || !(await bcrypt.compare(password, rows[0].password_hash))) throw new AppError('Email or password is incorrect.', 401);
  return issue(rows[0]);
}
function issue(row) { const user = publicUser(row); return { token: jwt.sign(user, env.jwtSecret, { expiresIn: '7d' }), user }; }
