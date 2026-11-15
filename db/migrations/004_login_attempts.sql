CREATE TABLE IF NOT EXISTS login_attempts (
  identity_hash CHAR(64) PRIMARY KEY,
  window_started_at TIMESTAMP(3) NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL,
  INDEX(window_started_at)
) ENGINE=InnoDB;
