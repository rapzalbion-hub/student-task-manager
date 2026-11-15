import Link from "next/link";
import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { PageHeader } from "@/components/ui";
import { Pill } from "@/components/badges";
import ClaimForm from "./ClaimForm";

export default async function Page() {
  const me = await requireRole("mahasiswa");
  const last = await query(`SELECT t.id,t.title,t.code,t.status,u.name lecturer FROM task_students ts JOIN tasks t ON t.id=ts.task_id JOIN users u ON u.id=t.lecturer_id
    WHERE ts.student_id=? ORDER BY ts.claimed_at DESC LIMIT 3`, [me.uid]);
  return (
    <>
      <PageHeader title="Ambil Tugas" sub="Masukkan kode tugas unik yang diberikan oleh dosen pengampu mata kuliah." />
      <div className="grid gap-gutter lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <ClaimForm />
          <div className="mt-space-xl border-t border-surface-container pt-space-md">
            <div className="mb-space-sm flex justify-between"><span className="text-label-sm uppercase text-on-surface-variant">Tugas terakhir diambil</span><Link href="/mahasiswa/tugas-saya" className="text-label-md text-primary">Buka Tugas Saya →</Link></div>
            <ul className="space-y-space-sm">
              {last.map((t: any) => (
                <li key={t.id} className="flex items-center justify-between rounded-xl bg-surface-container-low p-space-sm">
                  <div><Link href={`/mahasiswa/tugas/${t.id}`} className="font-semibold hover:text-primary">{t.title}</Link><p className="text-body-sm text-on-surface-variant">Kode: {t.code} • Dosen: {t.lecturer}</p></div>
                  <Pill tone={t.status === "active" ? "green" : "gray"}>{t.status === "active" ? "Aktif" : "Ditutup"}</Pill>
                </li>
              ))}
              {last.length === 0 && <li className="text-body-sm text-on-surface-variant">Belum ada tugas yang diambil.</li>}
            </ul>
          </div>
        </div>
        <div id="bantuan" className="card h-fit">
          <h2 className="mb-space-md text-headline-md">Cara Mendapatkan Kode Tugas</h2>
          <ol className="space-y-space-md text-body-md">
            {[["Dosen Membuat Tugas", "Dosen menyusun instruksi serta batas pengumpulan."], ["Pemberian Kode Unik", "Dosen membagikan kode tugas (contoh: TGS-WEB-8F29) di kelas atau grup."], ["Input & Validasi", "Ketikkan kode persis pada formulir di samping."], ["Tersimpan di Tugas Saya", "Setelah berhasil, tugas otomatis masuk ke daftar Tugas Saya."]].map(([t, d], i) => (
              <li key={t} className="flex gap-space-sm"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-label-md text-primary">{i + 1}</span><div><p className="font-semibold">{t}</p><p className="text-body-sm text-on-surface-variant">{d}</p></div></li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}
