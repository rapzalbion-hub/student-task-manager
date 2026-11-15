import { notFound } from "next/navigation";
import { query } from "@/lib/database";
import { requireRole } from "@/lib/guard";
import { updateTask } from "@/app/dosen/actions";
import { PageHeader } from "@/components/ui";
import TaskForm from "@/components/TaskForm";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const me = await requireRole("dosen");
  const id = Number((await params).id);
  const { error } = await searchParams;
  if (!Number.isInteger(id)) notFound();
  const [t] = await query("SELECT t.*,c.name course,c.semester,DATE_FORMAT(t.deadline,'%Y-%m-%dT%H:%i') dl FROM tasks t JOIN courses c ON c.id=t.course_id WHERE t.id=? AND t.lecturer_id=?", [id, me.uid]);
  if (!t) notFound();
  return (
    <>
      <PageHeader title="Edit Tugas" sub={`Kode Tugas: ${t.code}`} />
      <TaskForm action={updateTask.bind(null, id)} task={t} error={error} cancel={`/dosen/tugas/${id}`} />
    </>
  );
}
