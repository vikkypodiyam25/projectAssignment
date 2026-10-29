import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { env } from '../config/env.js';
export const EMAIL_QUEUE = 'scheduled-email';
export const emailQueue = new Queue(EMAIL_QUEUE, { connection: redisConnection, defaultJobOptions: { attempts: env.maxAttempts, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 1000, removeOnFail: 5000 } });
export async function enqueueEmail(id, scheduledAt) {
  await emailQueue.add('send-email', { emailId: Number(id) }, { jobId: `email-${id}`, delay: Math.max(0, new Date(scheduledAt).getTime() - Date.now()) });
}
