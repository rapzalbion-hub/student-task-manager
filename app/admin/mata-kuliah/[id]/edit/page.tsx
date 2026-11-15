import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/database";
import { requireAdmin } from "@/lib/guard";
import { updateCourse, setCourseStatus } from "@/app/admin/actions";
import { PageHeader, Field, SelectField, Notice, StatusBadge } from "@/components/ui";
import ConfirmAction from "@/components/ConfirmAction";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const id = Number((await params).id);
  const sp = await searchParams;
  if (!Number.isInteger(id)) notFound();
  const [c] = await query("SELECT * FROM courses WHERE id=?", [id]);
  if (!c) notFound();
  const lec = await query("SELECT id,name FROM users WHERE role='dosen' AND (status='active' OR id=?) ORDER BY name", [c.lecturer_id]);
  return (
    <>
      <PageHeader title="Edit Mata Kuliah" sub="Ubah data mata kuliah dan atur ketersediaannya di form tugas." action={<div className="flex flex-wrap items-center gap-space-sm"><StatusBadge s={c.status} /><Link href={`/admin/mata-kuliah/tambah?lecturer_id=${c.lecturer_id}`} className="btn-primary">+ Tambah Mata Kuliah</Link></div>} />
      <div className="max-w-2xl space-y-gutter">
        <Notice error={sp.error} />
        {sp.saved && <Notice ok="Perubahan berhasil disimpan." />}
        <form action={updateCourse.bind(null, id)} className="card space-y-space-md">
          <div className="grid gap-space-md sm:grid-cols-2"><Field label="Kode Mata Kuliah" name="code" defaultValue={c.code} /><Field label="Semester" name="semester" type="number" defaultValue={c.semester} /></div>
          <Field label="Nama Mata Kuliah" name="name" defaultValue={c.name} />
          <SelectField label="Dosen Pengampu" name="lecturer_id" defaultValue={c.lecturer_id} options={lec.map((l: any) => [l.id, l.name])} />
          <div className="flex justify-end gap-space-sm"><Link href="/admin/mata-kuliah" className="btn-secondary">Batal</Link><SubmitButton className="btn-primary">Simpan Perubahan</SubmitButton></div>
        </form>
        <div className="card">
          <h2 className="text-headline-md">Tindakan</h2>
          <p className="mb-space-md mt-space-xs text-body-md text-on-surface-variant">Mata kuliah tidak dapat dihapus. Mata kuliah nonaktif tidak muncul di form Buat Tugas, tetapi tugas lama tetap tersimpan.</p>
          {c.status === "active"
            ? <ConfirmAction label="Nonaktifkan Mata Kuliah" title="Nonaktifkan mata kuliah?" message="Mata kuliah tidak akan muncul lagi di form Buat Tugas." action={setCourseStatus.bind(null, id, "inactive")} />
            : <ConfirmAction danger={false} label="Aktifkan Mata Kuliah" title="Aktifkan mata kuliah?" message="Mata kuliah akan muncul kembali di form Buat Tugas." action={setCourseStatus.bind(null, id, "active")} />}
        </div>
      </div>
    </>
  );
}
