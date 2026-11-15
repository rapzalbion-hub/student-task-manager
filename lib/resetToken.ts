import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";
import { query } from "./database";
import { sessionKey } from "./sessionKey";

// Token reset tanpa tabel tambahan: ditandatangani, berlaku 30 menit, dan otomatis tidak berlaku
// setelah password berubah (sidik jari hash password disimpan di dalam token).
const key = () => {
  const secret = sessionKey();
  if (!secret) throw new Error("SESSION_SECRET harus diisi dengan rahasia acak minimal 32 karakter.");
  return new TextEncoder().encode(`${new TextDecoder().decode(secret)}:reset`);
};
const fp = (hash: string) => createHash("sha256").update(hash).digest("hex").slice(0, 16);

export const makeResetToken = (uid: number, passwordHash: string) =>
  new SignJWT({ uid, pv: fp(passwordHash), typ: "reset" }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30m").sign(key());

export async function readResetToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key());
    if (payload.typ !== "reset") return null;
    const [u] = await query("SELECT id,name,role,status,password_hash FROM users WHERE id=?", [payload.uid]);
    if (!u || u.role === "admin" || u.status !== "active" || fp(u.password_hash) !== payload.pv) return null;
    return { uid: u.id as number, name: u.name as string, role: u.role as string };
  } catch { return null; }
}
