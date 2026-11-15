require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

(async () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum diisi di .env");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const user = process.env.ADMIN_USERNAME || "admin";
    const pass = process.env.ADMIN_PASSWORD;
    if (!pass) throw new Error("ADMIN_PASSWORD belum diisi di .env");
    const hash = bcrypt.hashSync(pass, 10);
    const existing = await pool.query("SELECT id FROM users WHERE role='admin' ORDER BY id LIMIT 1");
    if (existing.rowCount) {
      await pool.query("UPDATE users SET username=$1,password_hash=$2,status='active' WHERE id=$3", [user, hash, existing.rows[0].id]);
    } else {
      await pool.query("INSERT INTO users (role,username,name,email,password_hash,status) VALUES ('admin',$1,'Administrator','admin@kampus.ac.id',$2,'active')", [user, hash]);
    }
    console.log("Admin siap. Username: " + user);
  } finally {
    await pool.end();
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
