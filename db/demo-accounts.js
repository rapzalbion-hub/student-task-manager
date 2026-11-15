require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  const hash = (p) => bcrypt.hashSync(p, 10);

  // Admin
  await db.execute(
    "INSERT IGNORE INTO users (role, username, name, email, password_hash) VALUES ('admin', ?, 'Administrator', 'admin@kampus.ac.id', ?)",
    [process.env.ADMIN_USERNAME || "admin", hash(process.env.ADMIN_PASSWORD || "admin12345")]
  );

  // Dosen + Kode Dosen
  const [d] = await db.execute(
    "INSERT IGNORE INTO users (role, name, nip, email, password_hash, status) VALUES ('dosen', 'Budi Santoso, M.Kom', '198701012015041002', 'budi@kampus.ac.id', ?, 'active')",
    [hash("dosen123")]
  );
  if (d.insertId) {
    await db.execute("INSERT INTO lecturer_codes (code, lecturer_id) VALUES ('DSN-7F4K92', ?)", [d.insertId]);
  }

  // Mahasiswa
  await db.execute(
    "INSERT IGNORE INTO users (role, name, nim, email, class_name, study_program, password_hash) VALUES ('mahasiswa', 'Raffi Ahmad', '230123001', 'raffi@kampus.ac.id', 'TI-3A', 'Teknik Informatika', ?)",
    [hash("mahasiswa123")]
  );

  console.log("Akun demo dibuat.");
  await db.end();
})().catch((e) => { console.error(e.message); process.exit(1); });