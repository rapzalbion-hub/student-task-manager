import Link from "next/link";
import { query } from "@/lib/database";
import { requireAdmin } from "@/lib/guard";
import { PageHeader, StatusBadge } from "@/components/ui";
import UsageChart from "@/components/UsageChart";

export default async function Page() {
  await requireAdmin();
  const [t] = await query(`SELECT
    (SELECT COUNT(*) FROM users WHERE role='dosen') dosen,
    (SELECT COUNT(*) FROM users WHERE role='mahasiswa') mhs,
    (SELECT COUNT(*) FROM courses) courses,
    (SELECT COUNT(*) FROM tasks) tasks,
    (SELECT COUNT(*) FROM users WHERE role IN ('dosen','mahasiswa') AND status='active') aktif,
    (SELECT COUNT(*) FROM users WHERE role IN ('dosen','mahasiswa') AND status='inactive') nonaktif,
    (SELECT COUNT(*) FROM task_students WHERE status='completed') done`);
  const act = await query("SELECT TO_CHAR(created_at,'YYYY-MM') m, COUNT(*) n FROM activity_logs WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months' GROUP BY m");
  const map = new Map(act.map((r: any) => [r.m, Number(r.n)]));
  const now = new Date();
  const chart = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { label: d.toLocaleString("id-ID", { month: "short" }), n: map.get(k) ?? 0 };
  });
  const lecturers = await query("SELECT id,name,status FROM users WHERE role='dosen' ORDER BY created_at DESC LIMIT 3");
  const popular = await query(`SELECT t.title,c.name course,COUNT(s.id) n FROM tasks t JOIN courses c ON c.id=t.course_id
    LEFT JOIN task_students ts ON ts.task_id=t.id LEFT JOIN task_submissions s ON s.task_student_id=ts.id GROUP BY t.id,t.title,c.name ORDER BY n DESC LIMIT 3`);
  const logs = await query("SELECT description,created_at FROM activity_logs ORDER BY created_at DESC LIMIT 5");
  const cards = [["Total Dosen", t.dosen, "person_pin"], ["Total Mahasiswa", t.mhs, "groups"], ["Total Mata Kuliah", t.courses, "menu_book"], ["Total Tugas", t.tasks, "assignment"]];
  return (
    <>
      <PageHeader title="Dashboard Admin" sub="Selamat datang, Admin. Ringkasan data dan statistik sistem." />
      <div className="grid gap-gutter sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([l, v, i]) => (
          <div key={l as string} className="card flex items-center justify-between">
            <div><p className="text-body-md text-on-surface-variant">{l}</p><p className="text-display-lg">{v as number}</p></div>
            <span className="material-symbols-outlined rounded-xl bg-primary-fixed p-space-sm text-primary">{i}</span>
          </div>
        ))}
      </div>
      <div className="mt-gutter grid gap-gutter lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="text-headline-md">Statistik Penggunaan Sistem</h2>
          <p className="mb-space-md text-body-sm text-on-surface-variant">Aktivitas sistem selama 12 bulan terakhir</p>
          <UsageChart data={chart} />
        </div>
        <div className="card">
          <h2 className="mb-space-md text-headline-md">Pengguna Berdasarkan Role</h2>
          <dl className="space-y-space-sm text-body-md">
            {[["Dosen", t.dosen], ["Mahasiswa", t.mhs], ["Akun Aktif", t.aktif], ["Akun Nonaktif", t.nonaktif]].map(([k, v]) => (
              <div key={k as string} className="flex justify-between"><dt className="text-on-surface-variant">{k}</dt><dd className="font-semibold">{v as number}</dd></div>
            ))}
          </dl>
          <div className="mt-space-md rounded-xl bg-[#ecfdf5] p-space-md text-[#059669]"><p className="text-label-sm uppercase">Tugas Selesai</p><p className="text-headline-lg">{t.done}</p></div>
        </div>
      </div>
      <div className="mt-gutter grid gap-gutter lg:grid-cols-3">
        <div className="card">
          <div className="mb-space-md flex justify-between"><h2 className="text-headline-md">Dosen Terbaru</h2><Link href="/admin/dosen" className="text-label-md text-primary">Kelola</Link></div>
          <ul className="space-y-space-sm">{lecturers.map((l: any) => <li key={l.id} className="flex items-center justify-between rounded-lg bg-surface-container-low p-space-sm"><span className="text-body-md font-semibold">{l.name}</span><StatusBadge s={l.status} /></li>)}
            {lecturers.length === 0 && <li className="text-body-sm text-on-surface-variant">Belum ada dosen.</li>}</ul>
        </div>
        <div className="card">
          <h2 className="mb-space-md text-headline-md">Tugas Populer</h2>
          <ul className="space-y-space-sm">{popular.map((p: any, i: number) => <li key={i} className="rounded-lg bg-surface-container-low p-space-sm"><p className="text-body-md font-semibold">{p.title}</p><p className="text-body-sm text-on-surface-variant">{p.course} • {p.n} pengumpulan</p></li>)}
            {popular.length === 0 && <li className="text-body-sm text-on-surface-variant">Belum ada tugas.</li>}</ul>
        </div>
        <div className="card">
          <h2 className="mb-space-md text-headline-md">Aktivitas Terbaru</h2>
          <ul className="space-y-space-sm">{logs.map((l: any, i: number) => <li key={i} className="text-body-md">{l.description}<span className="block text-body-sm text-on-surface-variant">{new Date(l.created_at).toLocaleString("id-ID")}</span></li>)}
            {logs.length === 0 && <li className="text-body-sm text-on-surface-variant">Belum ada aktivitas.</li>}</ul>
        </div>
      </div>
    </>
  );
}
