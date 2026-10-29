import dotenv from 'dotenv';
dotenv.config();
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be configured.');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be configured.');
export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  jwtSecret: process.env.JWT_SECRET,
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((origin) => origin.trim()),
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  sender: process.env.EMAIL_FROM || 'Email Scheduler <scheduler@example.test>',
  maxAttempts: Number(process.env.EMAIL_MAX_ATTEMPTS || 3),
  rateLimitPerMinute: Number(process.env.EMAIL_RATE_LIMIT_PER_MINUTE || 10),
  sendDelayMs: Number(process.env.EMAIL_SEND_DELAY_MS || 0)
};
