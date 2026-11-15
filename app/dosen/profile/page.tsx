import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { PageHeader } from "@/components/ui";
import ProfileCard from "@/components/ProfileCard";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireRole("dosen");
  const sp = await searchParams;
  const [u] = await query("SELECT name,nip,email FROM users WHERE id=?", [me.uid]);
  return (
    <>
      <PageHeader title="Profile" sub="Lihat data akun, ubah email dan password." />
      {sp.wajib && <div className="mb-space-md rounded-lg border border-[#fde68a] bg-[#fffbeb] px-space-md py-space-sm text-body-md text-[#d97706]"><b>Ganti password awal Anda.</b> Demi keamanan, Anda wajib mengganti password awal sebelum dapat menggunakan sistem.</div>}
      <ProfileCard rows={[["Nama", u?.name], ["NIP", u?.nip], ["Email", u?.email]]} email={u?.email ?? ""} error={sp.error} ok={sp.ok} />
    </>
  );
}
