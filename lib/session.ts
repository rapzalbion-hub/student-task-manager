import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { sessionKey } from "./sessionKey";
export const COOKIE = "session";
export type Session = { uid: number; role: "admin" | "dosen" | "mahasiswa"; name: string; mcp?: boolean };
export async function createSession(s: Session) {
  const key = sessionKey();
  if (!key) throw new Error("SESSION_SECRET harus diisi dengan rahasia acak minimal 32 karakter.");
  const token = await new SignJWT({ ...s }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("8h").sign(key);
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 28800, path: "/" });
}
export async function getSession(): Promise<Session | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  const key = sessionKey();
  if (!t || !key) return null;
  try { const { payload } = await jwtVerify(t, key); return payload as unknown as Session; } catch { return null; }
}
