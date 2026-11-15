import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";
import { Field, SelectField, Notice } from "@/components/ui";
import { TextArea, FileInput, DeadlineField } from "@/components/form";

export default function TaskForm({ action, courses = [], task, error, cancel }: { action: (fd: FormData) => void | Promise<void>; courses?: { id: number; name: string; semester: number }[]; task?: any; error?: string; cancel: string }) {
  return (
    <form action={action} className="card max-w-3xl space-y-space-md">
      <Notice error={error} />
      {task
        ? <Field label="Mata Kuliah" name="course" defaultValue={`${task.course} (Semester ${task.semester})`} readOnly hint="Mata kuliah, semester, dan Kode Tugas tidak dapat diubah." />
        : courses.length === 0
          ? <Notice error="Anda belum memiliki mata kuliah aktif. Hubungi Admin." />
          : <SelectField label="Mata Kuliah & Semester" name="course_id" options={courses.map((c) => [c.id, `${c.name} (Semester ${c.semester})`])} />}
      <Field label="Judul Tugas" name="title" defaultValue={task?.title} placeholder="mis. Membuat Website Portfolio Responsif" />
      <div className="grid gap-space-md sm:grid-cols-2">
        <SelectField label="Jenis Penilaian" name="assessment_type" defaultValue={task?.assessment_type} options={[["project", "Project"], ["quiz", "Quiz"], ["laporan", "Laporan"], ["presentasi", "Presentasi"], ["lainnya", "Lainnya"]]} />
        <SelectField label="Jenis Tugas" name="task_type" defaultValue={task?.task_type} options={[["individu", "Individu"], ["kelompok", "Kelompok"]]} />
      </div>
      <DeadlineField value={task?.dl} />
      <TextArea label="Deskripsi & Instruksi Pengerjaan" name="description" defaultValue={task?.description} />
      {task && <><SelectField label="Status Tugas" name="status" defaultValue={task.status} options={[["active", "Aktif"], ["closed", "Ditutup"]]} /><p className="-mt-space-sm text-body-sm text-on-surface-variant">Tugas otomatis ditutup setelah deadline lewat. Untuk membukanya kembali, ubah deadline ke waktu mendatang lalu pilih status Aktif.</p></>}
      <FileInput label="Lampiran / Materi (Opsional)" name="attachments" hint="PDF, DOC, DOCX, ZIP, PNG, JPG. Maks. 10 MB per file, boleh beberapa file." />
      <div className="flex justify-end gap-space-sm"><Link href={cancel} className="btn-secondary">Batal</Link><SubmitButton className="btn-primary">Simpan Tugas</SubmitButton></div>
    </form>
  );
}
