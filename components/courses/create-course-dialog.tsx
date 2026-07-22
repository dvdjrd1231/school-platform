"use client"

import { useState } from "react"
import { Loader2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiMutate } from "@/lib/api/client"

const EMPTY = {
  code: "",
  title: "",
  subject: "",
  description: "",
  schedule: "",
  room: "",
  maxStudents: "30",
  status: "draft" as "draft" | "active" | "upcoming",
}

/**
 * Create a course. The API assigns the signed-in teacher as the instructor
 * automatically — a teacher can only ever create courses they own.
 */
export function CreateCourseDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async () => {
    setError("")

    if (form.code.trim().length < 2) return setError("Course code must be at least 2 characters")
    if (form.title.trim().length < 2) return setError("Title must be at least 2 characters")
    if (!form.subject.trim()) return setError("Subject is required")

    const maxStudents = Number(form.maxStudents)
    if (!Number.isInteger(maxStudents) || maxStudents < 1) {
      return setError("Max students must be a whole number of at least 1")
    }

    setIsSaving(true)
    try {
      await apiMutate("/api/courses", "POST", {
        code: form.code.trim(),
        title: form.title.trim(),
        subject: form.subject.trim(),
        description: form.description.trim() || undefined,
        schedule: form.schedule.trim() || undefined,
        room: form.room.trim() || undefined,
        maxStudents,
        status: form.status,
      })
      setForm(EMPTY)
      setOpen(false)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the course")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Course
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a course</DialogTitle>
          <DialogDescription>
            You will be set as the instructor. You can add modules and lessons after creating it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Course code</Label>
              <Input
                id="code"
                placeholder="MATH-101"
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Mathematics"
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Advanced Mathematics"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What this course covers…"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Input
                id="schedule"
                placeholder="MWF 10:00-11:00"
                value={form.schedule}
                onChange={(e) => set("schedule", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room">Room</Label>
              <Input
                id="room"
                placeholder="A101"
                value={form.room}
                onChange={(e) => set("room", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxStudents">Max students</Label>
              <Input
                id="maxStudents"
                type="number"
                min={1}
                value={form.maxStudents}
                onChange={(e) => set("maxStudents", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as typeof form.status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Draft keeps it hidden from students until it's ready. */}
                  <SelectItem value="draft">Draft (hidden)</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating…
              </>
            ) : (
              "Create course"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
