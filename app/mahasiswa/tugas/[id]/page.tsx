import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { fmtDate } from "@/lib/utils";
import { timeLeft } from "@/lib/status";
import { addSubtask, toggleSubtask, renameSubtask, deleteSubtask, setProgress, saveNotes, submitTask } from "@/app/mahasiswa/actions";
import { Notice } from "@/components/ui";
import { FileInput } from "@/components/form";
import { Pill, Progress, WorkBadge } from "@/components/badges";
import CopyButton from "@/components/CopyButton";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireRole("mahasiswa");
  const id = Number((await params).id);
  const sp = await searchParams;
  if (!Number.isInteger(id)) notFound();
  const [r] = await query(`SELECT ts.id ts_id,ts.progress,ts.status work,ts.notes,t.id task_id,t.code,t.title,t.description,t.deadline,c.name course,u.name lecturer,
    s.id sub_id,s.status sub,s.grade,s.feedback,s.graded_at,s.submitted_at,(s.submitted_at>t.deadline) late
    FROM task_students ts JOIN tasks t ON t.id=ts.task_id JOIN courses c ON c.id=t.course_id JOIN users u ON u.id=t.lecturer_id
    LEFT JOIN task_submissions s ON s.task_student_id=ts.id WHERE ts.student_id=? AND t.id=?`, [me.uid, id]);
  if (!r) notFound();
  const subs = await query("SELECT id,title,is_completed FROM subtasks WHERE task_student_id=? ORDER BY id", [r.ts_id]);
  const atts = await query("SELECT id,original_name,file_size FROM attachments WHERE task_id=? ORDER BY id", [id]);
  const myFiles = r.sub_id ? await query("SELECT id,original_name,file_size FROM submission_files WHERE submission_id=? ORDER BY id", [r.sub_id]) : [];
  const doneN = subs.filter((s: any) => s.is_completed).length;
  const graded = r.sub === "graded";
  return (
    <>
      <div className="mb-space-md flex flex-wrap items-center justify-between gap-space-sm">
        <Link href="/mahasiswa/tugas-saya" className="btn-secondary">← Kembali ke Tugas Saya</Link>
        <span className="inline-flex items-center gap-2 rounded bg-primary-fixed px-2 py-1 text-label-md text-primary">KODE: {r.code}<CopyButton text={r.code} /></span>
      </div>
      <Notice error={sp.error} />
      {sp.ok && <Notice ok="Tugas berhasil dikumpulkan." />}
      <div className="card flex flex-wrap items-start justify-between gap-space-md">
        <div>
          <p className="text-body-sm text-on-surface-variant">Dosen: {r.lecturer}</p>
          <h1 className="text-display-lg">{r.title}</h1>
          <div className="mt-space-sm flex flex-wrap items-center gap-space-sm text-body-sm">
            <span>Pekerjaan:</span><WorkBadge s={r.work} />
            <span>Pengumpulan:</span>{r.sub ? <Pill tone="green">{graded ? "Dinilai" : "Terkirim"}</Pill> : <Pill tone="gray">Belum Mengumpulkan</Pill>}{r.late ? <Pill tone="rose">Terlambat</Pill> : null}
            <span>Nilai:</span><b>{graded ? `${r.grade}/100` : "-"}</b>
          </div>
        </div>
        {!graded && <a href="#upload" className="btn-primary">Kumpulkan Tugas</a>}
      </div>
      <div className="mt-gutter grid gap-gutter lg:grid-cols-3">
        <div className="space-y-gutter lg:col-span-2">
          <div className="card">
            <div className="mb-space-md grid gap-space-md sm:grid-cols-2">
              <div className="rounded-xl bg-primary-fixed/40 p-space-md"><p className="text-label-sm uppercase text-on-surface-variant">Mata Kuliah</p><p className="text-title-md">{r.course}</p></div>
              <div className="rounded-xl bg-[#fff1f2] p-space-md"><p className="text-label-sm uppercase text-on-surface-variant">Batas Waktu</p><p className="text-title-md text-[#e11d48]">{fmtDate(r.deadline)}</p><p className="text-body-sm">{timeLeft(r.deadline)}</p></div>
            </div>
            <h2 className="mb-space-xs text-headline-md">Deskripsi & Ketentuan</h2>
            <p className="whitespace-pre-wrap text-body-lg">{r.description}</p>
            {atts.length > 0 && (
              <div className="mt-space-md rounded-xl bg-surface-container-low p-space-md">
                <p className="mb-space-sm text-label-sm uppercase text-on-surface-variant">Lampiran / Materi Dosen</p>
                <ul className="space-y-space-sm">{atts.map((a: any) => <li key={a.id} className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-space-sm"><span className="font-semibold">{a.original_name}</span><a href={`/api/files/a${a.id}?download=1`} className="btn-secondary h-8 px-3">Download</a></li>)}</ul>
              </div>
            )}
          </div>
          <div className="card">
            <div className="mb-space-sm flex items-center justify-between"><h2 className="text-headline-md">Subtask & Progres Pengerjaan</h2>{subs.length > 0 && <span className="text-label-md text-primary">{doneN}/{subs.length} selesai ({r.progress}%)</span>}</div>
            <Progress value={r.progress} />
            <ul className="mt-space-md space-y-space-xs">
              {subs.map((s: any) => (
                <li key={s.id} className="flex items-center gap-space-sm rounded-lg bg-surface-container-low p-space-xs">
                  <form action={toggleSubtask.bind(null, r.ts_id, s.id)}>
                    <button aria-label="Centang" className={`flex h-[18px] w-[18px] items-center justify-center rounded border-[1.5px] ${s.is_completed ? "border-primary-container bg-primary-container text-on-primary" : "border-[#cbd5e1]"}`}>{s.is_completed ? <span className="material-symbols-outlined text-[14px]">check</span> : null}</button>
                  </form>
                  <span className={`flex-1 text-body-md ${s.is_completed ? "text-[#94a3b8] line-through" : ""}`}>{s.title}</span>
                  <details className="relative"><summary className="cursor-pointer list-none text-label-md text-primary">Ubah</summary>
                    <form action={renameSubtask.bind(null, r.ts_id, s.id)} className="absolute right-0 z-10 mt-1 flex gap-1 rounded-lg bg-surface-container-lowest p-2 shadow-hover"><input name="title" defaultValue={s.title} className="input h-8 w-48" /><SubmitButton className="btn-primary h-8 px-3">OK</SubmitButton></form>
                  </details>
                  <form action={deleteSubtask.bind(null, r.ts_id, s.id)}><button className="text-label-md text-[#e11d48]">Hapus</button></form>
                </li>
              ))}
              {subs.length === 0 && <li className="text-body-sm text-on-surface-variant">Belum ada subtask. Tambahkan subtask agar progress dihitung otomatis, atau atur progress manual di bawah.</li>}
            </ul>
            <form action={addSubtask.bind(null, r.ts_id)} className="mt-space-md flex gap-space-sm"><input name="title" placeholder="Tulis subtask baru..." className="input" /><SubmitButton className="btn-secondary whitespace-nowrap">+ Tambah Subtask</SubmitButton></form>
            {subs.length === 0 && (
              <form action={setProgress.bind(null, r.ts_id)} className="mt-space-md flex items-center gap-space-sm">
                <label className="text-label-md">Progress manual</label><input type="range" name="progress" min={0} max={100} step={5} defaultValue={r.progress} className="flex-1" /><SubmitButton className="btn-secondary h-8 px-3">Simpan</SubmitButton>
              </form>
            )}
          </div>
          <form action={saveNotes.bind(null, r.ts_id)} className="card">
            <h2 className="text-headline-md">Catatan Pribadi</h2>
            <p className="mb-space-sm text-body-sm text-on-surface-variant">Catatan ini bersifat privat, hanya untuk Anda.</p>
            <textarea name="notes" defaultValue={r.notes ?? ""} rows={4} className="w-full rounded-lg bg-surface-container-low p-space-sm text-body-md outline-none focus:ring-2 focus:ring-primary-container/20" />
            <SubmitButton className="btn-secondary mt-space-sm">Simpan Catatan</SubmitButton>
          </form>
        </div>
        <div className="space-y-gutter">
          <div id="upload" className="card">
            <h2 className="mb-space-sm text-headline-md">Pengumpulan Berkas</h2>
            {graded ? <p className="text-body-md text-on-surface-variant">Tugas sudah dinilai sehingga berkas tidak dapat diganti.</p> : (
              <form action={submitTask.bind(null, r.ts_id)} className="space-y-space-md">
                <FileInput label="Pilih berkas (maks. 5 file)" name="files" hint="PDF, DOC, DOCX, ZIP, PNG, JPG. Maks. 10 MB per file." />
                <SubmitButton className="btn-primary w-full">{r.sub ? "Ganti & Kumpulkan Ulang" : "Kumpulkan Tugas Sekarang"}</SubmitButton>
                <p className="text-body-sm text-on-surface-variant">Kirim sebelum {fmtDate(r.deadline)}. Pengumpulan setelah itu ditandai Terlambat.</p>
              </form>
            )}
            {myFiles.length > 0 && (
              <div className="mt-space-md"><p className="mb-space-xs text-label-sm uppercase text-on-surface-variant">Berkas terkumpul ({fmtDate(r.submitted_at)})</p>
                <ul className="space-y-space-xs">{myFiles.map((f: any) => <li key={f.id} className="flex items-center justify-between text-body-sm"><span>{f.original_name}</span><a href={`/api/files/s${f.id}?download=1`} className="text-primary">Unduh</a></li>)}</ul></div>
            )}
          </div>
          <div className="card">
            <div className="mb-space-sm flex items-center justify-between"><h2 className="text-headline-md">Penilaian & Umpan Balik</h2>{!graded && <Pill tone="gray">Belum Dinilai</Pill>}</div>
            <div className="rounded-xl bg-primary-fixed/40 p-space-md">
              <p className="text-label-sm uppercase text-on-surface-variant">Nilai Akhir</p>
              <p className="text-display-lg text-primary">{graded ? r.grade : "—"} <span className="text-body-md text-on-surface-variant">/ 100</span></p>
              {graded ? <><p className="mt-space-sm text-label-sm uppercase text-on-surface-variant">Catatan Dosen</p><p className="whitespace-pre-wrap text-body-md">{r.feedback}</p><p className="mt-space-xs text-body-sm text-on-surface-variant">Dinilai: {fmtDate(r.graded_at)}</p></>
                : <p className="mt-space-sm text-body-sm italic text-on-surface-variant">Nilai dan feedback akan tampil di sini setelah dosen memeriksa pengumpulan Anda.</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
