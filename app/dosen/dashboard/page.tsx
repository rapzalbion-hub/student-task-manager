import Link from "next/link";
import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { fmtDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui";
import { StatCard, Pill, Progress } from "@/components/badges";

export default async function Page() {
  const me = await requireRole("dosen");
  const [t] = await query(`SELECT
    (SELECT COUNT(*) FROM courses WHERE lecturer_id=? AND status='active') courses,
    (SELECT COUNT(*) FROM tasks WHERE lecturer_id=?) tasks,
    (SELECT COUNT(*) FROM task_submissions s JOIN task_students ts ON ts.id=s.task_student_id JOIN tasks t ON t.id=ts.task_id WHERE t.lecturer_id=?) subs,
    (SELECT COUNT(*) FROM task_submissions s JOIN task_students ts ON ts.id=s.task_student_id JOIN tasks t ON t.id=ts.task_id WHERE t.lecturer_id=? AND s.status<>'graded') ungraded`, [me.uid, me.uid, me.uid, me.uid]);
  const tasks = await query(`SELECT t.id,t.title,t.deadline,c.name course,
    (SELECT COUNT(*) FROM task_students WHERE task_id=t.id) claimed,
    (SELECT COUNT(*) FROM task_submissions s JOIN task_students ts ON ts.id=s.task_student_id WHERE ts.task_id=t.id) submitted
    FROM tasks t JOIN courses c ON c.id=t.course_id WHERE t.lecturer_id=? ORDER BY t.created_at DESC LIMIT 3`, [me.uid]);
  const subs = await query(`SELECT ts.id,u.name,t.title,s.submitted_at,s.status,(s.submitted_at>t.deadline) late FROM task_submissions s JOIN task_students ts ON ts.id=s.task_student_id
    JOIN tasks t ON t.id=ts.task_id JOIN users u ON u.id=ts.student_id WHERE t.lecturer_id=? ORDER BY s.submitted_at DESC LIMIT 5`, [me.uid]);
  const upcoming = await query("SELECT id,title,deadline FROM tasks WHERE lecturer_id=? AND status='active' AND deadline>=NOW() ORDER BY deadline LIMIT 5", [me.uid]);
  return (
    <>
      <PageHeader title="Dashboard Dosen" sub={`Selamat datang, ${me.name}. Berikut ringkasan tugas Anda.`} action={<Link href="/dosen/tugas/baru" className="btn-primary">+ Buat Tugas Baru</Link>} />
      <div className="grid gap-gutter sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Mata Kuliah" value={t.courses} icon="menu_book" hint="Kelas aktif" />
        <StatCard label="Total Tugas" value={t.tasks} icon="assignment" />
        <StatCard label="Total Pengumpulan" value={t.subs} icon="task_alt" />
        <StatCard label="Belum Dinilai" value={t.ungraded} icon="pending_actions" tone="text-[#e11d48]" hint="Perlu evaluasi" />
      </div>
      <div className="mt-gutter grid gap-gutter lg:grid-cols-2">
        <div className="card">
          <div className="mb-space-md flex justify-between"><h2 className="text-headline-md">Tugas Terbaru</h2><Link href="/dosen/tugas" className="text-label-md text-primary">Lihat Semua</Link></div>
          <ul className="space-y-space-sm">
            {tasks.map((x: any) => (
              <li key={x.id} className="rounded-xl bg-surface-container-low p-space-md">
                <div className="flex justify-between gap-space-sm"><Link href={`/dosen/tugas/${x.id}`} className="text-body-md font-semibold hover:text-primary">{x.title}</Link><Pill tone="blue">{fmtDate(x.deadline)}</Pill></div>
                <p className="mb-space-xs text-body-sm text-on-surface-variant">{x.course} • {x.submitted}/{x.claimed} mengumpulkan</p>
                <Progress value={x.claimed ? Math.round((x.submitted / x.claimed) * 100) : 0} />
              </li>
            ))}
            {tasks.length === 0 && <li className="text-body-sm text-on-surface-variant">Belum ada tugas.</li>}
          </ul>
        </div>
        <div className="card">
          <div className="mb-space-md flex justify-between"><h2 className="text-headline-md">Pengumpulan Terbaru</h2><Link href="/dosen/pengumpulan" className="text-label-md text-primary">Buka Semua</Link></div>
          <ul className="space-y-space-sm">
            {subs.map((x: any) => (
              <li key={x.id} className="flex items-center justify-between gap-space-sm rounded-xl bg-surface-container-low p-space-md">
                <div><p className="text-body-md font-semibold">{x.name}</p><p className="text-body-sm text-on-surface-variant">{x.title} • {fmtDate(x.submitted_at)}</p></div>
                <div className="flex items-center gap-space-xs">{x.status === "graded" ? <Pill tone="green">Dinilai</Pill> : <Pill tone="amber">Belum dinilai</Pill>}{x.late ? <Pill tone="rose">Terlambat</Pill> : null}</div>
              </li>
            ))}
            {subs.length === 0 && <li className="text-body-sm text-on-surface-variant">Belum ada pengumpulan.</li>}
          </ul>
        </div>
      </div>
      <div className="card mt-gutter">
        <div className="mb-space-md flex justify-between"><h2 className="text-headline-md">Deadline Mendatang</h2><Link href="/dosen/calendar" className="text-label-md text-primary">Buka Calendar</Link></div>
        <div className="grid gap-space-sm sm:grid-cols-2 lg:grid-cols-5">
          {upcoming.map((x: any) => <Link key={x.id} href={`/dosen/tugas/${x.id}`} className="rounded-xl bg-primary-fixed/50 p-space-sm"><p className="text-label-sm text-primary">{fmtDate(x.deadline)}</p><p className="text-body-md font-semibold">{x.title}</p></Link>)}
          {upcoming.length === 0 && <p className="text-body-sm text-on-surface-variant">Tidak ada deadline mendatang.</p>}
        </div>
      </div>
    </>
  );
}
