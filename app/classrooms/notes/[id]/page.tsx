import { NoteEditor } from "@/components/notes/note-editor"

interface NotePageProps {
  params: Promise<{ id: string }>
}

export default async function NotePage({ params }: NotePageProps) {
  const { id } = await params
  return <NoteEditor noteId={id} />
}
