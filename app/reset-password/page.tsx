import Link from "next/link";
import { readResetToken } from "@/lib/resetToken";
import { resetPassword } from "./actions";
import SubmitButton from "@/components/SubmitButton";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-screen items-center justify-center bg-background p-margin-mobile"><div className="card w-full max-w-md p-space-xl shadow-hover">{children}</div></div>
  );
  if (sp.done) return shell(<><h1 className="text-headline-lg">Password Berhasil Diubah</h1><p className="my-space-md text-body-md text-on-surface-variant">Silakan login dengan password baru Anda.</p><Link href="/login" className="btn-primary w-full">Masuk</Link></>);
  const v = sp.token ? await readResetToken(sp.token) : null;
  if (!v) return shell(<><h1 className="text-headline-lg">Tautan Tidak Berlaku</h1><p className="my-space-md text-body-md text-on-surface-variant">Tautan reset password tidak valid, sudah dipakai, atau sudah kedaluwarsa (berlaku 30 menit).</p><Link href="/lupa-password" className="btn-primary w-full">Minta Tautan Baru</Link></>);
  return shell(
    <>
      <h1 className="text-headline-lg">Buat Password Baru</h1>
      <p className="mb-space-lg text-body-md text-on-surface-variant">Halo {v.name}, masukkan password baru untuk akun Anda.</p>
      <form action={resetPassword} className="space-y-space-md">
        <input type="hidden" name="token" value={sp.token} />
        {sp.error && <p className="rounded-lg bg-error-container px-space-sm py-space-xs text-body-sm text-on-error-container">{sp.error}</p>}
        <div><label className="mb-space-2xs block text-label-md">Password Baru</label><input name="password" type="password" required minLength={8} className="input" autoComplete="new-password" /><p className="mt-space-2xs text-body-sm text-on-surface-variant">Minimal 8 karakter.</p></div>
        <div><label className="mb-space-2xs block text-label-md">Konfirmasi Password Baru</label><input name="confirm" type="password" required className="input" autoComplete="new-password" /></div>
        <SubmitButton className="btn-primary h-12 w-full">Simpan Password Baru</SubmitButton>
      </form>
    </>
  );
}
