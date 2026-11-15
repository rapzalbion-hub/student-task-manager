require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

(async () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum diisi di .env");
  const db = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const hash = (password) => bcrypt.hashSync(password, 10);
    await db.query(`INSERT INTO users (role,username,name,email,password_hash)
      VALUES ('admin',$1,'Administrator','admin@kampus.ac.id',$2) ON CONFLICT (username) DO NOTHING`,
    [process.env.ADMIN_USERNAME || "admin", hash(process.env.ADMIN_PASSWORD || "admin12345")]);
    await db.query(`INSERT INTO users (role,name,nip,email,password_hash,status)
      VALUES ('dosen','Budi Santoso, M.Kom','198701012015041002','budi@kampus.ac.id',$1,'active') ON CONFLICT (nip) DO NOTHING`,
    [hash("dosen123")]);
    await db.query(`INSERT INTO users (role,name,nim,email,class_name,study_program,password_hash)
      VALUES ('mahasiswa','Raffi Ahmad','230123001','raffi@kampus.ac.id','TI-3A','Teknik Informatika',$1) ON CONFLICT (nim) DO NOTHING`,
    [hash("mahasiswa123")]);
    console.log("Akun demo dibuat.");
  } finally {
    await db.end();
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
