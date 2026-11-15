"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MENUS, Role } from "@/lib/menus";

export default function Sidebar({ role, open, onClose }: { role: Role; open: boolean; onClose: () => void }) {
  const path = usePathname();
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col justify-between bg-surface-container-lowest py-space-md shadow-card transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs px-space-md pb-space-md">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary"><span className="material-symbols-outlined text-[20px] text-on-primary">school</span></div>
            <div className="flex flex-col"><span className="text-title-md leading-tight tracking-tight">Student Task</span><span className="text-label-sm uppercase tracking-wider text-secondary">Manager</span></div>
          </div>
          <div className="my-space-xs px-space-md"><span className="text-label-sm uppercase tracking-wider text-secondary">Menu Utama</span></div>
          <nav className="flex flex-col gap-space-2xs px-space-xs">
            {MENUS[role].map((m) => {
              const active = path === m.href || path.startsWith(m.href + "/");
              return (
                <Link key={m.href} href={m.href} onClick={onClose} aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-space-xs rounded-lg px-space-sm py-2.5 transition-colors ${active ? "bg-inverse-surface text-inverse-on-surface text-headline-md" : "text-body-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface"}`}>
                  <span className="material-symbols-outlined text-[20px]">{m.icon}</span><span>{m.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <form action="/api/logout" method="post" className="px-space-xs">
          <button className="flex w-full items-center gap-space-xs rounded-lg px-space-sm py-2.5 text-body-md text-error hover:bg-error-container/50">
            <span className="material-symbols-outlined text-[20px]">logout</span><span>Keluar (Logout)</span>
          </button>
        </form>
      </aside>
    </>
  );
}
