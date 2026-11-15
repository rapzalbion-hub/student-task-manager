import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/database";
import { requireAdmin } from "@/lib/guard";
import { updateLecturer, resetLecturerPassword, setLecturerStatus } from "@/app/admin/actions";
import { PageHeader, Field, Notice, StatusBadge } from "@/components/ui";
import ConfirmAction from "@/components/ConfirmAction";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const id = Number((await params).id);
  const sp = await searchParams;
  if (!Number.isInteger(id)) notFound();
  const [u] = await query("SELECT * FROM users WHERE id=? AND role='dosen'", [id]);
  if (!u) notFound();
  const active = u.status === "active";
  return (
    <>
      <PageHeader title="Edit Dosen" sub="Ubah data dosen dan kelola status akun." action={<StatusBadge s={u.status} />} />
      <div className="max-w-2xl space-y-gutter">
        <Notice error={sp.error} />
        {sp.created && <Notice>Dosen berhasil dibuat. Berikan <b>NIP {u.nip}</b> (atau email) beserta password awal kepada dosen untuk login. Dosen akan diminta mengganti password saat login pertama.</Notice>}
        {sp.saved && <Notice ok="Perubahan berhasil disimpan." />}
        <form action={updateLecturer.bind(null, id)} className="card space-y-space-md">
          <Field label="Nama Lengkap & Gelar" name="name" defaultValue={u.name} />
          <div className="grid gap-space-md sm:grid-cols-2"><Field label="NIP" name="nip" defaultValue={u.nip} /><Field label="Email Kampus" name="email" type="email" defaultValue={u.email} /></div>
          <div className="flex justify-end gap-space-sm"><Link href="/admin/dosen" className="btn-secondary">Batal</Link><SubmitButton className="btn-primary">Simpan Perubahan</SubmitButton></div>
        </form>
        <div className="card">
          <h2 className="text-headline-md">Tindakan Akun</h2>
          <p className="mb-space-md mt-space-xs text-body-md text-on-surface-variant">Akun dosen tidak dapat dihapus agar riwayat tugas dan nilai tetap tersimpan. Akun nonaktif tidak dapat login.</p>
          <div className="flex flex-wrap gap-space-sm">
            <ConfirmAction danger={false} label="Reset Password" title="Reset password dosen?" message="Masukkan password baru. Dosen akan diminta menggantinya saat login berikutnya." action={resetLecturerPassword.bind(null, id)}>
              <input name="password" type="password" minLength={8} required className="input mt-space-md" placeholder="Password baru (min. 8 karakter)" />
            </ConfirmAction>
            {active
              ? <ConfirmAction label="Nonaktifkan Akun" title="Nonaktifkan akun dosen?" message={`${u.name} tidak akan bisa login sampai akun diaktifkan kembali.`} action={setLecturerStatus.bind(null, id, "inactive")} />
              : <ConfirmAction danger={false} label="Aktifkan Akun" title="Aktifkan akun dosen?" message={`${u.name} akan dapat login kembali.`} action={setLecturerStatus.bind(null, id, "active")} />}
          </div>
        </div>
      </div>
    </>
  );
}
