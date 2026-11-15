"use server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { query } from "@/lib/database";
import { getSession, createSession } from "@/lib/session";

const schema = z.object({ current: z.string().min(1, "Password saat ini wajib diisi"), next: z.string().min(8, "Password baru minimal 8 karakter"), confirm: z.string() })
  .refine((d) => d.next === d.confirm, { message: "Konfirmasi password tidak cocok", path: ["confirm"] });
const err = (back: string, m: string): never => redirect(`${back}?error=${encodeURIComponent(m)}`);

export async function changePassword(fd: FormData) {
  const s = await getSession();
  if (!s) redirect("/login");
  const back = `/${s.role}/profile`;
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) err(back, p.error.issues[0].message);
  const [u] = await query("SELECT password_hash FROM users WHERE id=?", [s.uid]);
  if (!u || !(await bcrypt.compare(p.data!.current, u.password_hash))) err(back, "Password saat ini salah.");
  if (p.data!.next === p.data!.current) err(back, "Password baru tidak boleh sama dengan password lama.");
  await query("UPDATE users SET password_hash=?,must_change_password=0 WHERE id=?", [await bcrypt.hash(p.data!.next, 10), s.uid]);
  if (s.mcp) {
    await createSession({ uid: s.uid, role: s.role, name: s.name });
    redirect(`/${s.role}/dashboard`);
  }
  redirect(`${back}?ok=1`);
}

export async function updateEmail(fd: FormData) {
  const s = await getSession();
  if (!s) redirect("/login");
  const back = `/${s.role}/profile`;
  const p = z.string().trim().toLowerCase().email("Email tidak valid").safeParse(fd.get("email"));
  if (!p.success) err(back, p.error.issues[0].message);
  const [u] = await query("SELECT password_hash FROM users WHERE id=?", [s.uid]);
  if (!u || !(await bcrypt.compare(String(fd.get("current") ?? ""), u.password_hash))) err(back, "Password saat ini salah.");
  try { await query("UPDATE users SET email=? WHERE id=?", [p.data, s.uid]); }
  catch (e: any) { err(back, e?.code === "ER_DUP_ENTRY" ? "Email sudah dipakai akun lain." : "Gagal menyimpan email."); }
  redirect(`${back}?ok=1`);
}
