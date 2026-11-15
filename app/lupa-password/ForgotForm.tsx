"use client";
import { useActionState } from "react";
import { requestReset } from "./actions";

export default function ForgotForm({ devMode }: { devMode: boolean }) {
  const [st, action, pending] = useActionState(requestReset, undefined);
  if (st?.done) {
    return (
      <div className="rounded-lg border border-[#a7f3d0] bg-[#ecfdf5] p-space-md text-body-md text-[#059669]">
        Jika email terdaftar, tautan reset password sudah dikirim dan berlaku 30 menit. Periksa kotak masuk atau folder spam.
        {devMode && <p className="mt-space-sm text-body-sm">Mode pengembangan: SMTP belum diatur, tautan reset dicetak di terminal tempat <code>npm run dev</code> berjalan.</p>}
      </div>
    );
  }
  return (
    <form action={action} className="space-y-space-md">
      <div><label className="mb-space-2xs block text-label-md">Email Akun</label><input name="email" type="email" required className="input" placeholder="nama@email.com" autoComplete="email" /></div>
      {st?.error && <p className="rounded-lg bg-error-container px-space-sm py-space-xs text-body-sm text-on-error-container">{st.error}</p>}
      <button className="btn-primary h-12 w-full" disabled={pending}>{pending ? "Memproses..." : "Kirim Tautan Reset"}</button>
    </form>
  );
}
