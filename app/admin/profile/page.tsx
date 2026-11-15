import { query } from "@/lib/database";
import { requireAdmin } from "@/lib/guard";
import { PageHeader } from "@/components/ui";
import ProfileCard from "@/components/ProfileCard";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const s = await requireAdmin();
  const sp = await searchParams;
  const [u] = await query("SELECT name,username,email FROM users WHERE id=?", [s.uid]);
  return (
    <>
      <PageHeader title="Profile" sub="Lihat data akun dan ganti password." />
      <ProfileCard rows={[["Nama", u?.name], ["Username", u?.username], ["Email", u?.email], ["Role", "Admin"]]} error={sp.error} ok={sp.ok} />
    </>
  );
}
