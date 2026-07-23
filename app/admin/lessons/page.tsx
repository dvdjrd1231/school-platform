"use client"

import { useMemo, useState } from "react"
import { Search, Plus, Loader2, Video, BookOpen, FileText, ClipboardCheck, Puzzle } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Lesson {
  lessonId: string
  title: string
  type: string
  duration: string | null
  courseId: string
  courseCode: string
  courseTitle: string
  moduleTitle: string
}

interface Course {
  _id: string
  code: string
  title: string
}

const TYPE_ICON: Record<string, typeof Video> = {
  video: Video,
  reading: BookOpen,
  interactive: Puzzle,
  quiz: ClipboardCheck,
  assignment: FileText,
}

const EMPTY = {
  courseId: "",
  moduleTitle: "",
  title: "",
  type: "reading" as "video" | "reading" | "interactive" | "quiz" | "assignment",
  duration: "",
  content: "",
}

export default function LessonManagement() {
  const [search, setSearch] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)

  const lessonsReq = useApi<{ lessons: Lesson[] }>("/api/lessons")
  const coursesReq = useApi<{ courses: Course[] }>("/api/courses")

  const lessons = useMemo(() => lessonsReq.data?.lessons ?? [], [lessonsReq.data])
  const courses = coursesReq.data?.courses ?? []

  const filtered = lessons.filter((l) => {
    const term = search.toLowerCase()
    const matchSearch =
      l.title.toLowerCase().includes(term) || l.courseCode.toLowerCase().includes(term)
    const matchClass = classFilter === "all" || l.courseId === classFilter
    return matchSearch && matchClass
  })

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const create = async () => {
    setFormError("")
    if (!form.courseId) return setFormError("Choose a course")
    if (form.title.trim().length < 2) return setFormError("Lesson title is required")

    setSaving(true)
    try {
      await apiMutate("/api/lessons", "POST", {
        courseId: form.courseId,
        moduleTitle: form.moduleTitle.trim() || undefined,
        title: form.title.trim(),
        type: form.type,
        duration: form.duration.trim() || undefined,
        content: form.content.trim() || undefined,
      })
      setOpen(false)
      setForm(EMPTY)
      await lessonsReq.refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create the lesson")
    } finally {
      setSaving(false)
    }
  }

  const stats = {
    total: lessons.length,
    video: lessons.filter((l) => l.type === "video").length,
    reading: lessons.filter((l) => l.type === "reading").length,
    interactive: lessons.filter((l) => l.type === "interactive").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lesson Management</h1>
          <p className="text-gray-600">Create and manage lesson content across courses</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create a lesson</DialogTitle>
              <DialogDescription>Add a lesson to a course module.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={form.courseId} onValueChange={(v) => set("courseId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.code} — {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Module</Label>
                  <Input
                    placeholder="e.g. Algebra Fundamentals"
                    value={form.moduleTitle}
                    onChange={(e) => set("moduleTitle", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => set("type", v as typeof form.type)}>
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
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Introduction to Algebra"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (optional)</Label>
                <Input placeholder="45 min" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Content (optional)</Label>
                <Textarea rows={3} value={form.content} onChange={(e) => set("content", e.target.value)} />
              </div>
              {formError && (
                <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{formError}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={create} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Lessons", value: stats.total },
          { label: "Video", value: stats.video },
          { label: "Reading", value: stats.reading },
          { label: "Interactive", value: stats.interactive },
        ].map((t) => (
          <Card key={t.label}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">{t.label}</p>
              <p className="text-2xl font-bold text-emerald-600">{t.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search lessons..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c._id} value={c._id}>
                {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lesson Library ({filtered.length})</CardTitle>
          <CardDescription>All lesson content across courses</CardDescription>
        </CardHeader>
        <CardContent>
          <AsyncState
            isLoading={lessonsReq.isLoading}
            error={lessonsReq.error}
            isEmpty={filtered.length === 0}
            emptyMessage="No lessons yet. Create one to get started."
            onRetry={lessonsReq.refetch}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lesson</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => {
                  const Icon = TYPE_ICON[l.type] ?? BookOpen
                  return (
                    <TableRow key={l.lessonId}>
                      <TableCell>
                        <span className="flex items-center gap-2 font-medium">
                          <Icon className="h-4 w-4 text-emerald-600" />
                          {l.title}
                        </span>
                      </TableCell>
                      <TableCell>{l.courseCode}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.moduleTitle}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {l.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.duration ?? "—"}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </AsyncState>
        </CardContent>
      </Card>
    </div>
  )
}
