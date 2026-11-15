import DashboardShell from "@/components/DashboardShell";
import { getSession } from "@/lib/session";
export default async function DosenLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  return <DashboardShell role="dosen" name={s?.name ?? ""}>{children}</DashboardShell>;
}
