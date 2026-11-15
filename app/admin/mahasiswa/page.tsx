import { query } from "@/lib/database";
import { requireAdmin } from "@/lib/guard";
import { PER, pageOf, like } from "@/lib/utils";
import { PageHeader, Toolbar, DataTable, Pagination, StatusBadge, EditLink, Notice } from "@/components/ui";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const st = ["active", "pending", "inactive"].includes(sp.status ?? "") ? sp.status! : "";
  const w = "role='mahasiswa' AND (name LIKE ? OR nim LIKE ? OR class_name LIKE ?)" + (st ? " AND status=?" : "");
  const p: any[] = [like(sp.q), like(sp.q), like(sp.q)];
  if (st) p.push(st);
  const [{ n }] = await query(`SELECT COUNT(*) n FROM users WHERE ${w}`, p);
  const rows = await query(`SELECT id,nim,name,class_name,study_program,status FROM users WHERE ${w} ORDER BY created_at DESC LIMIT ${PER} OFFSET ${(page - 1) * PER}`, p);
  return (
    <>
      <PageHeader title="Data Mahasiswa" sub="Akun mahasiswa dibuat oleh Admin. Mahasiswa login menggunakan NIM dan password." />
      {sp.created && <Notice ok="Mahasiswa berhasil ditambahkan. Password awal: tanggal lahir (DDMMYYYY) + 2 digit terakhir NIM." />}
      <Toolbar q={sp.q} status={st} placeholder="Cari nama, NIM, kelas..." addHref="/admin/mahasiswa/tambah" addLabel="Tambah Mahasiswa" />
      <DataTable empty="Belum ada data mahasiswa." heads={["No", "NIM", "Nama Mahasiswa", "Kelas", "Program Studi", "Status", "Aksi"]}
        rows={rows.map((r: any, i: number) => [(page - 1) * PER + i + 1, <code key="c" className="text-primary">{r.nim}</code>, <span key="n" className="font-semibold">{r.name}</span>, r.class_name, r.study_program, <StatusBadge key="s" s={r.status} />, <EditLink key="e" href={`/admin/mahasiswa/${r.id}/edit`} />])} />
      <Pagination page={page} total={Number(n)} base="/admin/mahasiswa" params={{ q: sp.q, status: st }} />
    </>
  );
}
