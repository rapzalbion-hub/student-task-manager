import type { ReactNode } from "react";
const C = {
  green: "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]", amber: "bg-[#fffbeb] text-[#d97706] border-[#fde68a]",
  rose: "bg-[#fff1f2] text-[#e11d48] border-[#fecdd3]", blue: "bg-primary-fixed text-primary border-primary-fixed-dim",
  gray: "bg-surface-container text-secondary border-outline-variant",
};
export function Pill({ tone, children }: { tone: keyof typeof C; children: ReactNode }) {
  return <span className={`badge border ${C[tone]}`}>{children}</span>;
}
export function WorkBadge({ s }: { s: string }) {
  return s === "completed" ? <Pill tone="green">Selesai</Pill> : s === "in_progress" ? <Pill tone="blue">Sedang Dikerjakan</Pill> : <Pill tone="gray">Belum Dimulai</Pill>;
}
export function TaskStateBadge({ work, sub, late }: { work: string; sub?: string | null; late?: boolean }) {
  if (sub === "graded") return <Pill tone="green">Dinilai</Pill>;
  if (sub) return <span className="flex flex-wrap gap-1"><Pill tone="green">Terkirim</Pill>{late && <Pill tone="rose">Terlambat</Pill>}</span>;
  return <WorkBadge s={work} />;
}
export function Progress({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-space-sm">
      <div className="h-2 flex-1 rounded-full bg-[#e2e8f0]"><div className={`h-2 rounded-full transition-all duration-300 ${value >= 100 ? "bg-[#10b981]" : "bg-primary-container"}`} style={{ width: `${value}%` }} /></div>
      <span className="w-10 text-right text-label-md">{value}%</span>
    </div>
  );
}
export function StatCard({ label, value, icon, hint, tone = "text-on-surface" }: { label: string; value: ReactNode; icon: string; hint?: string; tone?: string }) {
  return (
    <div className="card flex items-start justify-between">
      <div><p className="text-body-md text-on-surface-variant">{label}</p><p className={`text-display-lg ${tone}`}>{value}</p>{hint && <p className="text-body-sm text-on-surface-variant">{hint}</p>}</div>
      <span className="material-symbols-outlined rounded-xl bg-primary-fixed p-space-sm text-primary">{icon}</span>
    </div>
  );
}
