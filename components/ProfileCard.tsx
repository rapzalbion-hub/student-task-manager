import { Field, Notice } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
import { changePassword, updateEmail } from "@/app/actions/password";

export default function ProfileCard({ rows, error, ok, email }: { rows: [string, string | null][]; error?: string; ok?: string; email?: string | null }) {
  return (
    <>
      <Notice error={error} ok={ok ? "Perubahan berhasil disimpan." : undefined} />
      <div className="grid gap-gutter lg:grid-cols-2">
        <div className="space-y-gutter">
          <div className="card">
            <h2 className="mb-space-md text-headline-md">Data Akun</h2>
            <dl className="space-y-space-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-space-md border-b border-surface-container pb-space-xs text-body-md"><dt className="text-on-surface-variant">{k}</dt><dd className="font-semibold">{v || "-"}</dd></div>
              ))}
            </dl>
          </div>
          {email !== undefined && (
            <form action={updateEmail} className="card space-y-space-md">
              <h2 className="text-headline-md">Email</h2>
              <p className="text-body-sm text-on-surface-variant">Email dapat dipakai untuk login dan untuk reset password lewat menu &quot;Lupa password&quot;.</p>
              <Field label="Email" name="email" type="email" defaultValue={email} />
              <Field label="Password Saat Ini" name="current" type="password" hint="Diperlukan untuk konfirmasi perubahan email." />
              <SubmitButton className="btn-primary">Simpan Email</SubmitButton>
            </form>
          )}
        </div>
        <form action={changePassword} className="card h-fit space-y-space-md">
          <h2 className="text-headline-md">Ganti Password</h2>
          <Field label="Password Saat Ini" name="current" type="password" />
          <Field label="Password Baru" name="next" type="password" hint="Minimal 8 karakter." />
          <Field label="Konfirmasi Password Baru" name="confirm" type="password" />
          <SubmitButton className="btn-primary">Simpan Password</SubmitButton>
        </form>
      </div>
    </>
  );
}
