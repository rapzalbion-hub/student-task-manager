import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { MONTH_RE, currentMonth } from "@/lib/status";
import { PageHeader } from "@/components/ui";
import Calendar, { Ev } from "@/components/Calendar";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireRole("dosen");
  const sp = await searchParams;
  const month = MONTH_RE.test(sp.m ?? "") ? sp.m! : currentMonth();
  const sel = /^\d{4}-\d{2}-\d{2}$/.test(sp.d ?? "") && sp.d!.startsWith(month) ? sp.d : undefined;
  const rows = await query(`SELECT t.id,t.title,TO_CHAR(t.deadline,'YYYY-MM-DD') d,(t.deadline<NOW()) past,c.name course,
    (SELECT COUNT(*) FROM task_students WHERE task_id=t.id) claimed,
    (SELECT COUNT(*) FROM task_submissions s JOIN task_students ts ON ts.id=s.task_student_id WHERE ts.task_id=t.id) submitted
    FROM tasks t JOIN courses c ON c.id=t.course_id WHERE t.lecturer_id=? AND TO_CHAR(t.deadline,'YYYY-MM')=? ORDER BY t.deadline`, [me.uid, month]);
  const events: Ev[] = rows.map((r: any) => ({ date: r.d, title: r.title, href: `/dosen/tugas/${r.id}`, sub: `${r.course} • ${r.submitted}/${r.claimed} sudah mengumpulkan`, tone: Number(r.past) ? "late" : "active" }));
  return (
    <>
      <PageHeader title="Calendar Dosen" sub="Lihat deadline tugas dan jadwal pengumpulan dalam tampilan bulanan." />
      <Calendar base="/dosen/calendar" month={month} sel={sel} events={events} />
    </>
  );
}
