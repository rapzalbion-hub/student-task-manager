"use client";
import { useFormStatus } from "react-dom";

/** Tombol submit untuk form Server Action: menampilkan "Memproses..." selama proses berjalan. */
export default function SubmitButton({ children, className = "btn-primary", pendingText = "Memproses..." }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${className} disabled:cursor-wait disabled:opacity-60`}>
      {pending ? pendingText : children}
    </button>
  );
}
