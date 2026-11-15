import { query } from "@/lib/database";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  const me = await getSession();
  if (!me) return Response.json([], { status: 401 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return Response.json([]);
  const l = `%${q}%`;
  let out: { label: string; sub: string; href: string }[] = [];
  if (me.role === "admin") {
    const u = await query("SELECT id,role,name,nim,nip FROM users WHERE role IN ('dosen','mahasiswa') AND (name LIKE ? OR nim LIKE ? OR nip LIKE ?) LIMIT 5", [l, l, l]);
    const c = await query("SELECT id,code,name FROM courses WHERE name LIKE ? OR code LIKE ? LIMIT 3", [l, l]);
    out = [...u.map((x: any) => ({ label: x.name, sub: x.role === "dosen" ? "Dosen" : `Mahasiswa • ${x.nim}`, href: `/admin/${x.role}/${x.id}/edit` })),
      ...c.map((x: any) => ({ label: x.name, sub: `Mata Kuliah • ${x.code}`, href: `/admin/mata-kuliah/${x.id}/edit` }))];
  } else if (me.role === "dosen") {
    const t = await query("SELECT id,code,title FROM tasks WHERE lecturer_id=? AND (title LIKE ? OR code LIKE ?) LIMIT 5", [me.uid, l, l]);
    const s = await query(`SELECT DISTINCT t.id task_id,u.name,u.nim FROM task_students ts JOIN tasks t ON t.id=ts.task_id JOIN users u ON u.id=ts.student_id
      WHERE t.lecturer_id=? AND (u.name LIKE ? OR u.nim LIKE ?) LIMIT 5`, [me.uid, l, l]);
    out = [...t.map((x: any) => ({ label: x.title, sub: `Tugas • ${x.code}`, href: `/dosen/tugas/${x.id}` })),
      ...s.map((x: any) => ({ label: x.name, sub: `Mahasiswa • ${x.nim}`, href: `/dosen/pengumpulan?task=${x.task_id}&q=${encodeURIComponent(x.nim)}` }))];
  } else {
    const t = await query(`SELECT t.id,t.title,t.code FROM task_students ts JOIN tasks t ON t.id=ts.task_id WHERE ts.student_id=? AND (t.title LIKE ? OR t.code LIKE ?) LIMIT 8`, [me.uid, l, l]);
    out = t.map((x: any) => ({ label: x.title, sub: `Tugas • ${x.code}`, href: `/mahasiswa/tugas/${x.id}` }));
  }
  return Response.json(out);
}
