import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { MONTH_RE, currentMonth } from "@/lib/status";
import { PageHeader } from "@/components/ui";
import Calendar, { Ev } from "@/components/Calendar";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireRole("mahasiswa");
  const sp = await searchParams;
  const month = MONTH_RE.test(sp.m ?? "") ? sp.m! : currentMonth();
  const sel = /^\d{4}-\d{2}-\d{2}$/.test(sp.d ?? "") && sp.d!.startsWith(month) ? sp.d : undefined;
  const rows = await query(`SELECT t.id,t.title,DATE_FORMAT(t.deadline,'%Y-%m-%d') d,(t.deadline<NOW()) past,c.name course,s.status sub
    FROM task_students ts JOIN tasks t ON t.id=ts.task_id JOIN courses c ON c.id=t.course_id LEFT JOIN task_submissions s ON s.task_student_id=ts.id
    WHERE ts.student_id=? AND DATE_FORMAT(t.deadline,'%Y-%m')=? ORDER BY t.deadline`, [me.uid, month]);
  const events: Ev[] = rows.map((r: any) => ({ date: r.d, title: r.title, href: `/mahasiswa/tugas/${r.id}`,
    sub: `${r.course} • ${r.sub === "graded" ? "Dinilai" : r.sub ? "Terkirim" : Number(r.past) ? "Terlambat" : "Belum dikumpulkan"}`,
    tone: r.sub ? "done" : Number(r.past) ? "late" : "active" }));
  return (
    <>
      <PageHeader title="Calendar" sub="Lihat deadline tugas dalam tampilan bulanan." />
      <Calendar base="/mahasiswa/calendar" month={month} sel={sel} events={events} />
    </>
  );
}
