import { promises as fs } from "fs";
import path from "path";
import { query } from "@/lib/database";
import { getSession } from "@/lib/session";
import { UPLOAD_DIR } from "@/lib/uploads";

const INLINE = ["application/pdf", "image/png", "image/jpeg"];

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSession();
  if (!me) return new Response("Unauthorized", { status: 401 });
  const m = /^([sa])(\d+)$/.exec((await params).id);
  if (!m) return new Response("Not found", { status: 404 });
  const n = Number(m[2]);
  let f: any, allowed = false;
  if (m[1] === "s") {
    [f] = await query(`SELECT f.*,ts.student_id,t.lecturer_id FROM submission_files f JOIN task_submissions s ON s.id=f.submission_id
      JOIN task_students ts ON ts.id=s.task_student_id JOIN tasks t ON t.id=ts.task_id WHERE f.id=?`, [n]);
    allowed = !!f && ((me.role === "mahasiswa" && f.student_id === me.uid) || (me.role === "dosen" && f.lecturer_id === me.uid));
  } else {
    [f] = await query(`SELECT a.*,t.lecturer_id,(SELECT COUNT(*) FROM task_students x WHERE x.task_id=a.task_id AND x.student_id=?) claimed
      FROM attachments a JOIN tasks t ON t.id=a.task_id WHERE a.id=?`, [me.uid, n]);
    allowed = !!f && ((me.role === "dosen" && f.lecturer_id === me.uid) || (me.role === "mahasiswa" && Number(f.claimed) > 0));
  }
  if (!allowed) return new Response("Not found", { status: 404 });
  let buf: Buffer;
  try { buf = await fs.readFile(path.join(UPLOAD_DIR, path.basename(f.stored_name))); } catch { return new Response("File tidak ditemukan", { status: 404 }); }
  const inline = INLINE.includes(f.file_type) && new URL(req.url).searchParams.get("download") !== "1";
  return new Response(new Uint8Array(buf), { headers: {
    "Content-Type": INLINE.includes(f.file_type) ? f.file_type : "application/octet-stream",
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(f.original_name)}`,
    "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store",
  } });
}
