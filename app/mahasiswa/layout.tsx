import DashboardShell from "@/components/DashboardShell";
import { getSession } from "@/lib/session";
export default async function MahasiswaLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  return <DashboardShell role="mahasiswa" name={s?.name ?? ""}>{children}</DashboardShell>;
}
