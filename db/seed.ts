import "dotenv/config";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { studentPassword } from "../lib/password";

const statusOf = (p: number) => p <= 0 ? "not_started" : p >= 100 ? "completed" : "in_progress";

async function seed() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum diisi di .env");
  const db = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE");
    await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE");
    await db.query(`CREATE TABLE IF NOT EXISTS login_attempts (
      identity_hash CHAR(64) PRIMARY KEY, window_started_at TIMESTAMP(3) NOT NULL, attempts SMALLINT NOT NULL
    )`);
    await db.query("CREATE INDEX IF NOT EXISTS login_attempts_window_started_at_idx ON login_attempts(window_started_at)");
    const run = (sql: string, values: unknown[] = []) => db.query(sql, values);
    const one = async (sql: string, values: unknown[] = []) => (await run(sql, values)).rows[0]?.id as number;
    const lecturerHash = bcrypt.hashSync("dosen123", 10);

    await run("INSERT INTO users (role,username,name,email,password_hash) VALUES ('admin',$1,'Administrator','admin@kampus.ac.id',$2) ON CONFLICT (username) DO NOTHING",
      [process.env.ADMIN_USERNAME || "admin", bcrypt.hashSync(process.env.ADMIN_PASSWORD || "admin12345", 10)]);

    const lecturers = [
      ["Budi Santoso, M.Kom", "198701012015041002", "budi@kampus.ac.id", "active"],
      ["Sinta Dewi, M.T", "199002132018012001", "sinta@kampus.ac.id", "active"],
      ["Andi Pratama, Ph.D", "199103011520031003", "andi@kampus.ac.id", "pending"],
    ];
    const lecturerIds: number[] = [];
    for (const [name, nip, email, st] of lecturers) {
      await run(`INSERT INTO users (role,name,nip,email,password_hash,status,must_change_password)
        VALUES ('dosen',$1,$2,$3,$4,$5,TRUE) ON CONFLICT (nip) DO UPDATE SET must_change_password=TRUE`, [name, nip, email, lecturerHash, st]);
      lecturerIds.push(await one("SELECT id FROM users WHERE nip=$1", [nip]));
    }

    const names = ["Raffi Ahmad", "Andi Pratama", "Sinta Marina", "Dian Pratama", "Rizky Maulana", "Putri Ayu", "Bagas Saputra", "Nadia Safitri"];
    const studentIds: number[] = [];
    for (let i = 0; i < names.length; i++) {
      const nim = `230123${String(i + 1).padStart(3, "0")}`;
      const birthDate = `2004-01-${String(15 + i).padStart(2, "0")}`;
      await run(`INSERT INTO users (role,name,nim,email,class_name,study_program,password_hash,birth_date,must_change_password)
        VALUES ('mahasiswa',$1,$2,$3,$4,'Teknik Informatika',$5,$6,TRUE)
        ON CONFLICT (nim) DO UPDATE SET birth_date=EXCLUDED.birth_date,password_hash=EXCLUDED.password_hash,must_change_password=TRUE`,
      [names[i], nim, `${nim}@mhs.kampus.ac.id`, i < 4 ? "TI-3A" : "TI-3B", bcrypt.hashSync(studentPassword(birthDate, nim), 10), birthDate]);
      studentIds.push(await one("SELECT id FROM users WHERE nim=$1", [nim]));
    }

    const courses = [["TI101", "Pemrograman Web", lecturerIds[0], 3], ["TI102", "Basis Data", lecturerIds[1], 3], ["TI103", "Rekayasa Perangkat Lunak", lecturerIds[1], 5]] as const;
    const courseIds: number[] = [];
    for (const [code, name, lecturerId, semester] of courses) {
      await run("INSERT INTO courses (code,name,lecturer_id,semester) VALUES ($1,$2,$3,$4) ON CONFLICT (code) DO NOTHING", [code, name, lecturerId, semester]);
      courseIds.push(await one("SELECT id FROM courses WHERE code=$1", [code]));
    }

    const taskRows = [
      ["TGS-WEB-8F29", "Membuat Website Portfolio", "Buat website portfolio interaktif dengan HTML, CSS, dan JavaScript. Minimal 4 halaman: Beranda, Profil, Proyek, dan Kontak.", 0, 0, "individu", "project", 2],
      ["TGS-DB-3K71", "Membuat ERD Sistem Informasi", "Rancang ERD lengkap dengan kardinalitas untuk studi kasus perpustakaan digital.", 1, 1, "kelompok", "laporan", 5],
      ["TGS-RPL-5Q02", "Presentasi RPL", "Presentasikan hasil review sprint proyek akhir.", 2, 1, "individu", "presentasi", -3],
    ] as const;
    const taskIds: number[] = [];
    for (const [code, title, description, courseIndex, lecturerIndex, taskType, assessment, offset] of taskRows) {
      const deadline = new Date(Date.now() + offset * 86_400_000);
      await run(`INSERT INTO tasks (lecturer_id,course_id,code,title,description,task_type,assessment_type,deadline)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (code) DO NOTHING`,
      [lecturerIds[lecturerIndex], courseIds[courseIndex], code, title, description, taskType, assessment, deadline]);
      taskIds.push(await one("SELECT id FROM tasks WHERE code=$1", [code]));
    }

    const claims: [number, number[], number[]][] = [[0, [0, 1, 2, 3, 4, 5], [100, 100, 60, 40, 20, 0]], [1, [0, 1, 2], [100, 50, 0]], [2, [0, 3], [100, 30]]];
    const taskStudentIds: Record<string, number> = {};
    for (const [taskIndex, students, progress] of claims) for (let k = 0; k < students.length; k++) {
      const studentIndex = students[k];
      await run("INSERT INTO task_students (task_id,student_id,progress,status) VALUES ($1,$2,$3,$4) ON CONFLICT (task_id,student_id) DO NOTHING",
        [taskIds[taskIndex], studentIds[studentIndex], progress[k], statusOf(progress[k])]);
      const id = await one("SELECT id FROM task_students WHERE task_id=$1 AND student_id=$2", [taskIds[taskIndex], studentIds[studentIndex]]);
      taskStudentIds[`${taskIndex}-${studentIndex}`] = id;
      const has = await one("SELECT id FROM subtasks WHERE task_student_id=$1 LIMIT 1", [id]);
      if (!has && progress[k] > 0) {
        const titles = ["Rancang struktur", "Buat halaman utama", "Buat halaman profil", "Styling CSS", "Uji responsif"];
        for (let j = 0; j < 5; j++) await run("INSERT INTO subtasks (task_student_id,title,is_completed) VALUES ($1,$2,$3)", [id, titles[j], j < Math.round(progress[k] / 20)]);
      }
    }

    const submissions = [
      ["0-0", new Date(Date.now() - 3_600_000), "submitted", null, null, null],
      ["0-1", new Date(Date.now() - 86_400_000), "graded", 85, "Struktur sudah rapi. Tambahkan breakpoint tablet.", new Date()],
      ["1-0", new Date(Date.now() - 86_400_000), "submitted", null, null, null],
      ["2-0", new Date(), "late", null, null, null],
    ] as const;
    for (const [key, submittedAt, status, grade, feedback, gradedAt] of submissions) {
      await run(`INSERT INTO task_submissions (task_student_id,submitted_at,status,grade,feedback,graded_at)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (task_student_id) DO NOTHING`,
      [taskStudentIds[key], submittedAt, status, grade, feedback, gradedAt]);
    }

    const count = await run("SELECT COUNT(*)::int n FROM activity_logs");
    if (count.rows[0].n === 0) for (const description of ["Dosen Budi Santoso ditambahkan oleh Admin", "Mahasiswa Raffi Ahmad (230123001) ditambahkan", "Mata kuliah Pemrograman Web ditambahkan"]) {
      await run("INSERT INTO activity_logs (user_id,action,description) VALUES (NULL,'seed',$1)", [description]);
    }
    console.log("Seed selesai. Dosen: NIP 198701012015041002 / dosen123 | Mahasiswa: 230123001 / 1501200401 (tgl lahir DDMMYYYY + 2 digit akhir NIM)");
  } finally {
    await db.end();
  }
}

seed().catch((e) => { console.error(e.message); process.exit(1); });
