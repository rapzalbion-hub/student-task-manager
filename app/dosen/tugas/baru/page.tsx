import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { createTask } from "@/app/dosen/actions";
import { PageHeader } from "@/components/ui";
import TaskForm from "@/components/TaskForm";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const me = await requireRole("dosen");
  const { error } = await searchParams;
  const courses = await query("SELECT id,name,semester FROM courses WHERE lecturer_id=? AND status='active' ORDER BY name,semester", [me.uid]);
  return (
    <>
      <PageHeader title="Buat Tugas Baru" sub="Kode Tugas dibuat otomatis setelah tugas disimpan." />
      <TaskForm action={createTask} courses={courses} error={error} cancel="/dosen/tugas" />
    </>
  );
}
