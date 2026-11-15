import Link from "next/link";
import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { PER, pageOf, like, fmtDate } from "@/lib/utils";
import { PageHeader, Toolbar, DataTable, Pagination } from "@/components/ui";
import { Progress, Pill } from "@/components/badges";
import CopyButton from "@/components/CopyButton";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireRole("dosen");
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const st = ["active", "closed"].includes(sp.status ?? "") ? sp.status! : "";
  const w = "t.lecturer_id=? AND (t.title LIKE ? OR t.code LIKE ?)" + (st ? " AND t.status=?" : "");
  const p: any[] = [me.uid, like(sp.q), like(sp.q)];
  if (st) p.push(st);
  const [{ n }] = await query(`SELECT COUNT(*) n FROM tasks t WHERE ${w}`, p);
  const rows = await query(`SELECT t.id,t.code,t.title,t.deadline,t.status,c.name course,
    (SELECT COUNT(*) FROM task_students WHERE task_id=t.id) claimed,
    (SELECT COUNT(*) FROM task_submissions s JOIN task_students ts ON ts.id=s.task_student_id WHERE ts.task_id=t.id) submitted
    FROM tasks t JOIN courses c ON c.id=t.course_id WHERE ${w} ORDER BY t.created_at DESC LIMIT ${PER} OFFSET ${(page - 1) * PER}`, p);
  return (
    <>
      <PageHeader title="Daftar Tugas" sub="Semua tugas yang Anda buat beserta Kode Tugas." />
      <Toolbar q={sp.q} status={st} opts={[["", "Semua Status"], ["active", "Aktif"], ["closed", "Ditutup"]]} placeholder="Cari judul atau kode tugas..." addHref="/dosen/tugas/baru" addLabel="Buat Tugas" />
      <DataTable empty="Belum ada tugas. Klik + Buat Tugas untuk memulai." heads={["Kode Tugas", "Judul", "Mata Kuliah", "Deadline", "Kumpul", "Aksi"]}
        rows={rows.map((r: any) => [
          <span key="c" className="inline-flex items-center gap-2 whitespace-nowrap rounded bg-primary-fixed px-2 py-1 text-label-md text-primary">{r.code}<CopyButton text={r.code} /></span>,
          <span key="t" className="font-semibold">{r.title} {r.status === "closed" && <Pill tone="gray">Ditutup</Pill>}</span>, r.course, <span key="d" className="whitespace-nowrap">{fmtDate(r.deadline)}</span>,
          <div key="k" className="w-32"><span className="text-label-md">{r.submitted} / {r.claimed}</span><Progress value={r.claimed ? Math.round((r.submitted / r.claimed) * 100) : 0} /></div>,
          <Link key="a" href={`/dosen/tugas/${r.id}`} className="btn-secondary h-8 px-3">Detail</Link>])} />
      <Pagination page={page} total={Number(n)} base="/dosen/tugas" params={{ q: sp.q, status: st }} />
      <p className="mt-space-md rounded-xl bg-primary-fixed/40 p-space-sm text-body-sm text-primary">Kode Tugas dibagikan ke mahasiswa untuk mengambil tugas. Klik ikon untuk menyalin.</p>
    </>
  );
}
