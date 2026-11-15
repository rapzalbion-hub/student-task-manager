export function TextArea({ label, name, defaultValue, rows = 6, placeholder, required = true, maxLength }: { label: string; name: string; defaultValue?: string | null; rows?: number; placeholder?: string; required?: boolean; maxLength?: number }) {
  return (
    <div>
      <label className="mb-space-2xs block text-label-md">{label}{required && <span className="text-error"> *</span>}</label>
      <textarea name={name} defaultValue={defaultValue ?? ""} rows={rows} placeholder={placeholder} required={required} maxLength={maxLength}
        className="w-full rounded-lg border border-transparent bg-surface-container-low p-space-sm text-body-md outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20" />
    </div>
  );
}
export function DeadlineField({ value }: { value?: string }) {
  const [d, t] = (value ?? "").split("T");
  const [hh, mm] = (t ?? "").split(":");
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div>
      <label className="mb-space-2xs block text-label-md">Batas Pengumpulan (Deadline)<span className="text-error"> *</span></label>
      <div className="flex flex-wrap items-center gap-space-sm">
        <input type="date" name="deadline_date" defaultValue={d ?? ""} required className="input w-auto" />
        <select name="deadline_hour" defaultValue={hh || "23"} className="input w-auto" aria-label="Jam">{Array.from({ length: 24 }, (_, i) => <option key={i} value={pad(i)}>{pad(i)}</option>)}</select>
        <span className="text-title-md">:</span>
        <select name="deadline_minute" defaultValue={mm || "59"} className="input w-auto" aria-label="Menit">{Array.from({ length: 60 }, (_, i) => <option key={i} value={pad(i)}>{pad(i)}</option>)}</select>
        <span className="text-body-sm text-on-surface-variant">WIB, format 24 jam (00:00 – 23:59)</span>
      </div>
    </div>
  );
}
export function FileInput({ label, name, hint, multiple = true }: { label: string; name: string; hint?: string; multiple?: boolean }) {
  return (
    <div>
      <label className="mb-space-2xs block text-label-md">{label}</label>
      <input type="file" name={name} multiple={multiple} accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg"
        className="w-full rounded-lg border border-dashed border-outline-variant bg-surface-container-low p-space-sm text-body-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary-container file:px-3 file:py-1.5 file:text-label-md file:text-on-primary" />
      {hint && <p className="mt-space-2xs text-body-sm text-on-surface-variant">{hint}</p>}
    </div>
  );
}
