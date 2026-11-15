"use client";
import { useState } from "react";
export default function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" title="Salin" className="text-primary" onClick={async () => { try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); } catch {} }}>
      <span className="material-symbols-outlined text-[18px]">{ok ? "check" : "content_copy"}</span>
    </button>
  );
}
