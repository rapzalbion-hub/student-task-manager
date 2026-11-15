import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { studentPassword } from "../lib/password";

const statusOf = (p: number) => (p <= 0 ? "not_started" : p >= 100 ? "completed" : "in_progress");

(async () => {
  const db = await mysql.createConnection({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
  const [cols]: any = await db.query("SHOW COLUMNS FROM users LIKE 'birth_date'");
  if (cols.length === 0) await db.query("ALTER TABLE users ADD COLUMN birth_date DATE NULL AFTER email");
  const [c2]: any = await db.query("SHOW COLUMNS FROM users LIKE 'must_change_password'");
  if (c2.length === 0) await db.query("ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0");
  await db.query("CREATE TABLE IF NOT EXISTS login_attempts(identity_hash CHAR(64) PRIMARY KEY, window_started_at TIMESTAMP(3) NOT NULL, attempts TINYINT UNSIGNED NOT NULL, INDEX(window_started_at)) ENGINE=InnoDB");
  const run = (sql: string, p: any[] = []) => db.execute(sql, p);
  const one = async (sql: string, p: any[]) => { const [r]: any = await run(sql, p); return r[0]?.id as number; };
  const hd = bcrypt.hashSync("dosen123", 10);

  await run("INSERT IGNORE INTO users (role,username,name,email,password_hash) VALUES ('admin',?,'Administrator','admin@kampus.ac.id',?)",
    [process.env.ADMIN_USERNAME || "admin", bcrypt.hashSync(process.env.ADMIN_PASSWORD || "admin12345", 10)]);

  const lecs = [["Budi Santoso, M.Kom", "198701012015041002", "budi@kampus.ac.id", "active"], ["Sinta Dewi, M.T", "199002132018012001", "sinta@kampus.ac.id", "active"], ["Andi Pratama, Ph.D", "199103011520031003", "andi@kampus.ac.id", "pending"]];
  const L: number[] = [];
  for (const [name, nip, email, st] of lecs) {
    await run("INSERT INTO users (role,name,nip,email,password_hash,status,must_change_password) VALUES ('dosen',?,?,?,?,?,1) ON DUPLICATE KEY UPDATE must_change_password=1", [name, nip, email, hd, st]);
    const uid = await one("SELECT id FROM users WHERE email=?", [email]);
    L.push(uid);
  }
  const names = ["Raffi Ahmad", "Andi Pratama", "Sinta Marina", "Dian Pratama", "Rizky Maulana", "Putri Ayu", "Bagas Saputra", "Nadia Safitri"];
  const S: number[] = [];
  for (let i = 0; i < names.length; i++) {
    const nim = `230123${String(i + 1).padStart(3, "0")}`;
    const bd = `2004-01-${String(15 + i).padStart(2, "0")}`;
    await run("INSERT INTO users (role,name,nim,email,class_name,study_program,password_hash,birth_date,must_change_password) VALUES ('mahasiswa',?,?,?,?,'Teknik Informatika',?,?,1) ON DUPLICATE KEY UPDATE birth_date=VALUES(birth_date),password_hash=VALUES(password_hash),must_change_password=1", [names[i], nim, `${nim}@mhs.kampus.ac.id`, i < 4 ? "TI-3A" : "TI-3B", bcrypt.hashSync(studentPassword(bd, nim), 10), bd]);
    S.push(await one("SELECT id FROM users WHERE nim=?", [nim]));
  }
  const courses = [["TI101", "Pemrograman Web", L[0], 3], ["TI102", "Basis Data", L[1], 3], ["TI103", "Rekayasa Perangkat Lunak", L[1], 5]];
  const C: number[] = [];
  for (const [code, name, lec, sem] of courses) { await run("INSERT IGNORE INTO courses (code,name,lecturer_id,semester) VALUES (?,?,?,?)", [code, name, lec, sem]); C.push(await one("SELECT id FROM courses WHERE code=?", [code as string])); }

  const tasks: [string, string, string, number, number, string, string, string][] = [
    ["TGS-WEB-8F29", "Membuat Website Portfolio", "Buat website portfolio interaktif dengan HTML, CSS, dan JavaScript. Minimal 4 halaman: Beranda, Profil, Proyek, dan Kontak.", 0, 0, "individu", "project", "DATE_ADD(NOW(), INTERVAL 2 DAY)"],
    ["TGS-DB-3K71", "Membuat ERD Sistem Informasi", "Rancang ERD lengkap dengan kardinalitas untuk studi kasus perpustakaan digital.", 1, 1, "kelompok", "laporan", "DATE_ADD(NOW(), INTERVAL 5 DAY)"],
    ["TGS-RPL-5Q02", "Presentasi RPL", "Presentasikan hasil review sprint proyek akhir.", 2, 1, "individu", "presentasi", "DATE_SUB(NOW(), INTERVAL 3 DAY)"],
  ];
  const T: number[] = [];
  for (const [code, title, desc, ci, li, type, as, dl] of tasks) {
    await run(`INSERT IGNORE INTO tasks (lecturer_id,course_id,code,title,description,task_type,assessment_type,deadline) VALUES (?,?,?,?,?,?,?,${dl})`, [L[li], C[ci], code, title, desc, type, as]);
    T.push(await one("SELECT id FROM tasks WHERE code=?", [code]));
  }
  const claims: [number, number[], number[]][] = [[0, [0, 1, 2, 3, 4, 5], [100, 100, 60, 40, 20, 0]], [1, [0, 1, 2], [100, 50, 0]], [2, [0, 3], [100, 30]]];
  const TS: Record<string, number> = {};
  for (const [ti, studs, prog] of claims) for (let k = 0; k < studs.length; k++) {
    await run("INSERT IGNORE INTO task_students (task_id,student_id,progress,status) VALUES (?,?,?,?)", [T[ti], S[studs[k]], prog[k], statusOf(prog[k])]);
    const id = await one("SELECT id FROM task_students WHERE task_id=? AND student_id=?", [T[ti], S[studs[k]]]);
    TS[`${ti}-${studs[k]}`] = id;
    const has = await one("SELECT id FROM subtasks WHERE task_student_id=? LIMIT 1", [id]);
    if (!has && prog[k] > 0) {
      const titles = ["Rancang struktur", "Buat halaman utama", "Buat halaman profil", "Styling CSS", "Uji responsif"];
      for (let j = 0; j < 5; j++) await run("INSERT INTO subtasks (task_student_id,title,is_completed) VALUES (?,?,?)", [id, titles[j], j < Math.round(prog[k] / 20) ? 1 : 0]);
    }
  }
  await run("INSERT IGNORE INTO task_submissions (task_student_id,submitted_at,status) VALUES (?,DATE_SUB(NOW(), INTERVAL 1 HOUR),'submitted')", [TS["0-0"]]);
  await run("INSERT IGNORE INTO task_submissions (task_student_id,submitted_at,status,grade,feedback,graded_at) VALUES (?,DATE_SUB(NOW(), INTERVAL 1 DAY),'graded',85,'Struktur sudah rapi. Tambahkan breakpoint tablet.',NOW())", [TS["0-1"]]);
  await run("INSERT IGNORE INTO task_submissions (task_student_id,submitted_at,status) VALUES (?,DATE_SUB(NOW(), INTERVAL 1 DAY),'submitted')", [TS["1-0"]]);
  await run("INSERT IGNORE INTO task_submissions (task_student_id,submitted_at,status) VALUES (?,NOW(),'late')", [TS["2-0"]]);

  const [[{ n }]]: any = await db.query("SELECT COUNT(*) n FROM activity_logs");
  if (Number(n) === 0) for (const d of ["Dosen Budi Santoso ditambahkan oleh Admin", "Mahasiswa Raffi Ahmad (230123001) ditambahkan", "Mata kuliah Pemrograman Web ditambahkan"]) await run("INSERT INTO activity_logs (user_id,action,description) VALUES (NULL,'seed',?)", [d]);
  console.log("Seed selesai. Dosen: NIP 198701012015041002 / dosen123 | Mahasiswa: 230123001 / 1501200401 (tgl lahir DDMMYYYY + 2 digit akhir NIM)");
  await db.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
