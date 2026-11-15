import { redirect } from "next/navigation";
import { getSession } from "./session";
import type { Role } from "./menus";
export async function requireRole(role: Role) {
  const s = await getSession();
  if (!s || s.role !== role) redirect("/login");
  return s;
}
export const requireAdmin = () => requireRole("admin");
