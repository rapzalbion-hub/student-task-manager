-- Jalankan sekali jika database sudah dibuat sebelumnya
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
