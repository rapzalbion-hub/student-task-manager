import { requireRole } from "@/lib/guard";
import { PageHeader } from "@/components/ui";
import NotificationCenter from "@/components/NotificationCenter";

export default async function Page() {
  await requireRole("mahasiswa");
  return (
    <>
      <PageHeader title="Notifikasi" sub="Semua pemberitahuan untuk akun Anda. Klik notifikasi untuk membuka dan menandainya sebagai dibaca." />
      <NotificationCenter />
    </>
  );
}
