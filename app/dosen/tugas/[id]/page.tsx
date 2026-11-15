import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { fmtDate } from "@/lib/utils";
import { ASSESS, TYPE, timeLeft } from "@/lib/status";
import { Notice } from "@/components/ui";
import { Pill, Progress, WorkBadge } from "@/components/badges";
import CopyButton from "@/components/CopyButton";

const TABS = [["detail", "Detail Tugas"], ["pengumpulan", "Pengumpulan"], ["mahasiswa", "Mahasiswa"], ["lampiran", "Lampiran"]];

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireRole("dosen");
  const id = Number((await params).id);
  const sp = await searchParams;
  if (!Number.isInteger(id)) notFound();
  const [t] = await query(`SELECT t.*,c.name course,c.semester,
    (SELECT COUNT(*) FROM task_students WHERE task_id=t.id) claimed,
    (SELECT COUNT(*) FROM task_submissions s JOIN task_students ts ON ts.id=s.task_student_id WHERE ts.task_id=t.id) submitted
    FROM tasks t JOIN courses c ON c.id=t.course_id WHERE t.id=? AND t.lecturer_id=?`, [id, me.uid]);
  if (!t) notFound();
  const tab = TABS.some(([k]) => k === sp.tab) ? sp.tab! : "detail";
  const pct = t.claimed ? Math.round((t.submitted / t.claimed) * 100) : 0;
  const subs = tab === "pengumpulan" ? await query(`SELECT ts.id,u.name,u.nim,s.submitted_at,s.status,s.grade,(s.submitted_at>t.deadline) late FROM task_students ts JOIN tasks t ON t.id=ts.task_id
    JOIN users u ON u.id=ts.student_id JOIN task_submissions s ON s.task_student_id=ts.id WHERE ts.task_id=? ORDER BY s.submitted_at DESC`, [id]) : [];
  const studs = tab === "mahasiswa" ? await query("SELECT u.name,u.nim,u.class_name,ts.claimed_at,ts.progress,ts.status FROM task_students ts JOIN users u ON u.id=ts.student_id WHERE ts.task_id=? ORDER BY u.name", [id]) : [];
  const files = tab === "lampiran" ? await query("SELECT id,original_name,file_size,created_at FROM attachments WHERE task_id=? ORDER BY id", [id]) : [];
  return (
    <>
      <div className="mb-space-md flex flex-wrap items-center justify-between gap-space-sm">
        <Link href="/dosen/tugas" className="btn-secondary">← Kembali ke Daftar Tugas</Link>
        <Link href={`/dosen/tugas/${id}/edit`} className="btn-primary">Edit Tugas</Link>
      </div>
      {sp.created && <Notice ok="Tugas berhasil dibuat. Bagikan Kode Tugas ke mahasiswa agar mereka dapat mengambilnya." />}
      {sp.saved && <Notice ok="Perubahan tugas disimpan." />}
      <div className="card">
        <div className="flex flex-wrap items-center gap-space-sm">
          <Pill tone={t.status === "active" ? "green" : "gray"}>{t.status === "active" ? "Aktif" : "Ditutup"}</Pill>
          <span className="inline-flex items-center gap-2 rounded bg-primary-fixed px-2 py-1 text-label-md text-primary">Kode: {t.code}<CopyButton text={t.code} /></span>
        </div>
        <div className="mt-space-sm flex flex-wrap items-end justify-between gap-space-md"><h1 className="text-display-lg">{t.title}</h1><div className="rounded-xl bg-primary-fixed/50 p-space-sm text-body-sm"><p className="text-label-sm uppercase text-on-surface-variant">Sisa Waktu</p><p className="font-semibold text-[#e11d48]">{timeLeft(t.deadline)}</p></div></div>
      </div>
      <div className="mt-gutter grid gap-gutter sm:grid-cols-2 xl:grid-cols-4">
        {[["Mata Kuliah", `${t.course} (Semester ${t.semester})`], ["Jenis Penilaian", ASSESS[t.assessment_type]], ["Tipe Tugas", TYPE[t.task_type]], ["Deadline", fmtDate(t.deadline)]].map(([k, v]) => (
          <div key={k} className="card"><p className="text-label-sm uppercase text-on-surface-variant">{k}</p><p className="text-title-md">{v}</p></div>
        ))}
      </div>
      <div className="card mt-gutter">
        <p className="mb-space-xs text-title-md">Progress Pengumpulan: <span className="text-primary">{t.submitted} / {t.claimed} Mahasiswa</span></p>
        <Progress value={pct} />
      </div>
      <div className="mt-gutter flex flex-wrap gap-space-xs">
        {TABS.map(([k, l]) => <Link key={k} href={`/dosen/tugas/${id}?tab=${k}`} className={`rounded-lg px-space-md py-space-sm text-label-md ${tab === k ? "bg-inverse-surface text-inverse-on-surface" : "bg-surface-container-lowest hover:bg-surface-container"}`}>{l}</Link>)}
      </div>
      <div className="card mt-space-md">
        {tab === "detail" && <><h2 className="mb-space-sm text-headline-md">Instruksi & Panduan</h2><p className="whitespace-pre-wrap text-body-lg">{t.description}</p></>}
        {tab === "pengumpulan" && (
          <ul className="divide-y divide-surface-container">
            {subs.map((s: any) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-space-sm py-space-sm">
                <div><p className="font-semibold">{s.name} <span className="text-body-sm text-on-surface-variant">• {s.nim}</span></p><p className="text-body-sm text-on-surface-variant">{fmtDate(s.submitted_at)}</p></div>
                <div className="flex items-center gap-space-xs">{s.late ? <Pill tone="rose">Terlambat</Pill> : null}{s.status === "graded" ? <Pill tone="green">{s.grade}/100</Pill> : <Pill tone="amber">Belum dinilai</Pill>}<Link href={`/dosen/pengumpulan/${s.id}/nilai`} className="btn-secondary h-8 px-3">{s.status === "graded" ? "Lihat" : "Nilai"}</Link></div>
              </li>
            ))}
            {subs.length === 0 && <li className="text-body-sm text-on-surface-variant">Belum ada pengumpulan.</li>}
          </ul>
        )}
        {tab === "mahasiswa" && (
          <ul className="divide-y divide-surface-container">
            {studs.map((s: any, i: number) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-space-sm py-space-sm">
                <div><p className="font-semibold">{s.name} <span className="text-body-sm text-on-surface-variant">• {s.nim} • {s.class_name}</span></p><p className="text-body-sm text-on-surface-variant">Mengambil {fmtDate(s.claimed_at)}</p></div>
                <WorkBadge s={s.status} />
              </li>
            ))}
            {studs.length === 0 && <li className="text-body-sm text-on-surface-variant">Belum ada mahasiswa yang mengambil tugas ini.</li>}
          </ul>
        )}
        {tab === "lampiran" && (
          <ul className="space-y-space-sm">
            {files.map((f: any) => (
              <li key={f.id} className="flex items-center justify-between rounded-xl bg-surface-container-low p-space-sm">
                <div><p className="font-semibold">{f.original_name}</p><p className="text-body-sm text-on-surface-variant">{(f.file_size / 1024).toFixed(0)} KB • {fmtDate(f.created_at)}</p></div>
                <a href={`/api/files/a${f.id}?download=1`} className="btn-primary h-8 px-3">Download</a>
              </li>
            ))}
            {files.length === 0 && <li className="text-body-sm text-on-surface-variant">Belum ada lampiran. Tambahkan lewat Edit Tugas.</li>}
          </ul>
        )}
      </div>
    </>
  );
}
