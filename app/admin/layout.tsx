import DashboardShell from "@/components/DashboardShell";
import { getSession } from "@/lib/session";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  return <DashboardShell role="admin" name={s?.name ?? ""}>{children}</DashboardShell>;
}
