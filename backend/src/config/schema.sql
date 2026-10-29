CREATE TABLE IF NOT EXISTS users (
 id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS emails (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 recipient TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL,
 scheduled_at TIMESTAMPTZ NOT NULL, status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','processing','sent','failed','cancelled')),
 attempts INTEGER NOT NULL DEFAULT 0, error TEXT, provider_message_id TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS emails_user_status_date_idx ON emails(user_id, status, scheduled_at);
CREATE INDEX IF NOT EXISTS emails_due_idx ON emails(status, scheduled_at) WHERE status = 'scheduled';
