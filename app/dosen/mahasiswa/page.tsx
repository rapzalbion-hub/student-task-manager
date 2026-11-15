import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { PER, pageOf, like } from "@/lib/utils";
import { PageHeader, Toolbar, DataTable, Pagination } from "@/components/ui";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireRole("dosen");
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const w = "(u.name LIKE ? OR u.nim LIKE ? OR u.class_name LIKE ?)";
  const p = [me.uid, like(sp.q), like(sp.q), like(sp.q)];
  const [{ n }] = await query(`SELECT COUNT(DISTINCT u.id) n FROM task_students ts JOIN tasks t ON t.id=ts.task_id AND t.lecturer_id=? JOIN users u ON u.id=ts.student_id WHERE ${w}`, p);
  const rows = await query(`SELECT u.name,u.nim,u.class_name,COUNT(DISTINCT ts.id) taken,COUNT(DISTINCT s.id) submitted
    FROM task_students ts JOIN tasks t ON t.id=ts.task_id AND t.lecturer_id=? JOIN users u ON u.id=ts.student_id LEFT JOIN task_submissions s ON s.task_student_id=ts.id
    WHERE ${w} GROUP BY u.id ORDER BY u.name LIMIT ${PER} OFFSET ${(page - 1) * PER}`, p);
  return (
    <>
      <PageHeader title="Mahasiswa" sub="Mahasiswa yang mengambil tugas Anda." />
      <Toolbar q={sp.q} opts={null} placeholder="Cari nama, NIM, kelas..." />
      <DataTable empty="Belum ada mahasiswa yang mengambil tugas Anda." heads={["No", "Nama", "NIM", "Kelas", "Tugas Diambil", "Dikumpulkan"]}
        rows={rows.map((r: any, i: number) => [(page - 1) * PER + i + 1, <b key="n">{r.name}</b>, r.nim, r.class_name, r.taken, r.submitted])} />
      <Pagination page={page} total={Number(n)} base="/dosen/mahasiswa" params={{ q: sp.q }} />
    </>
  );
}
