"use client"

import { useState } from "react"
import { Clock, Loader2, Megaphone, MessageSquare, Pencil, Pin, Plus, Trash2, User } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

interface Person {
  _id: string
  name?: string
  avatar?: string
}

interface Reply {
  _id: string
  body: string
  createdAt: string
  author?: Person | null
}

export interface Announcement {
  _id: string
  title: string
  content: string
  audience: "all" | "students" | "teachers" | "parents"
  priority: "high" | "medium" | "low"
  pinned: boolean
  createdAt: string
  author?: Person | null
  course?: { _id: string; title: string; code?: string } | null
  replies: Reply[]
}

interface CourseOption {
  _id: string
  title: string
}

interface Props {
  /**
   * Restrict the board to one course. When set, the composer posts to that
   * course and the course picker is hidden — this is the classroom tab.
   */
  courseId?: string
  title?: string
  description?: string
}

const EMPTY = {
  title: "",
  content: "",
  course: "",
  audience: "all" as Announcement["audience"],
  priority: "medium" as Announcement["priority"],
  pinned: false,
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

/**
 * The announcements board: read, post, reply, edit, delete.
 *
 * Shared by the standalone /announcements page and the classroom tab so both
 * behave identically; the only difference is whether a course is fixed.
 */
export function AnnouncementBoard({ courseId, title, description }: Props) {
  const { isTeacher, isAdmin, userId } = useRole()
  const canPost = isTeacher || isAdmin

  const listUrl = courseId ? `/api/announcements?courseId=${courseId}` : "/api/announcements"
  const { data, error, isLoading, refetch } = useApi<{ announcements: Announcement[] }>(listUrl)
  const announcements = data?.announcements ?? []

  // Only loaded for the composer, and only when a course isn't already fixed.
  const coursesReq = useApi<{ courses: CourseOption[] }>(canPost && !courseId ? "/api/courses" : null)

  const [composerOpen, setComposerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)

  // Reply drafts, keyed by announcement id, plus which one is being sent.
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  const [confirm, confirmDialog] = useConfirm()

  const openCompose = () => {
    setEditingId(null)
    setForm({ ...EMPTY, course: courseId ?? "" })
    setFormError("")
    setComposerOpen(true)
  }

  const openEdit = (a: Announcement) => {
    setEditingId(a._id)
    setForm({
      title: a.title,
      content: a.content,
      course: a.course?._id ?? "",
      audience: a.audience,
      priority: a.priority,
      pinned: a.pinned,
    })
    setFormError("")
    setComposerOpen(true)
  }

  const save = async () => {
    setFormError("")
    if (form.title.trim().length < 2) return setFormError("Give the announcement a title")
    if (!form.content.trim()) return setFormError("Write something to announce")

    setSaving(true)
    try {
      if (editingId) {
        // The course can't be moved after posting — recipients were already notified.
        await apiMutate(`/api/announcements/${editingId}`, "PATCH", {
          title: form.title.trim(),
          content: form.content.trim(),
          audience: form.audience,
          priority: form.priority,
          pinned: form.pinned,
        })
      } else {
        await apiMutate("/api/announcements", "POST", {
          title: form.title.trim(),
          content: form.content.trim(),
          course: form.course || undefined,
          audience: form.audience,
          priority: form.priority,
          pinned: form.pinned,
        })
      }
      setComposerOpen(false)
      setEditingId(null)
      await refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save the announcement")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (a: Announcement) => {
    const ok = await confirm({
      title: "Delete this announcement?",
      description: `"${a.title}" and its ${a.replies.length} repl${a.replies.length === 1 ? "y" : "ies"} will be removed. This cannot be undone.`,
    })
    if (!ok) return
    await apiMutate(`/api/announcements/${a._id}`, "DELETE")
    await refetch()
  }

  const sendReply = async (id: string) => {
    const body = (drafts[id] ?? "").trim()
    if (!body) return
    setReplyingTo(id)
    try {
      await apiMutate(`/api/announcements/${id}/replies`, "POST", { body })
      setDrafts((d) => ({ ...d, [id]: "" }))
      await refetch()
    } finally {
      setReplyingTo(null)
    }
  }

  const removeReply = async (announcementId: string, reply: Reply) => {
    const ok = await confirm({ title: "Delete this reply?" })
    if (!ok) return
    await apiMutate(`/api/announcements/${announcementId}/replies?replyId=${reply._id}`, "DELETE")
    await refetch()
  }

  const mine = (personId?: string | null) => Boolean(personId && personId === userId)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">{title ?? "Announcements"}</h1>
          <p className="text-muted-foreground">
            {description ?? "Important updates from your school and instructors"}
          </p>
        </div>
        {canPost && (
          <Button onClick={openCompose}>
            <Plus className="mr-2 h-4 w-4" />
            New announcement
          </Button>
        )}
      </div>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={announcements.length === 0}
        emptyMessage={
          canPost ? "No announcements yet — post the first one." : "No announcements yet."
        }
        onRetry={refetch}
      >
        <div className="space-y-4">
          {announcements.map((a) => (
            <Card key={a._id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {a.pinned ? (
                      <Pin className="mt-1 h-5 w-5 text-emerald-600" />
                    ) : (
                      <Megaphone className="mt-1 h-5 w-5 text-emerald-600" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{a.author?.name ?? "Unknown"}</span>
                        <Clock className="ml-2 h-4 w-4" />
                        <span>{formatDate(a.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {a.pinned && <Badge>Pinned</Badge>}
                    <Badge variant={a.priority === "high" ? "destructive" : "outline"}>
                      {a.priority}
                    </Badge>
                    {(mine(a.author?._id) || isAdmin) && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => void remove(a)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap text-muted-foreground">{a.content}</p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{a.course ? `Course: ${a.course.title}` : "School-wide"}</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {a.replies.length} {a.replies.length === 1 ? "reply" : "replies"}
                  </span>
                </div>

                {a.replies.length > 0 && (
                  <div className="space-y-3 border-l-2 border-muted pl-4">
                    {a.replies.map((r) => (
                      <div key={r._id} className="text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{r.author?.name ?? "Unknown"}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(r.createdAt)}
                          </span>
                          {(mine(r.author?._id) || mine(a.author?._id) || isAdmin) && (
                            <button
                              type="button"
                              className="text-xs text-red-600 hover:underline"
                              onClick={() => void removeReply(a._id, r)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap text-muted-foreground">{r.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Textarea
                    rows={2}
                    placeholder="Write a reply…"
                    value={drafts[a._id] ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [a._id]: e.target.value }))}
                  />
                  <Button
                    variant="outline"
                    disabled={replyingTo === a._id || !(drafts[a._id] ?? "").trim()}
                    onClick={() => void sendReply(a._id)}
                  >
                    {replyingTo === a._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Reply"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncState>

      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit announcement" : "New announcement"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Changes are visible immediately. Recipients aren't notified again."
                : "Everyone it reaches gets a notification."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Half-term closure"
              />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                rows={6}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="What do you want to tell them?"
              />
            </div>

            {!courseId && !editingId && (
              <div className="space-y-2">
                <Label>Post to</Label>
                <Select
                  value={form.course || "school"}
                  onValueChange={(v) => setForm((f) => ({ ...f, course: v === "school" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">Whole school</SelectItem>
                    {(coursesReq.data?.courses ?? []).map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select
                  value={form.audience}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, audience: v as Announcement["audience"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="students">Students</SelectItem>
                    <SelectItem value="parents">Parents</SelectItem>
                    <SelectItem value="teachers">Teachers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, priority: v as Announcement["priority"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Pin to the top</Label>
                <p className="text-xs text-muted-foreground">Pinned announcements sort first.</p>
              </div>
              <Switch
                checked={form.pinned}
                onCheckedChange={(v) => setForm((f) => ({ ...f, pinned: v }))}
              />
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
                "Post announcement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  )
}
