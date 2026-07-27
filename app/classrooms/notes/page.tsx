"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Pin, Plus, Search, StickyNote, Trash2 } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface NoteItem {
  _id: string
  title: string
  content: string
  tags: string[]
  pinned: boolean
  updatedAt: string
  course?: { _id: string; title: string } | null
}

/** Your own study notes. Private to you — nobody else can read them. */
export default function NotesPage() {
  const router = useRouter()
  const { data, error, isLoading, refetch } = useApi<{ notes: NoteItem[] }>("/api/notes")
  const [search, setSearch] = useState("")
  const [confirm, confirmDialog] = useConfirm()

  const notes = useMemo(() => {
    const all = data?.notes ?? []
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter(
      (note) =>
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q) ||
        note.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }, [data, search])

  const togglePin = async (note: NoteItem) => {
    await apiMutate(`/api/notes/${note._id}`, "PATCH", { pinned: !note.pinned })
    await refetch()
  }

  const remove = async (note: NoteItem) => {
    const ok = await confirm({
      title: "Delete this note?",
      description: `"${note.title}" will be permanently removed. This cannot be undone.`,
    })
    if (!ok) return
    await apiMutate(`/api/notes/${note._id}`, "DELETE")
    await refetch()
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">My notes</h1>
          <p className="text-muted-foreground">Private to you — nobody else can see these.</p>
        </div>
        <Button onClick={() => router.push("/classrooms/notes/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New note
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search your notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={notes.length === 0}
        emptyMessage={search ? "Nothing matches that search." : "No notes yet — write your first."}
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card key={note._id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle
                    className="cursor-pointer text-base hover:text-emerald-600"
                    onClick={() => router.push(`/classrooms/notes/${note._id}`)}
                  >
                    {note.title}
                  </CardTitle>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={note.pinned ? "text-emerald-600" : ""}
                      onClick={() => void togglePin(note)}
                    >
                      <Pin className="h-4 w-4" />
                      <span className="sr-only">{note.pinned ? "Unpin" : "Pin"}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                      onClick={() => void remove(note)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
                {note.course && (
                  <p className="text-xs text-muted-foreground">{note.course.title}</p>
                )}
              </CardHeader>
              <CardContent
                className="flex flex-1 cursor-pointer flex-col justify-between gap-3"
                onClick={() => router.push(`/classrooms/notes/${note._id}`)}
              >
                <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
                  {note.content || "Empty note"}
                </p>
                <div className="flex flex-wrap items-center gap-1">
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <StickyNote className="h-3 w-3" />
                    {new Date(note.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncState>

      {confirmDialog}
    </div>
  )
}
