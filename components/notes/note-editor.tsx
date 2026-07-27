"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useCourses } from "@/components/context/course-context"
import { AsyncState } from "@/components/ui/async-state"
import { BackButton } from "@/components/ui/back-button"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

interface NoteResponse {
  _id: string
  title: string
  content: string
  tags: string[]
  pinned: boolean
  course?: { _id: string } | string | null
}

/** Write or edit one note. Used by both /notes/new and /notes/[id]. */
export function NoteEditor({ noteId }: { noteId?: string }) {
  const router = useRouter()
  const { courses, selectedId } = useCourses()
  const existing = useApi<NoteResponse>(noteId ? `/api/notes/${noteId}` : null)

  const [form, setForm] = useState({
    title: "",
    content: "",
    course: "",
    tags: "",
    pinned: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [confirm, confirmDialog] = useConfirm()

  useEffect(() => {
    if (noteId) return
    setForm((f) => ({ ...f, course: selectedId ?? "" }))
  }, [noteId, selectedId])

  useEffect(() => {
    const note = existing.data
    if (!note) return
    setForm({
      title: note.title,
      content: note.content,
      course: typeof note.course === "string" ? note.course : (note.course?._id ?? ""),
      tags: note.tags.join(", "),
      pinned: note.pinned,
    })
  }, [existing.data])

  const save = async () => {
    setError("")
    if (!form.title.trim()) return setError("Give the note a title")

    setSaving(true)
    const payload = {
      title: form.title.trim(),
      content: form.content,
      course: form.course || null,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      pinned: form.pinned,
    }

    try {
      if (noteId) {
        await apiMutate(`/api/notes/${noteId}`, "PATCH", payload)
      } else {
        await apiMutate("/api/notes", "POST", { ...payload, course: form.course || undefined })
      }
      router.push("/classrooms/notes")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the note")
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!noteId) return
    const ok = await confirm({
      title: "Delete this note?",
      description: "It will be permanently removed. This cannot be undone.",
    })
    if (!ok) return
    await apiMutate(`/api/notes/${noteId}`, "DELETE")
    router.push("/classrooms/notes")
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6">
      <BackButton fallback="/classrooms/notes" label="Back to notes" />

      <AsyncState isLoading={existing.isLoading} error={existing.error} onRetry={existing.refetch}>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Chapter 3 — key formulas"
              />
            </div>

            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                rows={16}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Class (optional)</Label>
                <Select
                  value={form.course || "none"}
                  onValueChange={(v) => setForm((f) => ({ ...f, course: v === "none" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not class-specific</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="Comma separated"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Pin to the top</Label>
              <Switch
                checked={form.pinned}
                onCheckedChange={(v) => setForm((f) => ({ ...f, pinned: v }))}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center justify-between">
              <div>
                {noteId && (
                  <Button variant="ghost" className="text-red-600" onClick={() => void remove()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.back()} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={() => void save()} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save note
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </AsyncState>

      {confirmDialog}
    </div>
  )
}
