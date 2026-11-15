import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";
import { query } from "@/lib/database";
import { requireAdmin } from "@/lib/guard";
import { createCourse } from "@/app/admin/actions";
import { PageHeader, Field, SelectField, Notice } from "@/components/ui";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; lecturer_id?: string }> }) {
  await requireAdmin();
  const { error, lecturer_id } = await searchParams;
  const lec = await query("SELECT id,name FROM users WHERE role='dosen' AND status='active' ORDER BY name");
  const lecturerId = lec.some((l: any) => String(l.id) === lecturer_id) ? Number(lecturer_id) : undefined;
  return (
    <>
      <PageHeader title="Tambah Mata Kuliah" sub="Hanya dosen aktif yang dapat dipilih sebagai pengampu." />
      <form action={createCourse} className="card max-w-2xl space-y-space-md">
        <Notice error={error} />
        {lec.length === 0 && <Notice error="Belum ada dosen aktif. Tambahkan dosen terlebih dahulu." />}
        <div className="grid gap-space-md sm:grid-cols-2"><Field label="Kode Mata Kuliah" name="code" placeholder="mis. TI101" /><Field label="Semester" name="semester" type="number" placeholder="1-14" /></div>
        <Field label="Nama Mata Kuliah" name="name" placeholder="mis. Pemrograman Web" />
        <SelectField label="Dosen Pengampu" name="lecturer_id" defaultValue={lecturerId} options={lec.map((l: any) => [l.id, l.name])} />
        <div className="flex justify-end gap-space-sm"><Link href="/admin/mata-kuliah" className="btn-secondary">Batal</Link><SubmitButton className="btn-primary">Simpan Mata Kuliah</SubmitButton></div>
      </form>
    </>
  );
}
