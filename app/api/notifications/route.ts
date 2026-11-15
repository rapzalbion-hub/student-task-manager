import { query } from "@/lib/database";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  const me = await getSession();
  if (!me) return Response.json({ items: [], total: 0, unread: 0 }, { status: 401 });
  const u = new URL(req.url);
  const per = Math.min(50, Math.max(1, parseInt(u.searchParams.get("per") ?? "10") || 10));
  const page = Math.max(1, parseInt(u.searchParams.get("page") ?? "1") || 1);
  const w = "user_id=?" + (u.searchParams.get("filter") === "unread" ? " AND is_read=0" : "");
  const [t] = await query(`SELECT COUNT(*) n FROM notifications WHERE ${w}`, [me.uid]);
  const items = await query(`SELECT id,type,message,link,is_read,created_at FROM notifications WHERE ${w} ORDER BY created_at DESC,id DESC LIMIT ${per} OFFSET ${(page - 1) * per}`, [me.uid]);
  const [un] = await query("SELECT COUNT(*) n FROM notifications WHERE user_id=? AND is_read=0", [me.uid]);
  return Response.json({ items, total: Number(t.n), unread: Number(un.n) });
}

// Body JSON: { id: number } menandai satu notifikasi; { all: true } (atau tanpa body) menandai semuanya.
export async function POST(req: Request) {
  const me = await getSession();
  const origin = req.headers.get("origin");
  if (!me || (origin && new URL(origin).host !== new URL(req.url).host)) return new Response("Forbidden", { status: 403 });
  const body: any = await req.json().catch(() => ({}));
  const id = Number(body?.id);
  if (Number.isInteger(id) && id > 0) await query("UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?", [id, me.uid]);
  else await query("UPDATE notifications SET is_read=1 WHERE user_id=?", [me.uid]);
  const [un] = await query("SELECT COUNT(*) n FROM notifications WHERE user_id=? AND is_read=0", [me.uid]);
  return Response.json({ ok: true, unread: Number(un.n) });
}
