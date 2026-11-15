"use server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { query } from "@/lib/database";
import { createSession } from "@/lib/session";
import { lockedFor, recordFail, clearFails, MAX_ATTEMPTS } from "@/lib/loginLimit";
import { sessionKey } from "@/lib/sessionKey";

const schema = z.object({ identity: z.string().trim().min(1), password: z.string().min(1) });

export async function login(_prev: { error?: string } | undefined, fd: FormData) {
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Identitas dan password wajib diisi." };
  const { identity, password } = p.data;
  if (!sessionKey())
    return { error: "SESSION_SECRET belum diisi di file .env (minimal 32 karakter). Isi lalu restart server." };
  const wait = await lockedFor("all", identity);
  if (wait > 0) return { error: `Terlalu banyak percobaan login. Coba lagi dalam ${wait} menit.` };
  let u: any;
  try {
    const rows = await query("SELECT * FROM users WHERE username=? OR nip=? OR nim=? OR email=? LIMIT 2", [identity, identity, identity, identity.toLowerCase()]);
    if (rows.length > 1) return { error: "Identitas cocok dengan lebih dari satu akun. Hubungi administrator." };
    u = rows[0];
  } catch (e) {
    console.error(e);
    return { error: "Gagal terhubung ke PostgreSQL. Periksa DATABASE_URL di file .env." };
  }
  if (!u || !(await bcrypt.compare(password, u.password_hash))) {
    const n = await recordFail("all", identity);
    return { error: n >= MAX_ATTEMPTS ? "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." : `Identitas atau password salah. (${MAX_ATTEMPTS - n} percobaan tersisa)` };
  }
  await clearFails("all", identity);
  if (u.status === "inactive") return { error: "Akun nonaktif. Hubungi admin." };
  if (u.status === "pending") return { error: "Akun belum aktif. Hubungi admin." };
  const role = u.role as "admin" | "dosen" | "mahasiswa";
  const mcp = role !== "admin" && Number(u.must_change_password) === 1;
  await createSession({ uid: u.id, role, name: u.name, mcp });
  redirect(mcp ? `/${role}/profile?wajib=1` : `/${role}/dashboard`);
}
