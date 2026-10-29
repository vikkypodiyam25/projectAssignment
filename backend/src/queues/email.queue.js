import { Queue } from 'bullmq';
import { pool } from '../config/db.js';
import { redisConnection } from '../config/redis.js';
import { env } from '../config/env.js';
export const EMAIL_QUEUE = 'scheduled-email';
export const emailQueue = new Queue(EMAIL_QUEUE, { connection: redisConnection, defaultJobOptions: { attempts: env.maxAttempts, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 1000, removeOnFail: 5000 } });
export async function enqueueEmail(id, scheduledAt) {
  await emailQueue.add('send-email', { emailId: Number(id) }, { jobId: `email-${id}`, delay: Math.max(0, new Date(scheduledAt).getTime() - Date.now()) });
}

export async function reconcileScheduledEmails({ recoverProcessing = false } = {}) {
  if (recoverProcessing) {
    await pool.query("UPDATE emails SET status='scheduled',updated_at=NOW() WHERE status='processing'");
  }
  const { rows } = await pool.query("SELECT id,scheduled_at FROM emails WHERE status='scheduled' ORDER BY scheduled_at");
  let restored = 0;
  const existingJobs = await emailQueue.getJobs(['waiting', 'active', 'delayed', 'paused', 'waiting-children'], 0, -1, true);
  const existingIds = new Set(existingJobs.map((job) => job.id));
  for (const email of rows) {
    const jobId = `email-${email.id}`;
    if (!existingIds.has(jobId)) {
      await enqueueEmail(email.id, email.scheduled_at);
      restored += 1;
    }
  }
  if (restored) console.log(`Restored ${restored} scheduled email job(s) from PostgreSQL.`);
  return restored;
}
