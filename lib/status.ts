export const statusOf = (p: number) => (p <= 0 ? "not_started" : p >= 100 ? "completed" : "in_progress");
export const ASSESS: Record<string, string> = { project: "Project", quiz: "Quiz", laporan: "Laporan", presentasi: "Presentasi", lainnya: "Lainnya" };
export const TYPE: Record<string, string> = { individu: "Individu", kelompok: "Kelompok" };
export function timeLeft(deadline: Date | string) {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Deadline sudah lewat";
  const h = Math.floor(ms / 3600000);
  return h >= 24 ? `${Math.floor(h / 24)} hari ${h % 24} jam lagi` : `${h} jam lagi`;
}
export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
export const currentMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
