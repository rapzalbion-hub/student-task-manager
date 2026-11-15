"use client";
import { useState } from "react";
import SubmitButton from "@/components/SubmitButton";

export default function ConfirmAction({ label, title, message, action, danger = true, children }: {
  label: string; title: string; message: string; action: (fd: FormData) => void | Promise<void>; danger?: boolean; children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={danger ? "btn-danger" : "btn-secondary"} onClick={() => setOpen(true)}>{label}</button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <form action={action} className="card w-full max-w-md shadow-modal">
            <h3 className="text-headline-md">{title}</h3>
            <p className="mt-space-xs text-body-md text-on-surface-variant">{message}</p>
            {children}
            <div className="mt-space-lg flex justify-end gap-space-sm">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Batal</button>
              <SubmitButton className={danger ? "btn-danger" : "btn-primary"}>Ya, lanjutkan</SubmitButton>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
