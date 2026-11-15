-- Jalankan sekali jika database sudah dibuat sebelumnya
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
