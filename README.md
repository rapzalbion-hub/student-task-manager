# Student Task Manager

Website manajemen tugas perkuliahan (Admin, Dosen, Mahasiswa). Next.js (App Router) + TypeScript + Tailwind + PostgreSQL. Tema "Academic Focus".

## Instalasi
1. `npm install`
2. Salin `.env.example` menjadi `.env`, lalu isi `DATABASE_URL` dengan connection string PostgreSQL. Untuk Supabase, ambil connection string dari Project Settings > Database; encode karakter khusus pada password URL dan gunakan mode SSL yang disediakan.
3. Jalankan `db/schema.sql` pada database PostgreSQL yang dipilih.
4. Isi data contoh: `npm run db:seed` (aman dijalankan ulang; juga menambah kolom baru jika database lama).
5. Jalankan: `npm run dev` lalu buka http://localhost:3000

Build produksi: `npm run build` lalu `npm start`.

## Akun contoh (hasil seed, hanya untuk development)
| Role | Login | Password awal |
|---|---|---|
| Admin | `admin` | `ADMIN_PASSWORD` di `.env` (default `admin12345`) |
| Dosen | NIP `198701012015041002` atau `199002132018012001` (atau email) | `dosen123` |
| Dosen (pending, tidak bisa login) | NIP `199103011520031003` | `dosen123` |
| Mahasiswa | `230123001` s.d. `230123008` | tanggal lahir DDMMYYYY + 2 digit akhir NIM, mis. `1501200401` untuk 230123001 |

Dosen dan Mahasiswa wajib mengganti password awal saat login pertama.
Contoh Kode Tugas: `TGS-WEB-8F29`, `TGS-DB-3K71`, `TGS-RPL-5Q02`.

## Aturan inti
- Tidak ada pendaftaran mandiri; akun dibuat Admin. Tidak ada penghapusan akun/mata kuliah (hanya nonaktif).
- Password awal mahasiswa = tanggal lahir (DDMMYYYY) + 2 digit terakhir NIM (`lib/password.ts`).
- Login dan permintaan reset password dibatasi 5 kali per 15 menit per identitas; catatannya disimpan di PostgreSQL agar berlaku lintas proses.
- Upload: PDF, DOC, DOCX, ZIP, PNG, JPG; maks. `MAX_UPLOAD_MB` per file, 5 file per pengumpulan. Disimpan di `storage/uploads/` (di luar `public/`), diunduh lewat `/api/files/[id]` dengan pengecekan otorisasi.

## Login dengan email & lupa password
Dosen dan Mahasiswa dapat mengisi email di menu Profile (perlu konfirmasi password), lalu login memakai email atau NIM/NIP. Lupa password: `/lupa-password` mengirim tautan reset (berlaku 30 menit, sekali pakai). Isi `SMTP_*` dan `APP_URL` di `.env` agar email terkirim; tanpa SMTP, tautan dicetak di terminal server.

## Login admin bermasalah?
Jalankan `npm run admin:reset` untuk menyamakan akun admin dengan `ADMIN_USERNAME`/`ADMIN_PASSWORD` di `.env`, lalu restart `npm run dev`. Kunci percobaan login akan berakhir otomatis setelah 15 menit.

## Database lama
Untuk database PostgreSQL lama, jalankan migrasi yang dibutuhkan dari `db/migrations/`, lalu `npm run db:seed`. Tidak ada migrasi data otomatis dari database MySQL lama.

Untuk `SESSION_SECRET`, gunakan string acak minimal 32 karakter, misalnya hasil `openssl rand -base64 32`. Nilai contoh di `.env.example` tidak dapat dipakai untuk login.

## Struktur
`app/` halaman per role (admin, dosen, mahasiswa) dan API; `components/` komponen UI; `lib/` database, session, validasi, upload; `db/` schema, seed, migrasi; `middleware.ts` proteksi route per role.
