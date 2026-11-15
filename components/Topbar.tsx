"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Role, SEARCH_PLACEHOLDER } from "@/lib/menus";

type R = { label: string; sub: string; href: string };
type N = { id: number; message: string; link: string | null; is_read: number; created_at: string };

export default function Topbar({ role, name, onMenu }: { role: Role; name: string; onMenu: () => void }) {
  const label = { admin: "Admin", dosen: "Dosen", mahasiswa: "Mahasiswa" }[role];
  const [q, setQ] = useState("");
  const [res, setRes] = useState<R[]>([]);
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const [notes, setNotes] = useState<N[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (q.trim().length < 2) { setRes([]); return; }
    const t = setTimeout(async () => { const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`); if (r.ok) setRes(await r.json()); }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    const r = await fetch("/api/notifications?per=8");
    if (r.ok) { const d = await r.json(); setNotes(d.items); setUnread(d.unread); }
  }, []);
  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    const onVis = () => { if (document.visibilityState === "visible") load(); };
    window.addEventListener("notifications:changed", load);
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(iv); window.removeEventListener("notifications:changed", load); document.removeEventListener("visibilitychange", onVis); };
  }, [load]);

  const mark = async (body: object) => {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    load();
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-space-md bg-surface-container-lowest/90 px-margin-mobile shadow-card backdrop-blur lg:px-margin">
      <div className="flex flex-1 items-center gap-space-md">
        <button onClick={onMenu} className="lg:hidden" aria-label="Buka menu"><span className="material-symbols-outlined">menu</span></button>
        <span className="hidden text-title-md sm:block">Student Task Manager</span>
        <span className="hidden rounded-full bg-primary-fixed px-space-sm py-space-2xs text-label-sm text-primary sm:block">{label}</span>
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-outline">search</span>
          <input className="input pl-10" placeholder={SEARCH_PLACEHOLDER[role]} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 200)} />
          {open && q.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl bg-surface-container-lowest shadow-hover">
              {res.length === 0 ? <p className="p-space-md text-body-sm text-on-surface-variant">Tidak ada hasil.</p> : res.map((r, i) => (
                <Link key={i} href={r.href} className="block px-space-md py-space-sm hover:bg-surface-container-low"><p className="text-body-md font-semibold">{r.label}</p><p className="text-body-sm text-on-surface-variant">{r.sub}</p></Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-space-md">
        <div className="relative">
          <button className="relative" aria-label="Notifikasi" onClick={() => { setBell(!bell); load(); }}>
            <span className="material-symbols-outlined">notifications</span>
            {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] text-on-error">{unread > 99 ? "99+" : unread}</span>}
          </button>
          {bell && (
            <div className="absolute right-0 top-10 z-50 w-80 rounded-xl bg-surface-container-lowest shadow-modal">
              <div className="flex items-center justify-between border-b border-surface-container p-space-sm"><b className="text-body-md">Notifikasi</b><button className="text-label-md text-primary disabled:opacity-40" disabled={unread === 0} onClick={() => mark({ all: true })}>Tandai semua dibaca</button></div>
              <ul className="max-h-80 overflow-y-auto">
                {notes.map((n) => (
                  <li key={n.id} className={`border-b border-surface-container p-space-sm text-body-sm ${n.is_read ? "" : "bg-primary-fixed/40"}`}>
                    {n.link
                      ? <Link href={n.link} onClick={() => { setBell(false); if (!n.is_read) mark({ id: n.id }); }} className={n.is_read ? "" : "font-semibold"}>{n.message}</Link>
                      : <button className={`text-left ${n.is_read ? "" : "font-semibold"}`} onClick={() => !n.is_read && mark({ id: n.id })}>{n.message}</button>}
                    <span className="block text-label-sm text-on-surface-variant">{new Date(n.created_at).toLocaleString("id-ID")}</span>
                  </li>
                ))}
                {notes.length === 0 && <li className="p-space-md text-body-sm text-on-surface-variant">Belum ada notifikasi.</li>}
              </ul>
              <Link href={`/${role}/notifikasi`} onClick={() => setBell(false)} className="block border-t border-surface-container p-space-sm text-center text-label-md text-primary">Lihat semua notifikasi →</Link>
            </div>
          )}
        </div>
        <span className="hidden text-label-md sm:block">{name}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary"><span className="material-symbols-outlined">person</span></div>
      </div>
    </header>
  );
}
