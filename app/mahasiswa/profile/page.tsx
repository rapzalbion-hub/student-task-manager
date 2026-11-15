import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { PageHeader } from "@/components/ui";
import ProfileCard from "@/components/ProfileCard";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireRole("mahasiswa");
  const sp = await searchParams;
  const [u] = await query("SELECT name,nim,class_name,study_program,email FROM users WHERE id=?", [me.uid]);
  return (
    <>
      <PageHeader title="Profile" sub="Lihat data akun dan ganti password. NIM tidak dapat diubah." />
      {sp.wajib && <div className="mb-space-md rounded-lg border border-[#fde68a] bg-[#fffbeb] px-space-md py-space-sm text-body-md text-[#d97706]"><b>Ganti password awal Anda.</b> Demi keamanan, Anda wajib mengganti password awal sebelum dapat menggunakan sistem.</div>}
      <ProfileCard rows={[["Nama", u?.name], ["NIM", u?.nim], ["Kelas", u?.class_name], ["Program Studi", u?.study_program], ["Email", u?.email]]} email={u?.email ?? ""} error={sp.error} ok={sp.ok} />
    </>
  );
}
