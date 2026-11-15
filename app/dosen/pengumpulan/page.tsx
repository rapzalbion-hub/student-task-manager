import Link from "next/link";
import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { PER, pageOf, like, fmtDate } from "@/lib/utils";
import { PageHeader, DataTable, Pagination, Notice } from "@/components/ui";
import { StatCard, Pill } from "@/components/badges";
import AutoSelect from "@/components/AutoSelect";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireRole("dosen");
  const sp = await searchParams;
  const tasks = await query("SELECT t.id,t.code,t.title,c.name course FROM tasks t JOIN courses c ON c.id=t.course_id WHERE t.lecturer_id=? ORDER BY t.created_at DESC", [me.uid]);
  const task = tasks.find((t: any) => String(t.id) === sp.task) ?? tasks[0];
  const f = ["sudah", "belum"].includes(sp.f ?? "") ? sp.f! : "";
  const page = pageOf(sp.page);
  let stats: any = { claimed: 0, submitted: 0, ungraded: 0 }, rows: any[] = [], total = 0, classes: any[] = [];
  if (task) {
    classes = await query("SELECT DISTINCT u.class_name FROM task_students ts JOIN users u ON u.id=ts.student_id WHERE ts.task_id=? AND u.class_name IS NOT NULL AND u.class_name<>'' ORDER BY u.class_name", [task.id]);
    const kelas = classes.some((c: any) => c.class_name === sp.kelas) ? sp.kelas! : "";
    [stats] = await query(`SELECT COUNT(*) claimed,COUNT(s.id) submitted,COUNT(*) FILTER (WHERE s.id IS NOT NULL AND s.status<>'graded') ungraded
      FROM task_students ts LEFT JOIN task_submissions s ON s.task_student_id=ts.id WHERE ts.task_id=?`, [task.id]);
    const w = "ts.task_id=? AND (u.name LIKE ? OR u.nim LIKE ? OR u.class_name LIKE ?)" + (f === "sudah" ? " AND s.id IS NOT NULL" : f === "belum" ? " AND s.id IS NULL" : "") + (kelas ? " AND u.class_name=?" : "");
    const p = [task.id, like(sp.q), like(sp.q), like(sp.q), ...(kelas ? [kelas] : [])];
    [{ n: total }] = await query(`SELECT COUNT(*) n FROM task_students ts JOIN users u ON u.id=ts.student_id LEFT JOIN task_submissions s ON s.task_student_id=ts.id WHERE ${w}`, p);
    rows = await query(`SELECT ts.id,u.name,u.nim,u.class_name,u.study_program,ts.claimed_at,s.id sub_id,s.submitted_at,s.status,s.grade,(s.submitted_at>t.deadline) late
      FROM task_students ts JOIN tasks t ON t.id=ts.task_id JOIN users u ON u.id=ts.student_id LEFT JOIN task_submissions s ON s.task_student_id=ts.id
      WHERE ${w} ORDER BY u.class_name,u.name LIMIT ${PER} OFFSET ${(page - 1) * PER}`, p);
  }
  const claimed = Number(stats.claimed), submitted = Number(stats.submitted);
  return (
    <>
      <PageHeader title="Pengumpulan Tugas" sub="Pantau mahasiswa yang mengambil dan mengumpulkan tugas." />
      {sp.graded && <Notice ok="Nilai berhasil disimpan dan mahasiswa telah diberi notifikasi." />}
      <form className="card mb-gutter">
        <label className="mb-space-xs block text-label-sm uppercase text-on-surface-variant">Pilih tugas</label>
        <AutoSelect name="task" defaultValue={String(task?.id ?? "")} className="input">
          {tasks.map((t: any) => <option key={t.id} value={t.id}>{t.title} ({t.code}) — {t.course}</option>)}
        </AutoSelect>
      </form>
      {!task ? <div className="card text-body-md text-on-surface-variant">Anda belum memiliki tugas.</div> : <>
        <div className="grid gap-gutter sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Mengambil" value={claimed} icon="groups" hint="Mahasiswa" />
          <StatCard label="Sudah Mengumpulkan" value={submitted} icon="task_alt" tone="text-[#059669]" />
          <StatCard label="Belum Mengumpulkan" value={claimed - submitted} icon="schedule" tone="text-[#e11d48]" />
          <StatCard label="Belum Dinilai" value={Number(stats.ungraded ?? 0)} icon="rate_review" tone="text-primary" />
        </div>
        <form className="card my-gutter flex flex-wrap items-center gap-space-sm">
          <input type="hidden" name="task" value={task.id} />
          <input name="q" defaultValue={sp.q} placeholder="Cari nama, NIM, atau kelas..." className="input min-w-[200px] flex-1" />
          <AutoSelect name="kelas" defaultValue={sp.kelas} className="input w-auto"><option value="">Semua kelas</option>{classes.map((c: any) => <option key={c.class_name} value={c.class_name}>{c.class_name}</option>)}</AutoSelect>
          <AutoSelect name="f" defaultValue={f} className="input w-auto"><option value="">Filter: Semua yang Mengambil</option><option value="sudah">Sudah Mengumpulkan</option><option value="belum">Belum Mengumpulkan</option></AutoSelect>
          <button className="btn-secondary">Terapkan</button>
        </form>
        <DataTable empty="Belum ada mahasiswa yang mengambil tugas ini." heads={["No", "Mahasiswa", "NIM", "Kelas", "Tgl Ambil", "Pengumpulan", "Waktu Kumpul", "Nilai", "Aksi"]}
          rows={rows.map((r: any, i: number) => [(page - 1) * PER + i + 1,
            <div key="n"><p className="font-semibold">{r.name}</p><p className="text-body-sm text-on-surface-variant">{r.study_program}</p></div>, r.nim, r.class_name || "-", <span key="c" className="whitespace-nowrap">{fmtDate(r.claimed_at)}</span>,
            r.sub_id ? <span key="p" className="flex gap-1"><Pill tone="green">✔ Sudah</Pill>{r.late ? <Pill tone="rose">Terlambat</Pill> : null}</span> : <Pill key="p" tone="rose">✖ Belum</Pill>,
            r.sub_id ? <span key="w" className="whitespace-nowrap">{fmtDate(r.submitted_at)}</span> : "-",
            r.status === "graded" ? <b key="g" className="text-primary">{r.grade}/100</b> : "-",
            !r.sub_id ? "-" : <Link key="a" href={`/dosen/pengumpulan/${r.id}/nilai`} className={r.status === "graded" ? "btn-secondary h-8 px-3" : "btn-primary h-8 px-3"}>{r.status === "graded" ? "Lihat" : "Nilai"}</Link>])} />
        <Pagination page={page} total={Number(total)} base="/dosen/pengumpulan" params={{ task: String(task.id), q: sp.q, kelas: sp.kelas, f }} />
      </>}
    </>
  );
}
