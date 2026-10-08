CREATE TABLE mail (
  id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL,
  from_addr TEXT NOT NULL,
  to_addr TEXT NOT NULL,
  subject TEXT NOT NULL,
  text TEXT NOT NULL,
  html TEXT NOT NULL,
  size INTEGER NOT NULL,
  truncated INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX mail_received_at ON mail (received_at);

CREATE TABLE sent (
  id TEXT PRIMARY KEY,
  sent_at TEXT NOT NULL,
  to_addr TEXT NOT NULL,
  subject TEXT NOT NULL,
  resend_id TEXT NOT NULL
);
