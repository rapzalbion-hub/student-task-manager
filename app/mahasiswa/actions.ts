"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { statusOf } from "@/lib/status";
import { notify } from "@/lib/notify";
import { realFiles, saveFiles, removeStored } from "@/lib/uploads";
import { pool } from "@/lib/database";

const go = (p: string, e: string): never => redirect(`${p}?error=${encodeURIComponent(e)}`);

export async function claimTask(_prev: { error?: string } | undefined, fd: FormData): Promise<{ error?: string }> {
  const me = await requireRole("mahasiswa");
  const code = String(fd.get("code") ?? "").trim().toUpperCase();
  if (!code) return { error: "Kode tugas tidak boleh kosong." };
  if (!/^TGS-[A-Z0-9]{1,3}-[A-Z0-9]{4}$/.test(code)) return { error: "Format kode salah. Contoh format: TGS-WEB-8F29." };
  const [t] = await query("SELECT id,status,(deadline<NOW()) past FROM tasks WHERE code=?", [code]);
  if (!t || t.status !== "active" || Number(t.past) === 1) return { error: "Kode tugas tidak ditemukan atau sudah tidak aktif." };
  const ex = await query("SELECT id FROM task_students WHERE task_id=? AND student_id=?", [t.id, me.uid]);
  if (ex.length) return { error: "Tugas ini sudah pernah Anda ambil." };
  try { await query("INSERT INTO task_students (task_id,student_id) VALUES (?,?)", [t.id, me.uid]); }
  catch (e: any) { return { error: e?.code === "23505" ? "Tugas ini sudah pernah Anda ambil." : "Gagal mengambil tugas." }; }
  redirect(`/mahasiswa/tugas/${t.id}`);
}

async function own(tsId: number, uid: number) {
  const [r] = await query("SELECT ts.id,ts.task_id,t.deadline,t.title,t.lecturer_id FROM task_students ts JOIN tasks t ON t.id=ts.task_id WHERE ts.id=? AND ts.student_id=?", [tsId, uid]);
  if (!r) redirect("/mahasiswa/tugas-saya");
  return r;
}
async function recalc(tsId: number) {
  const [r] = await query("SELECT COUNT(*) total,COUNT(*) FILTER (WHERE is_completed) done FROM subtasks WHERE task_student_id=?", [tsId]);
  if (Number(r.total) === 0) return;
  const pr = Math.round((Number(r.done) / Number(r.total)) * 100);
  await query("UPDATE task_students SET progress=?,status=? WHERE id=?", [pr, statusOf(pr), tsId]);
}
const done = (row: any) => revalidatePath(`/mahasiswa/tugas/${row.task_id}`);

export async function addSubtask(tsId: number, fd: FormData) {
  const me = await requireRole("mahasiswa");
  const row = await own(tsId, me.uid);
  const title = String(fd.get("title") ?? "").trim().slice(0, 200);
  if (!title) return;
  await query("INSERT INTO subtasks (task_student_id,title) VALUES (?,?)", [tsId, title]);
  await recalc(tsId); done(row);
}
export async function toggleSubtask(tsId: number, subId: number, _fd: FormData) {
  const me = await requireRole("mahasiswa");
  const row = await own(tsId, me.uid);
  await query("UPDATE subtasks SET is_completed=NOT is_completed WHERE id=? AND task_student_id=?", [subId, tsId]);
  await recalc(tsId); done(row);
}
export async function renameSubtask(tsId: number, subId: number, fd: FormData) {
  const me = await requireRole("mahasiswa");
  const row = await own(tsId, me.uid);
  const title = String(fd.get("title") ?? "").trim().slice(0, 200);
  if (title) await query("UPDATE subtasks SET title=? WHERE id=? AND task_student_id=?", [title, subId, tsId]);
  done(row);
}
export async function deleteSubtask(tsId: number, subId: number, _fd: FormData) {
  const me = await requireRole("mahasiswa");
  const row = await own(tsId, me.uid);
  await query("DELETE FROM subtasks WHERE id=? AND task_student_id=?", [subId, tsId]);
  await recalc(tsId); done(row);
}
export async function setProgress(tsId: number, fd: FormData) {
  const me = await requireRole("mahasiswa");
  const row = await own(tsId, me.uid);
  const [c] = await query("SELECT COUNT(*) n FROM subtasks WHERE task_student_id=?", [tsId]);
  if (Number(c.n) > 0) return;
  const p = Math.min(100, Math.max(0, Math.round(Number(fd.get("progress")) || 0)));
  await query("UPDATE task_students SET progress=?,status=? WHERE id=?", [p, statusOf(p), tsId]);
  done(row);
}
export async function saveNotes(tsId: number, fd: FormData) {
  const me = await requireRole("mahasiswa");
  const row = await own(tsId, me.uid);
  await query("UPDATE task_students SET notes=? WHERE id=?", [String(fd.get("notes") ?? "").slice(0, 5000), tsId]);
  done(row);
}

