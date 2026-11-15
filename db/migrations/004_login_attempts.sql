CREATE TABLE IF NOT EXISTS login_attempts (
  identity_hash CHAR(64) PRIMARY KEY,
  window_started_at TIMESTAMP(3) NOT NULL,
  attempts SMALLINT NOT NULL
);
CREATE INDEX IF NOT EXISTS login_attempts_window_started_at_idx ON login_attempts(window_started_at);
