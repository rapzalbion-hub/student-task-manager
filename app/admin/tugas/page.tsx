import { query } from "@/lib/database";
import { requireAdmin } from "@/lib/guard";
import { PER, pageOf, like, fmtDate } from "@/lib/utils";
import { PageHeader, Toolbar, DataTable, Pagination } from "@/components/ui";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const p = [like(sp.q), like(sp.q)];
  const [{ n }] = await query("SELECT COUNT(*) n FROM tasks WHERE title LIKE ? OR code LIKE ?", p);
  const rows = await query(`SELECT t.code,t.title,t.deadline,c.name course,u.name lecturer,
    (SELECT COUNT(*) FROM task_submissions s JOIN task_students ts ON ts.id=s.task_student_id WHERE ts.task_id=t.id) submitted
    FROM tasks t JOIN courses c ON c.id=t.course_id JOIN users u ON u.id=t.lecturer_id
    WHERE t.title LIKE ? OR t.code LIKE ? ORDER BY t.created_at DESC LIMIT ${PER} OFFSET ${(page - 1) * PER}`, p);
  return (
    <>
      <PageHeader title="Daftar Tugas" sub="Seluruh tugas yang dibuat dosen (hanya dapat dilihat)." />
      <Toolbar q={sp.q} opts={null} placeholder="Cari judul atau kode tugas..." />
      <DataTable empty="Belum ada tugas." heads={["Kode Tugas", "Judul", "Mata Kuliah", "Dosen", "Deadline", "Pengumpulan"]}
        rows={rows.map((r: any) => [<code key="c" className="whitespace-nowrap rounded bg-primary-fixed px-2 py-1 text-label-md text-primary">{r.code}</code>, <span key="t" className="font-semibold">{r.title}</span>, r.course, r.lecturer, <span key="d" className="whitespace-nowrap">{fmtDate(r.deadline)}</span>, r.submitted])} />
      <Pagination page={page} total={Number(n)} base="/admin/tugas" params={{ q: sp.q }} />
    </>
  );
}
