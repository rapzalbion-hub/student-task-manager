import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
const MAXMB = Number(process.env.MAX_UPLOAD_MB) || 10;
const jpg = { mimes: ["image/jpeg"], magic: [[0xff, 0xd8, 0xff]] };
const RULES: Record<string, { mimes: string[]; magic: number[][] }> = {
  pdf: { mimes: ["application/pdf"], magic: [[0x25, 0x50, 0x44, 0x46]] },
  doc: { mimes: ["application/msword"], magic: [[0xd0, 0xcf, 0x11, 0xe0]] },
  docx: { mimes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], magic: [[0x50, 0x4b, 0x03, 0x04]] },
  zip: { mimes: ["application/zip", "application/x-zip-compressed", "application/octet-stream"], magic: [[0x50, 0x4b, 0x03, 0x04]] },
  png: { mimes: ["image/png"], magic: [[0x89, 0x50, 0x4e, 0x47]] },
  jpg, jpeg: jpg,
};
export type Saved = { original: string; stored: string; type: string; size: number };

export const realFiles = (fd: FormData, name: string) =>
  fd.getAll(name).filter((f): f is File => f instanceof File && f.size > 0 && !!f.name);

export async function saveFiles(files: File[], max = 5): Promise<{ saved?: Saved[]; error?: string }> {
  if (files.length > max) return { error: `Maksimal ${max} file.` };
  const ok: { f: File; buf: Buffer; ext: string }[] = [];
  for (const f of files) {
    const ext = (f.name.split(".").pop() ?? "").toLowerCase();
    const rule = RULES[ext];
    if (!rule) return { error: `Tipe file "${f.name}" tidak diizinkan (PDF, DOC, DOCX, ZIP, PNG, JPG).` };
    if (f.size > MAXMB * 1024 * 1024) return { error: `"${f.name}" melebihi ${MAXMB} MB.` };
    if (!rule.mimes.includes(f.type)) return { error: `MIME type "${f.name}" tidak sesuai.` };
    const buf = Buffer.from(await f.arrayBuffer());
    if (!rule.magic.some((m) => m.every((b, i) => buf[i] === b))) return { error: `Isi file "${f.name}" tidak sesuai ekstensinya.` };
    ok.push({ f, buf, ext });
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const saved: Saved[] = [];
  for (const o of ok) {
    const stored = `${randomUUID()}.${o.ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, stored), o.buf);
    saved.push({ original: o.f.name.slice(0, 255), stored, type: o.f.type || "application/octet-stream", size: o.f.size });
  }
  return { saved };
}
export async function removeStored(names: string[]) {
  for (const n of names) { try { await fs.unlink(path.join(UPLOAD_DIR, path.basename(n))); } catch {} }
}
