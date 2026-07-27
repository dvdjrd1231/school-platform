"use client"

import { useEffect, useState } from "react"
import { Loader2, Trash2 } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { Button } from "@/components/ui/button"
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

interface EditableLesson {
  _id: string
  title: string
  description?: string
  type: "video" | "reading" | "interactive" | "quiz" | "assignment"
  duration?: string
  content?: string
  videoUrl?: string
  order?: number
}

interface CourseOption {
  _id: string
  title: string
}

interface CourseWithModules {
  _id: string
  modules: { _id: string; title: string }[]
}

interface Props {
  open: boolean
  courseId: string
  /** The module the lesson currently sits in, when editing. */
  moduleId?: string
  /** Omit to create a new lesson. */
  lesson?: EditableLesson
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

const EMPTY = {
  title: "",
  description: "",
  type: "reading" as EditableLesson["type"],
  duration: "",
  content: "",
  videoUrl: "",
  moduleId: "",
  moduleTitle: "",
  targetCourseId: "",
}

/**
 * Create, edit, move, or delete a lesson.
 *
 * Moving is the "reassign a lesson to a different class" case: pick another
 * course and the lesson is detached from this one and appended there, with any
 * completion marks for it cleared so nobody's progress is inflated.
 */
export function LessonEditorDialog({
  open,
  courseId,
  moduleId,
  lesson,
  onOpenChange,
  onSaved,
}: Props) {
  const isEdit = Boolean(lesson)
  const [form, setForm] = useState({ ...EMPTY })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [confirm, confirmDialog] = useConfirm()

  // Courses the user can move a lesson into, and this course's module list.
  const coursesReq = useApi<{ courses: CourseOption[] }>(open ? "/api/courses" : null)
  const targetCourseId = form.targetCourseId || courseId
  const targetReq = useApi<CourseWithModules>(open ? `/api/courses/${targetCourseId}` : null)
  const modules = targetReq.data?.modules ?? []

  useEffect(() => {
    if (!open) return
    setError("")
    setForm({
      ...EMPTY,
      title: lesson?.title ?? "",
      description: lesson?.description ?? "",
      type: lesson?.type ?? "reading",
      duration: lesson?.duration ?? "",
      content: lesson?.content ?? "",
      videoUrl: lesson?.videoUrl ?? "",
      moduleId: moduleId ?? "",
      targetCourseId: courseId,
    })
  }, [open, lesson, moduleId, courseId])

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const save = async () => {
    setError("")
    if (form.title.trim().length < 2) return setError("Give the lesson a title")
    if (form.videoUrl && !/^https?:\/\//i.test(form.videoUrl)) {
      return setError("The video link must start with http:// or https://")
    }

    setSaving(true)
    try {
      if (isEdit && lesson) {
        const movingCourse = form.targetCourseId && form.targetCourseId !== courseId
        await apiMutate(`/api/lessons/${lesson._id}`, "PATCH", {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          type: form.type,
          duration: form.duration.trim() || undefined,
          content: form.content,
          videoUrl: form.videoUrl.trim(),
          ...(movingCourse ? { moveToCourseId: form.targetCourseId } : {}),
          ...(form.moduleId && form.moduleId !== moduleId ? { moveToModuleId: form.moduleId } : {}),
          ...(form.moduleTitle.trim() ? { moveToModuleTitle: form.moduleTitle.trim() } : {}),
        })
      } else {
        await apiMutate("/api/lessons", "POST", {
          courseId: form.targetCourseId || courseId,
          moduleId: form.moduleId || undefined,
          moduleTitle: form.moduleTitle.trim() || undefined,
          title: form.title.trim(),
          type: form.type,
          duration: form.duration.trim() || undefined,
          content: form.content || undefined,
          videoUrl: form.videoUrl.trim() || undefined,
        })
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the lesson")
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!lesson) return
    const ok = await confirm({
      title: "Delete this lesson?",
      description: `"${lesson.title}" will be removed from the course, and any student completion of it will be cleared. This cannot be undone.`,
    })
    if (!ok) return

    setSaving(true)
    try {
      await apiMutate(`/api/lessons/${lesson._id}`, "DELETE")
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the lesson")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit lesson" : "Add a lesson"}</DialogTitle>
            <DialogDescription>
              Lessons appear to students in module order, then in the order they were added.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Short description</Label>
              <Input
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="One line shown in the lesson list"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => set("type", v as EditableLesson["type"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="interactive">Interactive</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  value={form.duration}
                  onChange={(e) => set("duration", e.target.value)}
                  placeholder="e.g. 20 min"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Video link</Label>
              <Input
                value={form.videoUrl}
                onChange={(e) => set("videoUrl", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=… or a direct .mp4 link"
              />
              <p className="text-xs text-muted-foreground">
                YouTube and Vimeo links play embedded; a direct video file plays in the browser.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Lesson content</Label>
              <Textarea
                rows={8}
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                placeholder="The text of the lesson. Blank lines start a new paragraph."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isEdit ? "Move to class" : "Class"}</Label>
                <Select
                  value={form.targetCourseId || courseId}
                  onValueChange={(v) => setForm((f) => ({ ...f, targetCourseId: v, moduleId: "" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(coursesReq.data?.courses ?? []).map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Module</Label>
                <Select
                  value={form.moduleId || "new"}
                  onValueChange={(v) => set("moduleId", v === "new" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a module" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((m) => (
                      <SelectItem key={m._id} value={m._id}>
                        {m.title}
                      </SelectItem>
                    ))}
                    <SelectItem value="new">New module…</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!form.moduleId && (
              <div className="space-y-2">
                <Label>New module name</Label>
                <Input
                  value={form.moduleTitle}
                  onChange={(e) => set("moduleTitle", e.target.value)}
                  placeholder="e.g. Unit 1 — Fractions"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter className="justify-between sm:justify-between">
            <div>
              {isEdit && (
                <Button variant="ghost" className="text-red-600" onClick={() => void remove()} disabled={saving}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={() => void save()} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : isEdit ? (
                  "Save changes"
                ) : (
                  "Add lesson"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </>
  )
}
