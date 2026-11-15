import { query } from "@/lib/database";
import { requireAdmin } from "@/lib/guard";
import { PER, pageOf, like } from "@/lib/utils";
import { PageHeader, Toolbar, DataTable, Pagination, StatusBadge, EditLink } from "@/components/ui";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const st = ["active", "inactive"].includes(sp.status ?? "") ? sp.status! : "";
  const w = "(c.name LIKE ? OR c.code LIKE ? OR u.name LIKE ?)" + (st ? " AND c.status=?" : "");
  const p: any[] = [like(sp.q), like(sp.q), like(sp.q)];
  if (st) p.push(st);
  const [{ n }] = await query(`SELECT COUNT(*) n FROM courses c JOIN users u ON u.id=c.lecturer_id WHERE ${w}`, p);
  const rows = await query(`SELECT c.id,c.code,c.name,c.semester,c.status,u.name lecturer FROM courses c JOIN users u ON u.id=c.lecturer_id WHERE ${w} ORDER BY c.created_at DESC LIMIT ${PER} OFFSET ${(page - 1) * PER}`, p);
  return (
    <>
      <PageHeader title="Data Mata Kuliah" sub="Mata kuliah hanya dikelola oleh Admin. Dosen dan Mahasiswa tidak memiliki menu Mata Kuliah." />
      <Toolbar q={sp.q} status={st} opts={[["", "Semua Status"], ["active", "Aktif"], ["inactive", "Nonaktif"]]} placeholder="Cari mata kuliah, kode, dosen..." addHref="/admin/mata-kuliah/tambah" addLabel="Tambah Mata Kuliah" />
      <DataTable empty="Belum ada mata kuliah." heads={["No", "Kode", "Mata Kuliah", "Dosen Pengampu", "Smt", "Status", "Aksi"]}
        rows={rows.map((r: any, i: number) => [(page - 1) * PER + i + 1, <code key="c" className="whitespace-nowrap rounded bg-primary-fixed px-2 py-1 text-label-md text-primary">{r.code}</code>, <span key="n" className="font-semibold">{r.name}</span>, r.lecturer, r.semester, <StatusBadge key="s" s={r.status} />, <EditLink key="e" href={`/admin/mata-kuliah/${r.id}/edit`} />])} />
      <Pagination page={page} total={Number(n)} base="/admin/mata-kuliah" params={{ q: sp.q, status: st }} />
    </>
  );
}
