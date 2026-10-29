import { readFile } from 'node:fs/promises';
import { pool } from './db.js';
try {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(schema);
  console.log('Database schema is ready.');
} catch (error) {
  console.error('Database initialization failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
