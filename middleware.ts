import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { sessionKey } from "@/lib/sessionKey";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  let role: string | null = null;
  let mcp = false;
  const t = req.cookies.get("session")?.value;
  const key = sessionKey();
  if (t && key) { try { const pl = (await jwtVerify(t, key)).payload; role = pl.role as string; mcp = !!pl.mcp; } catch {} }
  const go = (to: string) => NextResponse.redirect(new URL(to, req.url));
  const seg = path.split("/")[1];
  if (["admin", "dosen", "mahasiswa"].includes(seg)) {
    if (!role) return go("/login");
    if (role !== seg) return go(`/${role}/dashboard`);
    // Dosen & Mahasiswa wajib mengganti password awal sebelum memakai sistem
    if (role !== "admin" && mcp && path !== `/${role}/profile`) return go(`/${role}/profile?wajib=1`);
  }
  if (path === "/login" && role) return go(`/${role}/dashboard`);
  return NextResponse.next();
}
export const config = { matcher: ["/admin/:path*", "/dosen/:path*", "/mahasiswa/:path*", "/login"] };
