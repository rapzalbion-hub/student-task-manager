import Link from "next/link";
import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { ensureReminders } from "@/lib/notify";
import { fmtDate } from "@/lib/utils";
import { timeLeft } from "@/lib/status";
import { PageHeader } from "@/components/ui";
import { StatCard, Pill, Progress, TaskStateBadge } from "@/components/badges";

export default async function Page() {
  const me = await requireRole("mahasiswa");
  await ensureReminders(me.uid);
  const [t] = await query(`SELECT COUNT(*) total,
    COUNT(*) FILTER (WHERE ts.status='in_progress' AND s.id IS NULL) doing,
    COUNT(s.id) done,
    COUNT(*) FILTER (WHERE (s.id IS NULL AND t.deadline<NOW()) OR s.status='late') late
    FROM task_students ts JOIN tasks t ON t.id=ts.task_id LEFT JOIN task_submissions s ON s.task_student_id=ts.id WHERE ts.student_id=?`, [me.uid]);
  const near = await query(`SELECT t.id,t.title,t.deadline,c.name course FROM task_students ts JOIN tasks t ON t.id=ts.task_id JOIN courses c ON c.id=t.course_id
    LEFT JOIN task_submissions s ON s.task_student_id=ts.id WHERE ts.student_id=? AND s.id IS NULL AND t.deadline>=NOW() ORDER BY t.deadline LIMIT 3`, [me.uid]);
  const rem = await query(`SELECT t.id,t.title,t.deadline,(t.deadline<NOW()) past,(t.deadline::date-CURRENT_DATE) d FROM task_students ts JOIN tasks t ON t.id=ts.task_id
    LEFT JOIN task_submissions s ON s.task_student_id=ts.id WHERE ts.student_id=? AND s.id IS NULL AND (t.deadline::date-CURRENT_DATE)<=1 ORDER BY t.deadline LIMIT 6`, [me.uid]);
  const mine = await query(`SELECT t.id,t.title,c.name course,t.deadline,ts.progress,ts.status work,s.status sub,(s.submitted_at>t.deadline) late FROM task_students ts JOIN tasks t ON t.id=ts.task_id
    JOIN courses c ON c.id=t.course_id LEFT JOIN task_submissions s ON s.task_student_id=ts.id WHERE ts.student_id=? ORDER BY t.deadline LIMIT 3`, [me.uid]);
  return (
    <>
      <PageHeader title="Dashboard Mahasiswa" sub="Pantau tugas dan progres belajar Anda secara terstruktur." />
      <div className="grid gap-gutter sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Tugas" value={Number(t.total)} icon="assignment" />
        <StatCard label="Sedang Dikerjakan" value={Number(t.doing)} icon="schedule" tone="text-primary" />
        <StatCard label="Selesai" value={Number(t.done)} icon="task_alt" tone="text-[#059669]" hint="Sudah dikirim" />
        <StatCard label="Terlambat" value={Number(t.late)} icon="warning" tone="text-[#e11d48]" />
      </div>
      <div className="mt-gutter grid gap-gutter lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-space-md text-headline-md">Deadline Terdekat</h2>
          <ul className="space-y-space-sm">
            {near.map((x: any) => (
              <li key={x.id} className="flex items-center justify-between gap-space-sm rounded-xl bg-surface-container-low p-space-md">
                <div><Link href={`/mahasiswa/tugas/${x.id}`} className="font-semibold hover:text-primary">{x.title}</Link><p className="text-body-sm text-on-surface-variant">{x.course} • {fmtDate(x.deadline)}</p></div>
                <Pill tone="amber">{timeLeft(x.deadline)}</Pill>
              </li>
            ))}
            {near.length === 0 && <li className="text-body-sm text-on-surface-variant">Tidak ada deadline mendatang.</li>}
          </ul>
          <Link href="/mahasiswa/calendar" className="mt-space-md inline-block text-label-md text-primary">Lihat kalender akademik →</Link>
        </div>
        <div className="card">
          <h2 className="mb-space-md text-headline-md">Reminder</h2>
          <ul className="space-y-space-sm">
            {rem.map((x: any) => {
              const past = Number(x.past) === 1, d = Number(x.d);
              const [label, tone, text] = past ? ["Lewat Deadline", "rose", `Lewat deadline: ${x.title}`] : d === 0 ? ["Hari Ini", "amber", `${x.title} deadline hari ini`] : ["H-1", "amber", `${x.title} deadline besok`];
              return <li key={x.id} className={`rounded-xl p-space-md ${past ? "bg-[#fff1f2]" : "bg-surface-container-low"}`}><Pill tone={tone as any}>{label}</Pill> <Link href={`/mahasiswa/tugas/${x.id}`} className="ml-1 font-semibold hover:text-primary">{text}</Link></li>;
            })}
            {rem.length === 0 && <li className="text-body-sm text-on-surface-variant">Tidak ada reminder.</li>}
          </ul>
        </div>
      </div>
      <div className="card mt-gutter">
        <div className="mb-space-md flex justify-between"><h2 className="text-headline-md">Tugas Saya</h2><Link href="/mahasiswa/tugas-saya" className="text-label-md text-primary">Kelola di halaman Tugas Saya →</Link></div>
        <ul className="space-y-space-sm">
          {mine.map((x: any) => (
            <li key={x.id} className="grid items-center gap-space-sm rounded-xl bg-surface-container-low p-space-md sm:grid-cols-4">
              <div className="sm:col-span-2"><Link href={`/mahasiswa/tugas/${x.id}`} className="font-semibold hover:text-primary">{x.title}</Link><p className="text-body-sm text-on-surface-variant">{x.course} • {fmtDate(x.deadline)}</p></div>
              <Progress value={x.progress} /><TaskStateBadge work={x.work} sub={x.sub} late={!!x.late} />
            </li>
          ))}
          {mine.length === 0 && <li className="text-body-sm text-on-surface-variant">Belum ada tugas. Ambil tugas lewat menu Ambil Tugas.</li>}
        </ul>
      </div>
    </>
  );
}
