import { query } from "./database";
export const notify = (uid: number, type: string, message: string, link?: string) =>
  query("INSERT INTO notifications (user_id,type,message,link) VALUES (?,?,?,?)", [uid, type, message, link ?? null]);

export async function ensureReminders(uid: number) {
  const rows = await query(`SELECT t.id,t.title,(t.deadline::date-CURRENT_DATE) d FROM task_students ts JOIN tasks t ON t.id=ts.task_id
    LEFT JOIN task_submissions s ON s.task_student_id=ts.id
    WHERE ts.student_id=? AND s.id IS NULL AND t.deadline>=NOW() AND t.deadline::date<=CURRENT_DATE+1`, [uid]);
  for (const r of rows) {
    const type = Number(r.d) === 0 ? "deadline_today" : "deadline_h1";
    const link = `/mahasiswa/tugas/${r.id}`;
    const ex = await query("SELECT id FROM notifications WHERE user_id=? AND type=? AND link=? AND created_at::date=CURRENT_DATE", [uid, type, link]);
    if (ex.length === 0) await notify(uid, type, Number(r.d) === 0 ? `Deadline hari ini: ${r.title}` : `Deadline besok: ${r.title}`, link);
  }
}
