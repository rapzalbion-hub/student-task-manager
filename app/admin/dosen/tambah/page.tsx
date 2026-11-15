import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";
import { requireAdmin } from "@/lib/guard";
import { createLecturer } from "@/app/admin/actions";
import { PageHeader, Field, SelectField, Notice } from "@/components/ui";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error } = await searchParams;
  return (
    <>
      <PageHeader title="Tambah Dosen" sub="Dosen login memakai NIP atau email beserta password awal di bawah ini." />
      <form action={createLecturer} className="card max-w-2xl space-y-space-md">
        <Notice error={error} />
        <Field label="Nama Dosen" name="name" placeholder="mis. Dr. Budi Santoso, M.Kom" />
        <div className="grid gap-space-md sm:grid-cols-2"><Field label="NIP" name="nip" /><Field label="Email" name="email" type="email" /></div>
        <div className="grid gap-space-md sm:grid-cols-2">
          <SelectField label="Status Akun" name="status" options={[["active", "Aktif"], ["pending", "Pending"]]} />
          <Field label="Password Awal" name="password" hint="Minimal 8 karakter. Berikan ke dosen. Dosen wajib menggantinya saat login pertama." />
        </div>
        <div className="flex justify-end gap-space-sm"><Link href="/admin/dosen" className="btn-secondary">Batal</Link><SubmitButton className="btn-primary">Simpan Dosen</SubmitButton></div>
      </form>
    </>
  );
}
