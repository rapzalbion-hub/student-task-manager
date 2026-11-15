"use server";
import { z } from "zod";
import { query } from "@/lib/database";
import { sendMail } from "@/lib/mailer";
import { makeResetToken } from "@/lib/resetToken";
import { lockedFor, recordFail, MAX_ATTEMPTS } from "@/lib/loginLimit";

export async function requestReset(_p: { done?: boolean; error?: string } | undefined, fd: FormData): Promise<{ done?: boolean; error?: string }> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (!z.string().email().safeParse(email).success) return { error: "Format email tidak valid." };
  // Respons selalu sama agar tidak membocorkan email mana yang terdaftar
  if (await lockedFor("reset", email) > 0) return { done: true };
  if (await recordFail("reset", email) > MAX_ATTEMPTS) return { done: true };
  try {
    const [u] = await query("SELECT id,name,email,password_hash FROM users WHERE email=? AND role IN ('dosen','mahasiswa') AND status='active'", [email]);
    if (u) {
      const token = await makeResetToken(u.id, u.password_hash);
      const link = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;
      await sendMail(u.email, "Reset password - Student Task Manager",
        `Halo ${u.name},\n\nKami menerima permintaan reset password untuk akun Anda. Buka tautan berikut (berlaku 30 menit):\n${link}\n\nJika bukan Anda yang meminta, abaikan email ini.`,
        `<p>Halo ${u.name},</p><p>Kami menerima permintaan reset password untuk akun Anda. Klik tombol berikut (berlaku 30 menit):</p><p><a href="${link}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Reset Password</a></p><p>Jika bukan Anda yang meminta, abaikan email ini.</p>`);
    }
  } catch (e) { console.error(e); }
  return { done: true };
}
