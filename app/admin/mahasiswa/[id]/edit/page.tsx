import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/database";
import { requireAdmin } from "@/lib/guard";
import { updateStudent, resetStudentPassword, setStudentStatus } from "@/app/admin/actions";
import { PageHeader, Field, Notice, StatusBadge } from "@/components/ui";
import ConfirmAction from "@/components/ConfirmAction";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const id = Number((await params).id);
  const sp = await searchParams;
  if (!Number.isInteger(id)) notFound();
  const [u] = await query("SELECT *,TO_CHAR(birth_date,'YYYY-MM-DD') bd FROM users WHERE id=? AND role='mahasiswa'", [id]);
  if (!u) notFound();
  const active = u.status === "active";
  return (
    <>
      <PageHeader title="Edit Mahasiswa" sub="Ubah data mahasiswa dan kelola akun." action={<StatusBadge s={u.status} />} />
      <div className="max-w-2xl space-y-gutter">
        <Notice error={sp.error} />
        {sp.saved && <Notice ok="Perubahan berhasil disimpan.">{sp.newpw && <> Password baru (ditampilkan sekali): <b className="select-all">{sp.newpw}</b></>}</Notice>}
        <form action={updateStudent.bind(null, id)} className="card space-y-space-md">
          <Field label="NIM" name="nim" defaultValue={u.nim} readOnly hint="NIM tidak dapat diubah setelah dibuat." />
          <Field label="Nama Lengkap" name="name" defaultValue={u.name} />
          <Field label="Email" name="email" type="email" defaultValue={u.email} />
          <div className="grid gap-space-md sm:grid-cols-2"><Field label="Kelas" name="class_name" defaultValue={u.class_name} /><Field label="Program Studi" name="study_program" defaultValue={u.study_program} /></div>
          <Field label="Tanggal Lahir" name="birth_date" type="date" defaultValue={u.bd} required={false} hint="Dipakai untuk password awal saat Reset Password (kosongkan kolom password di dialog)." />
          <div className="flex justify-end gap-space-sm"><Link href="/admin/mahasiswa" className="btn-secondary">Batal</Link><SubmitButton className="btn-primary">Simpan Perubahan</SubmitButton></div>
        </form>
        <div className="card">
          <h2 className="text-headline-md">Tindakan Akun</h2>
          <p className="mb-space-md mt-space-xs text-body-md text-on-surface-variant">Akun tidak dapat dihapus. Reset password dilakukan jika mahasiswa lupa kredensial.</p>
          <div className="flex flex-wrap gap-space-sm">
            <ConfirmAction danger={false} label="Reset Password" title="Reset password mahasiswa?" message="Isi password baru, atau kosongkan untuk memakai tanggal lahir (DDMMYYYY) + 2 digit terakhir NIM. Password hasil reset ditampilkan sekali." action={resetStudentPassword.bind(null, id)}>
              <input name="password" className="input mt-space-md" placeholder="Password baru (min. 8 karakter)" />
            </ConfirmAction>
            {active
              ? <ConfirmAction label="Nonaktifkan Akun" title="Nonaktifkan akun mahasiswa?" message={`${u.name} tidak akan bisa login sampai akun diaktifkan kembali.`} action={setStudentStatus.bind(null, id, "inactive")} />
              : <ConfirmAction danger={false} label="Aktifkan Akun" title="Aktifkan akun mahasiswa?" message={`${u.name} akan dapat login kembali.`} action={setStudentStatus.bind(null, id, "active")} />}
          </div>
        </div>
      </div>
    </>
  );
}
