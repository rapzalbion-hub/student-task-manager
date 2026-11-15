"use server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { query } from "@/lib/database";
import { requireAdmin } from "@/lib/guard";
import { studentPassword } from "@/lib/password";

const str = (m = "Wajib diisi") => z.string().trim().min(1, m);
const status = z.enum(["active", "pending", "inactive"]);
const pw = z.string().min(8, "Password minimal 8 karakter");
const go = (path: string, error: string): never => redirect(`${path}?error=${encodeURIComponent(error)}`);
const first = (r: { error: z.ZodError }) => r.error.issues[0].message;
const isDup = (e: any) => e?.code === "23505";
const ALERT = ["dosen.create", "dosen.status", "dosen.reset", "mahasiswa.create", "mahasiswa.status", "mahasiswa.reset"];
const log = async (uid: number, action: string, desc: string) => {
  await query("INSERT INTO activity_logs (user_id,action,description) VALUES (?,?,?)", [uid, action, desc]);
  // Notifikasi untuk Admin: aktivitas akun yang perlu perhatian
  if (ALERT.includes(action)) await query("INSERT INTO notifications (user_id,type,message,link) SELECT id,'account',?,NULL FROM users WHERE role='admin'", [desc]);
};
async function tryDb(fn: () => Promise<unknown>, dup: string) {
  try { await fn(); return ""; } catch (e: any) { console.error(e); return isDup(e) ? dup : "Gagal menyimpan data."; }
}

/* ---------- DOSEN ---------- */
const lecturerBase = { name: str("Nama wajib diisi"), nip: str("NIP wajib diisi"), email: z.string().trim().email("Email tidak valid") };

export async function createLecturer(fd: FormData) {
  const s = await requireAdmin();
  const p = z.object({ ...lecturerBase, status: z.enum(["active", "pending"]), password: pw }).safeParse(Object.fromEntries(fd));
  if (!p.success) go("/admin/dosen/tambah", first(p));
  const d = p.data!;
  let id = 0;
  const err = await tryDb(async () => {
    const [r]: any = await query("INSERT INTO users (role,name,nip,email,password_hash,status,must_change_password) VALUES ('dosen',?,?,?,?,?,TRUE) RETURNING id",
      [d.name, d.nip, d.email.toLowerCase(), await bcrypt.hash(d.password, 10), d.status]);
    id = r.id;
  }, "NIP atau email sudah terdaftar.");
  if (err) go("/admin/dosen/tambah", err);
  await log(s.uid, "dosen.create", `Dosen ${d.name} ditambahkan oleh Admin`);
  redirect(`/admin/dosen/${id}/edit?created=1`);
}

export async function updateLecturer(id: number, fd: FormData) {
  const s = await requireAdmin();
  const path = `/admin/dosen/${id}/edit`;
  const p = z.object(lecturerBase).safeParse(Object.fromEntries(fd));
  if (!p.success) go(path, first(p));
  const d = p.data!;
  const err = await tryDb(() => query("UPDATE users SET name=?,nip=?,email=? WHERE id=? AND role='dosen'", [d.name, d.nip, d.email, id]), "NIP atau email sudah dipakai.");
  if (err) go(path, err);
  await log(s.uid, "dosen.update", `Data dosen ${d.name} diperbarui`);
  redirect(`${path}?saved=1`);
}

export async function setLecturerStatus(id: number, st: "active" | "inactive", _fd: FormData) {
  const s = await requireAdmin();
  await query("UPDATE users SET status=? WHERE id=? AND role='dosen'", [st, id]);
  await log(s.uid, "dosen.status", `Akun dosen #${id} ${st === "active" ? "diaktifkan" : "dinonaktifkan"}`);
  redirect(`/admin/dosen/${id}/edit?saved=1`);
}

export async function resetLecturerPassword(id: number, fd: FormData) {
  const s = await requireAdmin();
  const path = `/admin/dosen/${id}/edit`;
  const pass = String(fd.get("password") ?? "");
  if (pass.length < 8) go(path, "Password minimal 8 karakter.");
  const r = await query("UPDATE users SET password_hash=?,must_change_password=TRUE WHERE id=? AND role='dosen' RETURNING id", [await bcrypt.hash(pass, 10), id]);
  if (!r.length) go("/admin/dosen", "Dosen tidak ditemukan.");
  await log(s.uid, "dosen.reset", `Password dosen #${id} direset`);
  redirect(`${path}?saved=1`);
}

/* ---------- MAHASISWA ---------- */
const birth = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal lahir wajib diisi").refine((v) => { const d = new Date(v); return !isNaN(+d) && d < new Date() && d.getFullYear() >= 1950; }, "Tanggal lahir tidak valid");
const studentBase = { name: str("Nama wajib diisi"), email: z.string().trim().email("Email tidak valid"), class_name: str("Kelas wajib diisi"), study_program: str("Program studi wajib diisi") };

