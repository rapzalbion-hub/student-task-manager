"use client";
import { useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { resetPassword } from "./actions";

export default function ResetPasswordForm({ token, error }: { token: string; error?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <form action={resetPassword} className="space-y-space-md">
      <input type="hidden" name="token" value={token} />
      {error && <p className="rounded-lg bg-error-container px-space-sm py-space-xs text-body-sm text-on-error-container">{error}</p>}
      <div>
        <label htmlFor="new-password" className="mb-space-2xs block text-label-md">Password Baru</label>
        <div className="relative">
          <input id="new-password" name="password" type={showPassword ? "text" : "password"} required minLength={8} className="input pr-10" autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 cursor-pointer text-outline hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} aria-pressed={showPassword}>
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{showPassword ? "visibility_off" : "visibility"}</span>
          </button>
        </div>
        <p className="mt-space-2xs text-body-sm text-on-surface-variant">Minimal 8 karakter.</p>
      </div>
      <div>
        <label htmlFor="confirm-password" className="mb-space-2xs block text-label-md">Konfirmasi Password Baru</label>
        <div className="relative">
          <input id="confirm-password" name="confirm" type={showConfirm ? "text" : "password"} required className="input pr-10" autoComplete="new-password" />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-2.5 cursor-pointer text-outline hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" aria-label={showConfirm ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"} aria-pressed={showConfirm}>
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{showConfirm ? "visibility_off" : "visibility"}</span>
          </button>
        </div>
      </div>
      <SubmitButton className="btn-primary h-12 w-full">Simpan Password Baru</SubmitButton>
    </form>
  );
}
