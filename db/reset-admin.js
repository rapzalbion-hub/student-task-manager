require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

(async () => {
  const user = process.env.ADMIN_USERNAME || "admin";
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) { console.error("ADMIN_PASSWORD belum diisi di .env"); process.exit(1); }
  const db = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  const hash = bcrypt.hashSync(pass, 10);
  const [rows] = await db.execute("SELECT id FROM users WHERE role='admin' ORDER BY id LIMIT 1");
  if (rows.length) {
    await db.execute("UPDATE users SET username=?, password_hash=?, status='active' WHERE id=?", [user, hash, rows[0].id]);
  } else {
    await db.execute("INSERT INTO users (role,username,name,email,password_hash,status) VALUES ('admin',?,'Administrator','admin@kampus.ac.id',?,'active')", [user, hash]);
  }
  console.log("Admin siap. Username: " + user);
  await db.end();
})().catch((e) => { console.error(e.message); process.exit(1); });