export async function submitTask(tsId: number, fd: FormData) {
  const me = await requireRole("mahasiswa");
  const row = await own(tsId, me.uid);
  const back = `/mahasiswa/tugas/${row.task_id}`;
  const files = realFiles(fd, "files");
  if (files.length === 0) go(back, "Pilih minimal satu file untuk dikumpulkan.");
  const [lt] = await query("SELECT (NOW()>deadline) late FROM tasks WHERE id=?", [row.task_id]);
  const late = Number(lt.late) === 1;
  const status = late ? "late" : "submitted";
  const conn = await pool.connect();
  let sv;
  try { sv = await saveFiles(files, 5); }
  catch (e) { conn.release(); throw e; }
  if (sv.error) { conn.release(); go(back, sv.error); }
  const saved = sv.saved ?? [];
  let oldNames: string[] = [];
  let rejected = false;
  try {
    await conn.query("BEGIN");
    await conn.query("SELECT id FROM task_students WHERE id=$1 AND student_id=$2 FOR UPDATE", [tsId, me.uid]);
    const subs = await conn.query("SELECT id,status FROM task_submissions WHERE task_student_id=$1", [tsId]);
    const sub = subs.rows[0];
    if (sub?.status === "graded") {
      rejected = true;
      await conn.query("ROLLBACK");
    } else {
      let subId: number;
      if (sub) {
        const old = await conn.query("SELECT stored_name FROM submission_files WHERE submission_id=$1", [sub.id]);
        oldNames = old.rows.map((f: any) => f.stored_name);
        await conn.query("DELETE FROM submission_files WHERE submission_id=$1", [sub.id]);
        await conn.query("UPDATE task_submissions SET submitted_at=NOW(),status=$1 WHERE id=$2", [status, sub.id]);
        subId = sub.id;
      } else {
        const result = await conn.query("INSERT INTO task_submissions (task_student_id,submitted_at,status) VALUES ($1,NOW(),$2) RETURNING id", [tsId, status]);
        subId = result.rows[0].id;
      }
      for (const f of saved) await conn.query("INSERT INTO submission_files (submission_id,original_name,stored_name,file_type,file_size) VALUES ($1,$2,$3,$4,$5)", [subId, f.original, f.stored, f.type, f.size]);
      await conn.query("COMMIT");
    }
  } catch (e) {
    await conn.query("ROLLBACK");
    await removeStored(saved.map((f) => f.stored));
    throw e;
  } finally {
    conn.release();
  }
  if (rejected) {
    await removeStored(saved.map((f) => f.stored));
    go(back, "Tugas sudah dinilai dan tidak dapat diubah.");
  }
  await removeStored(oldNames);
  await notify(row.lecturer_id, late ? "late_submission" : "submission", `${me.name} ${late ? "mengumpulkan terlambat" : "mengumpulkan"}: ${row.title}`, `/dosen/pengumpulan/${tsId}/nilai`);
  redirect(`${back}?ok=1`);
}
