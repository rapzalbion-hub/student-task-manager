import { query } from "@/lib/database";
import { requireAdmin } from "@/lib/guard";
import { PER, pageOf, like } from "@/lib/utils";
import { PageHeader, Toolbar, DataTable, Pagination, StatusBadge, EditLink } from "@/components/ui";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = pageOf(sp.page);
  const st = ["active", "pending", "inactive"].includes(sp.status ?? "") ? sp.status! : "";
  const w = "role='dosen' AND (name LIKE ? OR nip LIKE ? OR email LIKE ?)" + (st ? " AND status=?" : "");
  const p: any[] = [like(sp.q), like(sp.q), like(sp.q)];
  if (st) p.push(st);
  const [{ n }] = await query(`SELECT COUNT(*) n FROM users WHERE ${w}`, p);
  const rows = await query(`SELECT id,name,nip,email,status FROM users WHERE ${w} ORDER BY created_at DESC LIMIT ${PER} OFFSET ${(page - 1) * PER}`, p);
  return (
    <>
      <PageHeader title="Data Dosen" sub="Kelola data dosen yang terdaftar di sistem. Dosen login memakai NIP atau email." />
      <Toolbar q={sp.q} status={st} placeholder="Cari nama, NIP, email..." addHref="/admin/dosen/tambah" addLabel="Tambah Dosen" />
      <DataTable empty="Belum ada data dosen." heads={["No", "NIP", "Nama", "Email", "Status", "Aksi"]}
        rows={rows.map((r: any, i: number) => [(page - 1) * PER + i + 1, <span key="p" className="whitespace-nowrap">{r.nip}</span>, <span key="n" className="font-semibold">{r.name}</span>, r.email, <StatusBadge key="s" s={r.status} />, <EditLink key="e" href={`/admin/dosen/${r.id}/edit`} />])} />
      <Pagination page={page} total={Number(n)} base="/admin/dosen" params={{ q: sp.q, status: st }} />
    </>
  );
}
