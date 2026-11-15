import Link from "next/link";
import { smtpReady } from "@/lib/mailer";
import ForgotForm from "./ForgotForm";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-margin-mobile">
      <div className="card w-full max-w-md p-space-xl shadow-hover">
        <h1 className="text-headline-lg">Lupa Password</h1>
        <p className="mb-space-lg text-body-md text-on-surface-variant">Masukkan email yang terdaftar pada akun Dosen atau Mahasiswa Anda. Kami akan mengirim tautan untuk membuat password baru. Akun Admin silakan hubungi administrator sistem.</p>
        <ForgotForm devMode={!smtpReady() && process.env.NODE_ENV !== "production"} />
        <Link href="/login" className="mt-space-lg block text-center text-label-md text-primary">← Kembali ke Login</Link>
      </div>
    </div>
  );
}
