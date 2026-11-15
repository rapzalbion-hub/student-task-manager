"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { taskCode } from "@/lib/codes";
import { realFiles, saveFiles } from "@/lib/uploads";
import { notify } from "@/lib/notify";

const go = (p: string, e: string): never => redirect(`${p}?error=${encodeURIComponent(e)}`);
function withDeadline(fd: FormData) {
  const o: Record<string, any> = Object.fromEntries(fd);
  o.deadline = `${o.deadline_date ?? ""}T${o.deadline_hour ?? ""}:${o.deadline_minute ?? ""}`;
  return o;
}
const dt = (s: string) => s.replace("T", " ") + ":00";
const taskSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(200, "Judul maksimal 200 karakter"),
  description: z.string().trim().min(1, "Deskripsi wajib diisi"),
  assessment_type: z.enum(["project", "quiz", "laporan", "presentasi", "lainnya"]),
  task_type: z.enum(["individu", "kelompok"]),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Deadline tidak valid"),
});
async function addAttachments(taskId: number, fd: FormData, back: string) {
  const sv = await saveFiles(realFiles(fd, "attachments"), 10);
  if (sv.error) go(back, sv.error);
  for (const f of sv.saved ?? []) await query("INSERT INTO attachments (task_id,original_name,stored_name,file_type,file_size) VALUES (?,?,?,?,?)", [taskId, f.original, f.stored, f.type, f.size]);
}

export async function createTask(fd: FormData) {
  const me = await requireRole("dosen");
  const back = "/dosen/tugas/baru";
  const t = taskSchema.extend({ course_id: z.coerce.number().int().positive("Pilih mata kuliah") }).safeParse(withDeadline(fd));
  if (!t.success) go(back, t.error.issues[0].message);
  const d = t.data!;
  if (new Date(d.deadline) <= new Date()) go(back, "Deadline harus berada di waktu mendatang.");
  const [c] = await query("SELECT name FROM courses WHERE id=? AND lecturer_id=? AND status='active'", [d.course_id, me.uid]);
  if (!c) go(back, "Mata kuliah tidak valid.");
  const sv = await saveFiles(realFiles(fd, "attachments"), 10);
  if (sv.error) go(back, sv.error);
  let id = 0;
  for (let i = 0; i < 5 && !id; i++) {
    try {
      const r: any = await query("INSERT INTO tasks (lecturer_id,course_id,code,title,description,task_type,assessment_type,deadline) VALUES (?,?,?,?,?,?,?,?)",
        [me.uid, d.course_id, taskCode(c.name), d.title, d.description, d.task_type, d.assessment_type, dt(d.deadline)]);
      id = r.insertId;
    } catch (e: any) { if (e?.code !== "ER_DUP_ENTRY") throw e; }
  }
  if (!id) go(back, "Gagal membuat Kode Tugas, silakan coba lagi.");
  for (const f of sv.saved ?? []) await query("INSERT INTO attachments (task_id,original_name,stored_name,file_type,file_size) VALUES (?,?,?,?,?)", [id, f.original, f.stored, f.type, f.size]);
  redirect(`/dosen/tugas/${id}?created=1`);
}

export async function updateTask(id: number, fd: FormData) {
  const me = await requireRole("dosen");
  const back = `/dosen/tugas/${id}/edit`;
  const t = taskSchema.extend({ status: z.enum(["active", "closed"]) }).safeParse(withDeadline(fd));
  if (!t.success) go(back, t.error.issues[0].message);
  const d = t.data!;
  if (d.status === "active" && new Date(d.deadline) <= new Date()) go(back, "Tugas tidak dapat berstatus Aktif karena deadline sudah lewat. Ubah deadline ke waktu mendatang.");
  const own = await query("SELECT id FROM tasks WHERE id=? AND lecturer_id=?", [id, me.uid]);
  if (own.length === 0) go("/dosen/tugas", "Tugas tidak ditemukan.");
  await query("UPDATE tasks SET title=?,description=?,assessment_type=?,task_type=?,deadline=?,status=? WHERE id=?", [d.title, d.description, d.assessment_type, d.task_type, dt(d.deadline), d.status, id]);
  await addAttachments(id, fd, back);
  redirect(`/dosen/tugas/${id}?saved=1`);
}

export async function gradeSubmission(tsId: number, fd: FormData) {
  const me = await requireRole("dosen");
  const back = `/dosen/pengumpulan/${tsId}/nilai`;
  const p = z.object({ grade: z.coerce.number().int("Nilai harus bilangan bulat").min(0, "Nilai 0 sampai 100").max(100, "Nilai 0 sampai 100"), feedback: z.string().trim().min(1, "Feedback wajib diisi").max(500, "Feedback maksimal 500 karakter") }).safeParse(Object.fromEntries(fd));
  if (!p.success) go(back, p.error.issues[0].message);
  const [r] = await query(`SELECT sub.id sub_id,ts.student_id,t.id task_id,t.title FROM task_students ts JOIN tasks t ON t.id=ts.task_id
    JOIN task_submissions sub ON sub.task_student_id=ts.id WHERE ts.id=? AND t.lecturer_id=?`, [tsId, me.uid]);
  if (!r) go("/dosen/pengumpulan", "Pengumpulan tidak ditemukan.");
  await query("UPDATE task_submissions SET grade=?,feedback=?,graded_at=NOW(),status='graded' WHERE id=?", [p.data!.grade, p.data!.feedback, r.sub_id]);
  await notify(r.student_id, "graded", `Tugas "${r.title}" telah dinilai: ${p.data!.grade}/100`, `/mahasiswa/tugas/${r.task_id}`);
  redirect(`/dosen/pengumpulan?task=${r.task_id}&graded=1`);
}
