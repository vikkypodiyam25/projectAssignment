import pg from 'pg';
import { env } from './env.js';
const { Pool } = pg;
export const pool = new Pool({ connectionString: env.databaseUrl, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
pool.on('error', (error) => console.error('Unexpected PostgreSQL pool error', error));
