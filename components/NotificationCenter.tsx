"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type N = { id: number; type: string; message: string; link: string | null; is_read: number; created_at: string };
const ICON: Record<string, string> = { graded: "grading", deadline_today: "alarm", deadline_h1: "schedule", submission: "inbox", late_submission: "warning", account: "manage_accounts" };
const PER = 10;

export default function NotificationCenter() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<N[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/notifications?page=${page}&per=${PER}&filter=${filter}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setItems(d.items); setTotal(d.total); setUnread(d.unread); setError("");
    } catch { setError("Gagal memuat notifikasi. Coba muat ulang halaman."); }
    setLoading(false);
  }, [page, filter]);
  useEffect(() => { load(); }, [load]);

  const mark = async (body: object) => {
    const r = await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    window.dispatchEvent(new Event("notifications:changed"));
    return r.ok;
  };
  const open = async (n: N) => { if (!n.is_read) await mark({ id: n.id }); if (n.link) router.push(n.link); else load(); };
  const readOne = async (n: N) => { await mark({ id: n.id }); load(); };
  const readAll = async () => { await mark({ all: true }); setPage(1); load(); };
  const pages = Math.max(1, Math.ceil(total / PER));

  return (
    <div className="card p-0">
      <div className="flex flex-wrap items-center justify-between gap-space-sm border-b border-surface-container p-space-md">
        <div className="flex gap-space-xs">
          {([["all", "Semua"], ["unread", `Belum dibaca${unread ? ` (${unread})` : ""}`]] as const).map(([k, l]) => (
            <button key={k} onClick={() => { setFilter(k); setPage(1); }} className={`rounded-lg px-space-md py-space-xs text-label-md ${filter === k ? "bg-inverse-surface text-inverse-on-surface" : "bg-surface-container hover:bg-surface-container-high"}`}>{l}</button>
          ))}
        </div>
        <button onClick={readAll} disabled={unread === 0} className="btn-secondary h-9 disabled:opacity-40">Tandai semua dibaca</button>
      </div>
      {error && <p className="p-space-md text-body-md text-error">{error}</p>}
      <ul>
        {items.map((n) => (
          <li key={n.id} className={`flex items-start gap-space-sm border-b border-surface-container p-space-md ${n.is_read ? "" : "border-l-4 border-l-primary-container bg-primary-fixed/30"}`}>
            <span className={`material-symbols-outlined rounded-xl p-space-xs ${n.is_read ? "bg-surface-container text-secondary" : "bg-primary-fixed text-primary"}`}>{ICON[n.type] ?? "notifications"}</span>
            <div className="min-w-0 flex-1">
              <button onClick={() => open(n)} className={`text-left text-body-md hover:text-primary ${n.is_read ? "" : "font-semibold"}`}>{n.message}</button>
              <p className="text-body-sm text-on-surface-variant">{new Date(n.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}{n.is_read ? " • Sudah dibaca" : ""}</p>
            </div>
            {!n.is_read && <button onClick={() => readOne(n)} className="whitespace-nowrap text-label-md text-primary">Tandai dibaca</button>}
          </li>
        ))}
        {!loading && items.length === 0 && !error && <li className="p-space-xl text-center text-body-md text-on-surface-variant">{filter === "unread" ? "Tidak ada notifikasi yang belum dibaca." : "Belum ada notifikasi."}</li>}
        {loading && items.length === 0 && <li className="p-space-xl text-center text-body-md text-on-surface-variant">Memuat notifikasi...</li>}
      </ul>
      <div className="flex items-center justify-between p-space-md text-body-sm text-on-surface-variant">
        <span>{total} notifikasi</span>
        <div className="flex items-center gap-space-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary h-8 px-3 disabled:opacity-40">‹</button>
          <span>Halaman {page} dari {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="btn-secondary h-8 px-3 disabled:opacity-40">›</button>
        </div>
      </div>
    </div>
  );
}
