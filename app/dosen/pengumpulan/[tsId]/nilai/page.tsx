import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { fmtDate } from "@/lib/utils";
import { gradeSubmission } from "@/app/dosen/actions";
import { Notice } from "@/components/ui";
import { TextArea } from "@/components/form";
import { Pill } from "@/components/badges";

export default async function Page({ params, searchParams }: { params: Promise<{ tsId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireRole("dosen");
  const id = Number((await params).tsId);
  const sp = await searchParams;
  if (!Number.isInteger(id)) notFound();
  const [r] = await query(`SELECT ts.id,u.name,u.nim,u.class_name,t.id task_id,t.title,t.code,c.name course,s.id sub_id,s.submitted_at,s.status,s.grade,s.feedback,(s.submitted_at>t.deadline) late
    FROM task_students ts JOIN tasks t ON t.id=ts.task_id JOIN courses c ON c.id=t.course_id JOIN users u ON u.id=ts.student_id
    JOIN task_submissions s ON s.task_student_id=ts.id WHERE ts.id=? AND t.lecturer_id=?`, [id, me.uid]);
  if (!r) notFound();
  const files = await query("SELECT id,original_name,file_type,file_size FROM submission_files WHERE submission_id=? ORDER BY id", [r.sub_id]);
  const pv = files.find((f: any) => String(f.id) === sp.preview);
  return (
    <>
      <Link href={`/dosen/pengumpulan?task=${r.task_id}`} className="text-label-md text-primary">← Kembali ke Pengumpulan Tugas</Link>
      <h1 className="mt-space-sm text-display-lg">Penilaian Tugas Mahasiswa</h1>
      <p className="mb-space-lg text-body-lg text-on-surface-variant">Evaluasi hasil pengerjaan dan berikan feedback konstruktif.</p>
      <div className="card mb-gutter flex flex-wrap items-center justify-between gap-space-md">
        <div>
          <p className="text-title-md">{r.name} <span className="text-body-sm font-normal text-on-surface-variant">• NIM {r.nim} • {r.class_name}</span></p>
          <p className="text-body-md">Tugas: <b>{r.title}</b> <span className="text-on-surface-variant">({r.course})</span></p>
          <p className="text-body-sm text-on-surface-variant">Diserahkan: {fmtDate(r.submitted_at)} {r.late ? <Pill tone="rose">Terlambat</Pill> : <Pill tone="green">Tepat Waktu</Pill>}</p>
        </div>
        {r.status === "graded" ? <Pill tone="green">Dinilai: {r.grade}/100</Pill> : <Pill tone="amber">Menunggu Penilaian</Pill>}
      </div>
      <div className="grid gap-gutter lg:grid-cols-2">
        <div className="space-y-gutter">
          <div className="card">
            <h2 className="mb-space-md text-headline-md">Berkas Pengumpulan <span className="text-body-sm font-normal text-on-surface-variant">({files.length} berkas)</span></h2>
            <ul className="space-y-space-sm">
              {files.map((f: any) => {
                const prev = ["application/pdf", "image/png", "image/jpeg"].includes(f.file_type);
                return (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-space-sm rounded-xl bg-surface-container-low p-space-sm">
                    <div><p className="font-semibold">{f.original_name}</p><p className="text-body-sm text-on-surface-variant">{(f.file_size / 1024).toFixed(0)} KB</p></div>
                    <div className="flex gap-space-xs">
                      {prev && <Link href={`/dosen/pengumpulan/${id}/nilai?preview=${f.id}`} className="btn-primary h-8 px-3">Preview</Link>}
                      <a href={`/api/files/s${f.id}?download=1`} className="btn-secondary h-8 px-3">Download</a>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-space-sm text-body-sm text-on-surface-variant">Preview tersedia untuk PDF dan gambar.</p>
          </div>
          {pv && (
            <div className="card">
              <h2 className="mb-space-sm text-headline-md">Preview: {pv.original_name}</h2>
              {pv.file_type === "application/pdf"
                ? <iframe src={`/api/files/s${pv.id}`} className="h-[520px] w-full rounded-lg border border-outline-variant" title="Preview PDF" />
                : <img src={`/api/files/s${pv.id}`} alt={pv.original_name} className="max-h-[520px] w-full rounded-lg object-contain" />}
            </div>
          )}
        </div>
        <form action={gradeSubmission.bind(null, id)} className="card h-fit space-y-space-md">
          <h2 className="text-headline-md">Formulir Penilaian</h2>
          <Notice error={sp.error} />
          <div>
            <label className="mb-space-2xs block text-label-md">Nilai Akhir (0–100)<span className="text-error"> *</span></label>
            <input name="grade" type="number" min={0} max={100} step={1} required defaultValue={r.grade ?? ""} className="input h-14 text-headline-lg text-primary" />
          </div>
          <TextArea label="Feedback & Catatan Evaluasi" name="feedback" defaultValue={r.feedback} rows={6} maxLength={500} placeholder="Tulis umpan balik untuk mahasiswa (maks. 500 karakter)" />
          <p className="rounded-xl bg-primary-fixed/40 p-space-sm text-body-sm text-primary">Setelah disimpan, status pengumpulan menjadi Dinilai dan mahasiswa mendapat notifikasi.</p>
          <div className="flex justify-end gap-space-sm"><Link href={`/dosen/pengumpulan?task=${r.task_id}`} className="btn-secondary">Batal</Link><SubmitButton className="btn-primary">Simpan Nilai</SubmitButton></div>
        </form>
      </div>
    </>
  );
}
