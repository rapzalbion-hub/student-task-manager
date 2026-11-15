import Link from "next/link";
import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { PER, pageOf, like, fmtDate } from "@/lib/utils";
import { PageHeader, Toolbar, DataTable, Pagination } from "@/components/ui";
import { Progress, TaskStateBadge } from "@/components/badges";

const OPTS = [["", "Semua Status"], ["not_started", "Belum Dimulai"], ["in_progress", "Sedang Dikerjakan"], ["submitted", "Terkirim"], ["graded", "Dinilai"]];
const COND: Record<string, string> = {
  not_started: " AND s.id IS NULL AND ts.status='not_started'", in_progress: " AND s.id IS NULL AND ts.status<>'not_started'",
  submitted: " AND s.status IN ('submitted','late')", graded: " AND s.status='graded'",
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireRole("mahasiswa");
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const st = COND[sp.status ?? ""] ? sp.status! : "";
  const w = "ts.student_id=? AND (t.title LIKE ? OR c.name LIKE ?)" + (st ? COND[st] : "");
  const p = [me.uid, like(sp.q), like(sp.q)];
  const from = "FROM task_students ts JOIN tasks t ON t.id=ts.task_id JOIN courses c ON c.id=t.course_id LEFT JOIN task_submissions s ON s.task_student_id=ts.id";
  const [{ n }] = await query(`SELECT COUNT(*) n ${from} WHERE ${w}`, p);
  const rows = await query(`SELECT t.id,t.title,t.task_type,c.name course,t.deadline,(t.deadline<NOW()) past,ts.progress,ts.status work,s.status sub,s.grade,(s.submitted_at>t.deadline) late
    ${from} WHERE ${w} ORDER BY t.deadline LIMIT ${PER} OFFSET ${(page - 1) * PER}`, p);
  return (
    <>
      <PageHeader title="Tugas Saya" sub="Daftar tugas kuliah yang sudah Anda ambil dan kelola progresnya." />
      <Toolbar q={sp.q} status={st} opts={OPTS} placeholder="Cari tugas berdasarkan judul atau mata kuliah..." addHref="/mahasiswa/ambil-tugas" addLabel="Ambil Tugas" />
      <DataTable empty="Belum ada tugas. Ambil tugas dengan Kode Tugas dari dosen." heads={["No", "Nama Tugas", "Mata Kuliah", "Deadline", "Progress", "Status", "Aksi"]}
        rows={rows.map((r: any, i: number) => [(page - 1) * PER + i + 1,
          <div key="t"><p className="font-semibold">{r.title}</p><p className="text-body-sm capitalize text-on-surface-variant">{r.task_type}</p></div>, r.course,
          <span key="d" className={`whitespace-nowrap ${Number(r.past) && !r.sub ? "text-[#e11d48]" : ""}`}>{fmtDate(r.deadline)}</span>,
          <div key="p" className="w-36"><Progress value={r.progress} /></div>,
          <div key="s"><TaskStateBadge work={r.work} sub={r.sub} late={!!r.late} />{r.sub === "graded" && <p className="mt-1 text-body-sm">Nilai: {r.grade}/100</p>}</div>,
          <Link key="a" href={`/mahasiswa/tugas/${r.id}`} className="btn-secondary h-8 px-3">Detail</Link>])} />
      <Pagination page={page} total={Number(n)} base="/mahasiswa/tugas-saya" params={{ q: sp.q, status: st }} />
    </>
  );
}
