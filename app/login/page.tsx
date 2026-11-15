"use client";
import { useState, useActionState } from "react";
import Link from "next/link";
import { login } from "./actions";
const FEATURES = [["schedule", "Transparansi Deadline", "Pelacakan linimasa tugas otomatis."], ["task_alt", "Rubrik Penilaian", "Umpan balik terstruktur dari dosen."], ["notifications", "Notifikasi", "Pengingat deadline dan status penilaian."]];

export default function LoginPage() {
  const [show, setShow] = useState(false);
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-space-2xl p-margin-mobile lg:grid-cols-2 lg:p-margin">
        <div className="hidden lg:block">
          <span className="rounded-full bg-primary-fixed px-space-sm py-space-xs text-label-sm uppercase text-primary">Portal Akademik Terpadu</span>
          <h1 className="mt-space-md text-[56px] font-bold leading-[1.05] tracking-tight">Student Task <span className="text-primary-container">Manager</span></h1>
          <p className="mt-space-sm text-headline-md font-normal text-on-surface-variant">Kelola tugas, pantau progres, raih masa depan.</p>
          <div className="mt-space-xl grid grid-cols-3 gap-space-sm">
            {FEATURES.map(([i, t, d]) => (
              <div key={t} className="card"><span className="material-symbols-outlined rounded-lg bg-primary-fixed p-2 text-primary">{i}</span><p className="mt-space-sm text-label-md">{t}</p><p className="text-body-sm text-on-surface-variant">{d}</p></div>
            ))}
          </div>
        </div>
        <div className="card p-space-xl shadow-hover">
          <h2 className="text-headline-lg">Selamat Datang!</h2>
          <p className="mb-space-lg text-body-md text-on-surface-variant">Masuk menggunakan akun Anda.</p>
          <form action={action} className="space-y-space-md">
            <div><label className="mb-space-2xs block text-label-md">Username</label><input name="identity" className="input" placeholder="Masukkan username" autoComplete="username" required /></div>
            <div>
              <label className="mb-space-2xs block text-label-md">Password</label>
              <div className="relative">
                <input name="password" type={show ? "text" : "password"} className="input pr-10" placeholder="Masukkan password" autoComplete="current-password" required />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-2.5 text-outline" aria-label="Tampilkan password"><span className="material-symbols-outlined text-[20px]">{show ? "visibility_off" : "visibility"}</span></button>
              </div>
            </div>
            {state?.error && <p className="rounded-lg bg-error-container px-space-sm py-space-xs text-body-sm text-on-error-container">{state.error}</p>}
            <button className="btn-primary h-12 w-full bg-inverse-surface hover:bg-inverse-surface/90" disabled={pending}>{pending ? "Memproses..." : "Login"}</button>
            <p className="text-center text-body-sm text-on-surface-variant">Lupa password dosen atau mahasiswa? <Link href="/lupa-password" className="text-primary">Reset lewat email</Link>. Admin dapat menghubungi administrator sistem.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
