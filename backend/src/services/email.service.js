import { pool } from '../config/db.js';
import { AppError } from '../utils/errors.js';
const owned = async (id, userId) => { const { rows } = await pool.query('SELECT * FROM emails WHERE id=$1 AND user_id=$2', [id, userId]); if (!rows[0]) throw new AppError('Email not found.', 404); return rows[0]; };
export async function schedule(userId, input) {
  const { rows } = await pool.query('INSERT INTO emails(user_id,recipient,subject,body,scheduled_at) VALUES($1,$2,$3,$4,$5) RETURNING *', [userId, input.recipient, input.subject, input.body, input.scheduledAt]);
  try { const { enqueueEmail } = await import('../queues/email.queue.js'); await enqueueEmail(rows[0].id, rows[0].scheduled_at); }
  catch (error) { await pool.query("UPDATE emails SET status='failed',error=$2,updated_at=NOW() WHERE id=$1", [rows[0].id, `Queue unavailable: ${error.message}`]); throw error; }
  return rows[0];
}
export async function list(userId, status, limit = 100) {
  const args = [userId]; let where = 'user_id=$1';
  if (status) { args.push(status); where += ` AND status=$${args.length}`; }
  args.push(limit);
  const { rows } = await pool.query(`SELECT * FROM emails WHERE ${where} ORDER BY scheduled_at DESC LIMIT $${args.length}`, args); return rows;
}
export async function get(userId, id) { return owned(id, userId); }
export async function deleteEmail(userId, id) {
  const client = await pool.connect();
  try { await client.query('BEGIN'); const { rows } = await client.query('SELECT * FROM emails WHERE id=$1 AND user_id=$2 FOR UPDATE', [id, userId]); if (!rows[0]) throw new AppError('Email not found.', 404); if (!['scheduled', 'sent'].includes(rows[0].status)) throw new AppError('Only your scheduled or sent emails can be deleted.', 409);
    if (rows[0].status === 'scheduled') { const { emailQueue } = await import('../queues/email.queue.js'); await emailQueue.remove(`email-${id}`); }
    const result = await client.query('DELETE FROM emails WHERE id=$1 AND user_id=$2 RETURNING id', [id, userId]); await client.query('COMMIT'); return { id: result.rows[0].id, deleted: true };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
export async function dashboard(userId) {
  const { rows } = await pool.query(`SELECT COUNT(*) FILTER(WHERE status IN ('scheduled','processing'))::int AS scheduled,
   COUNT(*) FILTER(WHERE status='sent')::int AS sent, COUNT(*) FILTER(WHERE status='failed')::int AS failed,
   COUNT(*) FILTER(WHERE status='scheduled' AND scheduled_at>NOW())::int AS upcoming FROM emails WHERE user_id=$1`, [userId]);
  const activity = await list(userId, undefined, 6); return { ...rows[0], activity };
}
