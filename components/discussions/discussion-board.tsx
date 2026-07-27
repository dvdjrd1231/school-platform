"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, Loader2, Lock, MessageSquare, Pencil, Pin, Plus, Search, Trash2 } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useCourses } from "@/components/context/course-context"
import { useRole } from "@/components/context/role-context"
import { AsyncState } from "@/components/ui/async-state"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Person {
  _id: string
  name?: string
}

interface Reply {
  _id: string
  body: string
  createdAt: string
  editedAt?: string
  author?: Person | null
}

export interface DiscussionThread {
  _id: string
  title: string
  content: string
  category: string
  pinned: boolean
  locked: boolean
  views: number
  createdAt: string
  updatedAt: string
  author?: Person | null
  course?: { _id: string; title: string } | null
  replies: Reply[]
}

const EMPTY = { title: "", content: "", category: "General", course: "", pinned: false }

/** Human-friendly relative time, used across the discussion screens. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" })
}

/**
 * The discussion board: start a thread, reply, edit and delete — all live.
 *
 * `courseId` pins it to one class (the classroom tab). Without it the board
 * shows every thread the person can reach, school-wide ones included.
 */
export function DiscussionBoard({ courseId }: { courseId?: string } = {}) {
  const router = useRouter()
  const { userId, isTeacher, isAdmin } = useRole()
  const { courses } = useCourses()
  const canModerate = isTeacher || isAdmin

  const url = courseId ? `/api/discussions?courseId=${courseId}` : "/api/discussions"
  const { data, error, isLoading, refetch } = useApi<{ discussions: DiscussionThread[] }>(url)

  const [search, setSearch] = useState("")
  const [composerOpen, setComposerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const [confirm, confirmDialog] = useConfirm()

  const threads = useMemo(() => {
    const all = data?.discussions ?? []
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q) ||
        (d.author?.name ?? "").toLowerCase().includes(q),
    )
  }, [data, search])

  const openCompose = () => {
    setEditingId(null)
    setForm({ ...EMPTY, course: courseId ?? "" })
    setFormError("")
    setComposerOpen(true)
  }

  const openEdit = (thread: DiscussionThread) => {
    setEditingId(thread._id)
    setForm({
      title: thread.title,
      content: thread.content,
      category: thread.category,
      course: thread.course?._id ?? "",
      pinned: thread.pinned,
    })
    setFormError("")
    setComposerOpen(true)
  }

  const save = async () => {
    setFormError("")
    if (form.title.trim().length < 3) return setFormError("Give the discussion a title")
    if (!form.content.trim()) return setFormError("Write the first post")

    setSaving(true)
    try {
      if (editingId) {
        await apiMutate(`/api/discussions/${editingId}`, "PATCH", {
          title: form.title.trim(),
          content: form.content.trim(),
          category: form.category,
          ...(canModerate ? { pinned: form.pinned } : {}),
        })
      } else {
        await apiMutate("/api/discussions", "POST", {
          title: form.title.trim(),
          content: form.content.trim(),
          category: form.category,
          course: form.course || undefined,
          pinned: canModerate ? form.pinned : false,
        })
      }
      setComposerOpen(false)
      setEditingId(null)
      await refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save the discussion")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (thread: DiscussionThread) => {
    const ok = await confirm({
      title: "Delete this discussion?",
      description: `"${thread.title}" and its ${thread.replies.length} repl${
        thread.replies.length === 1 ? "y" : "ies"
      } will be removed. This cannot be undone.`,
    })
    if (!ok) return
    await apiMutate(`/api/discussions/${thread._id}`, "DELETE")
    await refetch()
  }

  const toggleLock = async (thread: DiscussionThread) => {
    await apiMutate(`/api/discussions/${thread._id}`, "PATCH", { locked: !thread.locked })
    await refetch()
  }

  const canEditThread = (thread: DiscussionThread) => thread.author?._id === userId || canModerate

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">Discussions</h1>
          <p className="text-muted-foreground">Ask questions and talk through the work together</p>
        </div>
        <Button onClick={openCompose}>
          <Plus className="mr-2 h-4 w-4" />
          New discussion
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search discussions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={threads.length === 0}
        emptyMessage={
          search ? "No discussions match that search." : "No discussions yet — start the first one."
        }
        onRetry={refetch}
      >
        <div className="space-y-4">
          {threads.map((thread) => (
            <Card key={thread._id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {thread.pinned && <Pin className="h-4 w-4 text-emerald-600" />}
                      {thread.locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                      <CardTitle
                        className="cursor-pointer text-lg hover:text-emerald-600"
                        onClick={() => router.push(`/discussions/${thread._id}`)}
                      >
                        {thread.title}
                      </CardTitle>
                      <Badge variant="outline">{thread.category}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {thread.author?.name ?? "Unknown"} · {timeAgo(thread.createdAt)}
                      {thread.course ? ` · ${thread.course.title}` : " · School-wide"}
                    </p>
                  </div>

                  {canEditThread(thread) && (
                    <div className="flex shrink-0 items-center gap-1">
                      {canModerate && (
                        <Button variant="ghost" size="sm" onClick={() => void toggleLock(thread)}>
                          {thread.locked ? "Unlock" : "Lock"}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEdit(thread)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => void remove(thread)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <p className="mb-3 line-clamp-2 whitespace-pre-wrap text-muted-foreground">
                  {thread.content}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-emerald-600"
                    onClick={() => router.push(`/discussions/${thread._id}`)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {thread.replies.length} {thread.replies.length === 1 ? "reply" : "replies"}
                  </button>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {thread.views}
                  </span>
                  <span className="ml-auto">Last activity {timeAgo(thread.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncState>

      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit discussion" : "Start a discussion"}</DialogTitle>
            <DialogDescription>
              {courseId
                ? "This thread stays inside this class."
                : "Pick a class to keep it private to that class, or post school-wide."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="What do you want to discuss?"
              />
            </div>

            <div className="space-y-2">
              <Label>First post</Label>
              <Textarea
                rows={6}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="General"
                />
              </div>

              {!courseId && !editingId && (
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select
                    value={form.course || "school"}
                    onValueChange={(v) => setForm((f) => ({ ...f, course: v === "school" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="school">Whole school</SelectItem>
                      {courses.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setComposerOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : editingId ? (
                "Save changes"
              ) : (
                "Post discussion"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  )
}
