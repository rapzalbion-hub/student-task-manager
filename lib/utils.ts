export const PER = 10;
export const pageOf = (v?: string) => Math.max(1, parseInt(v ?? "1") || 1);
export const like = (q?: string) => `%${(q ?? "").trim()}%`;
export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
