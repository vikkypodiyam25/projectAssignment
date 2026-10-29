import nodemailer from 'nodemailer';
import { Worker } from 'bullmq';
import { pool } from '../config/db.js';
import { redisConnection } from '../config/redis.js';
import { env } from '../config/env.js';
import { EMAIL_QUEUE, reconcileScheduledEmails } from '../queues/email.queue.js';
let transporter;
let shuttingDown = false;
async function mailer() {
  if (transporter) return transporter;
  if (env.smtpHost) transporter = nodemailer.createTransport({ host: env.smtpHost, port: env.smtpPort, secure: env.smtpSecure, auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined });
  else { const account = await nodemailer.createTestAccount(); transporter = nodemailer.createTransport({ host: account.smtp.host, port: account.smtp.port, secure: account.smtp.secure, auth: { user: account.user, pass: account.pass } }); console.log('Using Ethereal test account:', account.user); }
  return transporter;
}
async function reconcileQueue(recoverProcessing = false) {
  try { await reconcileScheduledEmails({ recoverProcessing }); }
  catch (error) { console.error('Could not reconcile scheduled email jobs:', error.message); }
}
await reconcileQueue(true);
const reconciliationTimer = setInterval(() => reconcileQueue(), 30000);
redisConnection.on('ready', () => reconcileQueue());

const worker = new Worker(EMAIL_QUEUE, async (job) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query("SELECT * FROM emails WHERE id=$1 FOR UPDATE", [job.data.emailId]);
    const email = rows[0];
    if (!email || !['scheduled', 'processing'].includes(email.status)) { await client.query('COMMIT'); return; }
    const claimed = await client.query("UPDATE emails SET status='processing',attempts=attempts+1,updated_at=NOW() WHERE id=$1 AND status IN ('scheduled','processing') RETURNING id", [email.id]);
    if (!claimed.rowCount) { await client.query('COMMIT'); return; }
    await client.query('COMMIT');
    if (env.sendDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, env.sendDelayMs));
    const transport = await mailer(); const info = await transport.sendMail({ from: env.sender, to: email.recipient, subject: email.subject, text: email.body });
    await pool.query("UPDATE emails SET status='sent',provider_message_id=$2,sent_at=NOW(),updated_at=NOW(),error=NULL WHERE id=$1", [email.id, info.messageId]);
    const preview = nodemailer.getTestMessageUrl(info); if (preview) console.log(`Ethereal preview for email ${email.id}: ${preview}`);
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    const { rows } = await pool.query('SELECT attempts FROM emails WHERE id=$1', [job.data.emailId]);
    const finalAttempt = (rows[0]?.attempts || 0) >= env.maxAttempts;
    await pool.query('UPDATE emails SET status=$2,error=$3,updated_at=NOW() WHERE id=$1', [job.data.emailId, finalAttempt ? 'failed' : 'scheduled', error.message.slice(0, 2000)]);
    throw error;
  } finally { client.release(); }
}, { connection: redisConnection, concurrency: Math.max(1, env.rateLimitPerMinute), limiter: { max: Math.max(1, env.rateLimitPerMinute), duration: 60000 } });
worker.on('completed', (job) => console.log(`Email job ${job.id} completed`)); worker.on('failed', async (job, error) => {
  console.error(`Email job ${job?.id} failed:`, error.message);
  if (job && job.attemptsMade >= env.maxAttempts) {
    try { await pool.query("UPDATE emails SET status='failed',error=$2,updated_at=NOW() WHERE id=$1 AND status IN ('scheduled','processing')", [job.data.emailId, error.message.slice(0, 2000)]); }
    catch (updateError) { console.error('Could not persist final email failure:', updateError.message); }
  }
});
async function shutdown() { if (shuttingDown) return; shuttingDown = true; clearInterval(reconciliationTimer); await worker.close(); await redisConnection.quit(); await pool.end(); process.exit(0); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
