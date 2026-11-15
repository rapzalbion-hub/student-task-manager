import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";
import { requireAdmin } from "@/lib/guard";
import { createStudent } from "@/app/admin/actions";
import { PageHeader, Field, SelectField, Notice } from "@/components/ui";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error } = await searchParams;
  return (
    <>
      <PageHeader title="Tambah Mahasiswa" sub="Masukkan data mahasiswa baru untuk membuat akun di sistem." />
      <form action={createStudent} className="card max-w-2xl space-y-space-md">
        <Notice error={error} />
        <div className="grid gap-space-md sm:grid-cols-2"><Field label="Nama Mahasiswa" name="name" /><Field label="NIM" name="nim" hint="Unik dan tidak dapat diubah setelah dibuat." /></div>
        <Field label="Email" name="email" type="email" />
        <div className="grid gap-space-md sm:grid-cols-2"><Field label="Kelas" name="class_name" placeholder="mis. TI-3A" /><Field label="Program Studi" name="study_program" placeholder="Teknik Informatika" /></div>
        <div className="grid gap-space-md sm:grid-cols-2">
          <Field label="Tanggal Lahir" name="birth_date" type="date" hint="Password awal = tanggal lahir (DDMMYYYY) + 2 digit terakhir NIM. Contoh: lahir 15-01-2004, NIM ...01 → 1501200401" />
          <SelectField label="Status Akun" name="status" options={[["active", "Aktif"], ["pending", "Pending"]]} />
        </div>
        <div className="flex justify-end gap-space-sm"><Link href="/admin/mahasiswa" className="btn-secondary">Batal</Link><SubmitButton className="btn-primary">Simpan Mahasiswa</SubmitButton></div>
      </form>
    </>
  );
}
