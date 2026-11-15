import Link from "next/link";
import type { ReactNode } from "react";
import { PER } from "@/lib/utils";
import AutoSelect from "@/components/AutoSelect";

const BADGE: Record<string, [string, string]> = {
  active: ["Aktif", "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]"],
  pending: ["Pending", "bg-[#fffbeb] text-[#d97706] border-[#fde68a]"],
  inactive: ["Nonaktif", "bg-[#fff1f2] text-[#e11d48] border-[#fecdd3]"],
};
export function StatusBadge({ s }: { s: string }) {
  const [l, c] = BADGE[s] ?? [s, "bg-surface-container text-secondary border-outline-variant"];
  return <span className={`badge border ${c}`}>{l}</span>;
}
export const STATUS_OPTS = [["", "Semua Status"], ["active", "Aktif"], ["pending", "Pending"], ["inactive", "Nonaktif"]];

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-space-lg flex flex-wrap items-end justify-between gap-space-md">
      <div><h1 className="text-display-lg">{title}</h1>{sub && <p className="text-body-lg text-on-surface-variant">{sub}</p>}</div>
      {action}
    </div>
  );
}
export function Toolbar({ q, status, placeholder, addHref, addLabel, opts }: { q?: string; status?: string; placeholder: string; addHref?: string; addLabel?: string; opts?: string[][] | null }) {
  const o = opts === undefined ? STATUS_OPTS : opts;
  return (
    <form className="card mb-space-lg flex flex-wrap items-center gap-space-sm">
      <div className="relative min-w-[200px] flex-1">
        <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-outline">search</span>
        <input name="q" defaultValue={q} placeholder={placeholder} className="input pl-10" />
      </div>
      {o && <AutoSelect name="status" defaultValue={status} className="input w-auto">{o.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</AutoSelect>}
      <button className="btn-secondary">Cari</button>
      {addHref && <Link href={addHref} className="btn-primary">+ {addLabel}</Link>}
    </form>
  );
}
export function DataTable({ heads, rows, empty }: { heads: string[]; rows: ReactNode[][]; empty: string }) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-left text-body-md">
        <thead className="bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
          <tr>{heads.map((h) => <th key={h} className="whitespace-nowrap px-space-md py-space-sm">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-surface-container">
          {rows.length === 0
            ? <tr><td colSpan={heads.length} className="px-space-md py-space-xl text-center text-on-surface-variant">{empty}</td></tr>
            : rows.map((r, i) => <tr key={i} className="hover:bg-surface-container-low/50">{r.map((c, j) => <td key={j} className="px-space-md py-space-sm align-middle">{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
export function Pagination({ page, total, base, params }: { page: number; total: number; base: string; params: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / PER));
  const href = (n: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") u.set(k, v);
    u.set("page", String(n));
    return `${base}?${u}`;
  };
  const from = total ? (page - 1) * PER + 1 : 0;
  return (
    <div className="mt-space-md flex flex-wrap items-center justify-between gap-space-sm text-body-sm text-on-surface-variant">
      <span>Menampilkan {from}–{Math.min(page * PER, total)} dari {total}</span>
      <div className="flex gap-space-2xs">
        {page > 1 && <Link href={href(page - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-container">‹</Link>}
        {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map((n) => (
          <Link key={n} href={href(n)} className={`flex h-8 w-8 items-center justify-center rounded-lg ${n === page ? "bg-primary-container text-on-primary" : "hover:bg-surface-container"}`}>{n}</Link>
        ))}
        {page < pages && <Link href={href(page + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-container">›</Link>}
      </div>
    </div>
  );
}
export function EditLink({ href }: { href: string }) {
  return <Link href={href} className="btn-secondary h-8 px-3"><span className="material-symbols-outlined text-[16px]">edit</span>Edit</Link>;
}
export function Field({ label, name, type = "text", defaultValue, readOnly, hint, placeholder, required = true }: { label: string; name: string; type?: string; defaultValue?: string | number | null; readOnly?: boolean; hint?: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-space-2xs block text-label-md">{label}{required && !readOnly && <span className="text-error"> *</span>}</label>
      <input name={name} type={type} defaultValue={defaultValue ?? ""} readOnly={readOnly} placeholder={placeholder} required={required && !readOnly} className={`input ${readOnly ? "cursor-not-allowed opacity-70" : ""}`} />
      {hint && <p className="mt-space-2xs text-body-sm text-on-surface-variant">{hint}</p>}
    </div>
  );
}
export function SelectField({ label, name, options, defaultValue }: { label: string; name: string; options: (string | number)[][]; defaultValue?: string | number }) {
  return (
    <div>
      <label className="mb-space-2xs block text-label-md">{label}<span className="text-error"> *</span></label>
      <select name={name} defaultValue={defaultValue} required className="input">{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
    </div>
  );
}
export function Notice({ error, ok, children }: { error?: string; ok?: string; children?: ReactNode }) {
  if (error) return <p className="mb-space-md rounded-lg border border-[#fecdd3] bg-[#fff1f2] px-space-md py-space-sm text-body-sm text-[#e11d48]">{error}</p>;
  if (ok || children) return <div className="mb-space-md rounded-lg border border-[#a7f3d0] bg-[#ecfdf5] px-space-md py-space-sm text-body-sm text-[#059669]">{ok}{children}</div>;
  return null;
}
