"use server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { query } from "@/lib/database";
import { readResetToken } from "@/lib/resetToken";

const schema = z.object({ password: z.string().min(8, "Password minimal 8 karakter"), confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: "Konfirmasi password tidak cocok", path: ["confirm"] });

export async function resetPassword(fd: FormData) {
  const token = String(fd.get("token") ?? "");
  const back = (e: string): never => redirect(`/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(e)}`);
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) back(p.error.issues[0].message);
  const v = await readResetToken(token);
  if (!v) redirect("/reset-password");
  await query("UPDATE users SET password_hash=?,must_change_password=FALSE WHERE id=?", [await bcrypt.hash(p.data!.password, 10), v.uid]);
  redirect("/reset-password?done=1");
}