export async function createStudent(fd: FormData) {
  const s = await requireAdmin();
  const p = z.object({ ...studentBase, nim: z.string().trim().regex(/^\d{5,20}$/, "NIM harus berupa angka (5-20 digit)"), status: z.enum(["active", "pending"]), birth_date: birth }).safeParse(Object.fromEntries(fd));
  if (!p.success) go("/admin/mahasiswa/tambah", first(p));
  const d = p.data!;
  const err = await tryDb(async () => query("INSERT INTO users (role,name,nim,email,class_name,study_program,birth_date,password_hash,status,must_change_password) VALUES ('mahasiswa',?,?,?,?,?,?,?,?,TRUE)",
    [d.name, d.nim, d.email, d.class_name, d.study_program, d.birth_date, await bcrypt.hash(studentPassword(d.birth_date, d.nim), 10), d.status]), "NIM atau email sudah terdaftar.");
  if (err) go("/admin/mahasiswa/tambah", err);
  await log(s.uid, "mahasiswa.create", `Mahasiswa ${d.name} (${d.nim}) ditambahkan`);
  redirect("/admin/mahasiswa?created=1");
}

export async function updateStudent(id: number, fd: FormData) {
  const s = await requireAdmin();
  const path = `/admin/mahasiswa/${id}/edit`;
  const p = z.object({ ...studentBase, birth_date: birth.or(z.literal("")) }).safeParse(Object.fromEntries(fd));
  if (!p.success) go(path, first(p));
  const d = p.data!;
  const err = await tryDb(() => query("UPDATE users SET name=?,email=?,class_name=?,study_program=?,birth_date=? WHERE id=? AND role='mahasiswa'", [d.name, d.email, d.class_name, d.study_program, d.birth_date || null, id]), "Email sudah dipakai.");
  if (err) go(path, err);
  await log(s.uid, "mahasiswa.update", `Data mahasiswa ${d.name} diperbarui`);
  redirect(`${path}?saved=1`);
}

export async function resetStudentPassword(id: number, fd: FormData) {
  const s = await requireAdmin();
  const path = `/admin/mahasiswa/${id}/edit`;
  let pass = String(fd.get("password") ?? "").trim();
  const generated = !pass;
  if (generated) {
    const [u] = await query("SELECT nim,TO_CHAR(birth_date,'YYYY-MM-DD') bd FROM users WHERE id=? AND role='mahasiswa'", [id]);
    pass = u?.bd ? studentPassword(u.bd, u.nim) : randomBytes(6).toString("base64url");
  }
  else if (pass.length < 8) go(path, "Password minimal 8 karakter.");
  await query("UPDATE users SET password_hash=?,must_change_password=TRUE WHERE id=? AND role='mahasiswa'", [await bcrypt.hash(pass, 10), id]);
  await log(s.uid, "mahasiswa.reset", `Password mahasiswa #${id} direset`);
  redirect(`${path}?saved=1${generated ? `&newpw=${encodeURIComponent(pass)}` : ""}`);
}

export async function setStudentStatus(id: number, st: "active" | "inactive", _fd: FormData) {
  const s = await requireAdmin();
  await query("UPDATE users SET status=? WHERE id=? AND role='mahasiswa'", [st, id]);
  await log(s.uid, "mahasiswa.status", `Akun mahasiswa #${id} ${st === "active" ? "diaktifkan" : "dinonaktifkan"}`);
  redirect(`/admin/mahasiswa/${id}/edit?saved=1`);
}

/* ---------- MATA KULIAH ---------- */
const courseSchema = z.object({ code: str("Kode wajib diisi").transform((v) => v.toUpperCase()), name: str("Nama wajib diisi"), lecturer_id: z.coerce.number().int().positive("Pilih dosen pengampu"), semester: z.coerce.number().int().min(1, "Semester 1-14").max(14, "Semester 1-14") });

async function lecturerOk(id: number) {
  const r = await query("SELECT id FROM users WHERE id=? AND role='dosen' AND status='active'", [id]);
  return r.length > 0;
}
export async function createCourse(fd: FormData) {
  const s = await requireAdmin();
  const p = courseSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) go("/admin/mata-kuliah/tambah", first(p));
  const d = p.data!;
  if (!(await lecturerOk(d.lecturer_id))) go("/admin/mata-kuliah/tambah", "Dosen pengampu harus berstatus aktif.");
  const err = await tryDb(() => query("INSERT INTO courses (code,name,lecturer_id,semester) VALUES (?,?,?,?)", [d.code, d.name, d.lecturer_id, d.semester]), "Kode mata kuliah sudah dipakai.");
  if (err) go("/admin/mata-kuliah/tambah", err);
  await log(s.uid, "course.create", `Mata kuliah ${d.name} ditambahkan`);
  redirect("/admin/mata-kuliah");
}
export async function updateCourse(id: number, fd: FormData) {
  const s = await requireAdmin();
  const path = `/admin/mata-kuliah/${id}/edit`;
  const p = courseSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) go(path, first(p));
  const d = p.data!;
  if (!(await lecturerOk(d.lecturer_id))) go(path, "Dosen pengampu harus berstatus aktif.");
  const err = await tryDb(() => query("UPDATE courses SET code=?,name=?,lecturer_id=?,semester=? WHERE id=?", [d.code, d.name, d.lecturer_id, d.semester, id]), "Kode mata kuliah sudah dipakai.");
  if (err) go(path, err);
  await log(s.uid, "course.update", `Mata kuliah ${d.name} diperbarui`);
  redirect(`${path}?saved=1`);
}
export async function setCourseStatus(id: number, st: "active" | "inactive", _fd: FormData) {
  const s = await requireAdmin();
  await query("UPDATE courses SET status=? WHERE id=?", [st, id]);
  await log(s.uid, "course.status", `Mata kuliah #${id} ${st === "active" ? "diaktifkan" : "dinonaktifkan"}`);
  redirect(`/admin/mata-kuliah/${id}/edit?saved=1`);
}
