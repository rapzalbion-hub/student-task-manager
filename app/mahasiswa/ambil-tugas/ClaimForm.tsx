"use client";
import { useActionState } from "react";
import { claimTask } from "@/app/mahasiswa/actions";

export default function ClaimForm() {
  const [st, action, pending] = useActionState(claimTask, undefined);
  return (
    <form action={action} noValidate>
      <label className="mb-space-xs block text-label-md">Kode Tugas <span className="text-error">*</span></label>
      <input name="code" placeholder="TGS-WEB-8F29" autoComplete="off" aria-invalid={!!st?.error}
        className={`input h-12 text-title-md uppercase tracking-widest ${st?.error ? "!border-error ring-2 ring-error/20" : ""}`} />
      <p className="mt-space-xs text-body-sm text-on-surface-variant">Format kode terdiri dari huruf dan angka, contoh: TGS-WEB-8F29</p>
      {st?.error && (
        <div role="alert" className="mt-space-md rounded-xl border border-[#fecdd3] bg-[#fff1f2] p-space-md text-body-md text-[#e11d48]">
          <b>{st.error}</b>
          <p className="mt-1 text-body-sm">Periksa kembali penulisan kode atau hubungi dosen pengampu.</p>
        </div>
      )}
      <div className="mt-space-lg flex gap-space-sm">
        <button className="btn-primary h-12 px-space-lg" disabled={pending}>{pending ? "Memproses..." : "Ambil Tugas"}</button>
        <a href="#bantuan" className="btn-secondary h-12 px-space-lg">? Bantuan</a>
      </div>
    </form>
  );
}
