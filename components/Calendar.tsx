import Link from "next/link";
export type Ev = { date: string; title: string; sub: string; href?: string; tone: "active" | "late" | "done" };
const DOT = { active: "bg-primary-container", late: "bg-[#f43f5e]", done: "bg-[#10b981]" };

export default function Calendar({ base, month, sel, events }: { base: string; month: string; sel?: string; events: Ev[] }) {
  const [y, m] = month.split("-").map(Number);
  const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const days = new Date(y, m, 0).getDate();
  const key = (d: number) => `${month}-${String(d).padStart(2, "0")}`;
  const by = new Map<string, Ev[]>();
  events.forEach((e) => by.set(e.date, [...(by.get(e.date) ?? []), e]));
  const shift = (n: number) => { const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
  const t = new Date(); const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  const title = new Date(y, m - 1, 1).toLocaleString("id-ID", { month: "long", year: "numeric" });
  const list = sel ? events.filter((e) => e.date === sel) : events;
  return (
    <div className="grid gap-gutter lg:grid-cols-3">
      <div className="card lg:col-span-2">
        <div className="mb-space-md flex items-center justify-between">
          <h2 className="text-headline-md capitalize">{title}</h2>
          <div className="flex gap-space-xs">
            <Link href={`${base}?m=${shift(-1)}`} className="btn-secondary h-8 px-3">‹</Link>
            <Link href={`${base}?m=${currentMonth()}`} className="btn-secondary h-8 px-3">Hari Ini</Link>
            <Link href={`${base}?m=${shift(1)}`} className="btn-secondary h-8 px-3">›</Link>
          </div>
        </div>
        <div className="overflow-x-auto"><div className="min-w-[560px]">
          <div className="grid grid-cols-7 rounded-lg bg-surface-container text-center text-label-sm uppercase text-on-surface-variant">
            {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => <div key={d} className="py-space-sm">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 border-l border-t border-surface-container">
            {Array.from({ length: offset }, (_, i) => <div key={`b${i}`} className="min-h-16 border-b border-r border-surface-container bg-surface-container-low/60" />)}
            {Array.from({ length: days }, (_, i) => {
              const d = i + 1, k = key(d), ev = by.get(k) ?? [];
              return (
                <Link key={k} href={`${base}?m=${month}&d=${k}`} className={`min-h-16 border-b border-r border-surface-container p-space-xs hover:bg-surface-container-low ${sel === k ? "ring-2 ring-inset ring-primary-container" : ""} ${today === k ? "bg-inverse-surface text-inverse-on-surface hover:bg-inverse-surface" : ""}`}>
                  <span className="text-body-md font-semibold">{d}</span>
                  <div className="mt-1 flex flex-wrap gap-1">{ev.slice(0, 4).map((e, j) => <span key={j} className={`h-2 w-2 rounded-full ${DOT[e.tone]}`} />)}</div>
                </Link>
              );
            })}
          </div>
        </div></div>
        <p className="mt-space-md text-body-sm text-on-surface-variant">Klik tanggal untuk melihat tugas pada tanggal itu.</p>
      </div>
      <div className="card">
        <div className="mb-space-md flex items-center justify-between"><h2 className="text-headline-md">{sel ? `Deadline ${sel.split("-").reverse().join("/")}` : "Deadline Bulan Ini"}</h2>{sel && <Link href={`${base}?m=${month}`} className="text-label-md text-primary">Semua</Link>}</div>
        <ul className="space-y-space-sm">
          {list.map((e, i) => (
            <li key={i} className="rounded-xl bg-surface-container-low p-space-sm">
              <div className="flex items-center gap-space-xs"><span className={`h-2 w-2 rounded-full ${DOT[e.tone]}`} /><span className="text-label-sm text-on-surface-variant">{e.date.split("-").reverse().join("/")}</span></div>
              {e.href ? <Link href={e.href} className="text-body-md font-semibold hover:text-primary">{e.title}</Link> : <p className="text-body-md font-semibold">{e.title}</p>}
              <p className="text-body-sm text-on-surface-variant">{e.sub}</p>
            </li>
          ))}
          {list.length === 0 && <li className="text-body-sm text-on-surface-variant">Tidak ada deadline.</li>}
        </ul>
      </div>
    </div>
  );
}
import { currentMonth } from "@/lib/status";
