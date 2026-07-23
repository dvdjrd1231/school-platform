"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, MoreHorizontal, Archive, Loader2, Users, GraduationCap, BookOpen, Eye, Pencil } from "lucide-react"

import { useRole } from "@/components/context/role-context"
import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { StatTile } from "@/components/admin/stat-tile"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Course {
  _id: string
  code: string
  title: string
  subject: string
  status: string
  description?: string
  schedule?: string
  room?: string
  maxStudents?: number
  enrolledCount?: number
  instructor?: { _id: string; name?: string } | null
}

interface Teacher {
  _id: string
  name: string
}

const EMPTY = {
  code: "",
  title: "",
  subject: "",
  instructor: "",
  schedule: "",
  room: "",
  maxStudents: "30",
  description: "",
  status: "active" as "draft" | "active" | "upcoming",
}

export default function ClassManagement() {
  const { isAdmin, isLoading: rolesLoading } = useRole()
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [open, setOpen] = useState(false)
  // null → the dialog is creating; an id → it is editing that course.
  const [editingId, setEditingId] = useState<string | null>(null)
  // The course shown in the read-only view modal, or null when closed.
  const [viewing, setViewing] = useState<Course | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)

  const coursesReq = useApi<{ courses: Course[] }>(isAdmin ? "/api/courses?all=true" : null)
  const teachersReq = useApi<{ users: Teacher[] }>(isAdmin ? "/api/users?role=teacher&limit=100" : null)

  const courses = useMemo(() => coursesReq.data?.courses ?? [], [coursesReq.data])
  const teachers = teachersReq.data?.users ?? []

  const subjects = useMemo(() => Array.from(new Set(courses.map((c) => c.subject))).sort(), [courses])
  const stats = useMemo(
    () => ({
      total: courses.length,
      active: courses.filter((c) => c.status === "active").length,
      enrolled: courses.reduce((sum, c) => sum + (c.enrolledCount ?? 0), 0),
    }),
    [courses],
  )

  const filtered = courses.filter((c) => {
    const term = search.toLowerCase()
    const matchSearch =
      c.title.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      (c.instructor?.name ?? "").toLowerCase().includes(term)
    const matchSubject = subjectFilter === "all" || c.subject === subjectFilter
    return matchSearch && matchSubject
  })

  if (!rolesLoading && !isAdmin) {
    return (
      <div className="container mx-auto p-6 text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">Only administrators can manage classes.</p>
        <Button onClick={() => router.push("/")}>Back to Home</Button>
      </div>
    )
  }

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY)
    setFormError("")
    setOpen(true)
  }

  const openEdit = (c: Course) => {
    setEditingId(c._id)
    setForm({
      code: c.code,
      title: c.title,
      subject: c.subject,
      instructor: c.instructor?._id ?? "",
      schedule: c.schedule ?? "",
      room: c.room ?? "",
      maxStudents: String(c.maxStudents ?? 30),
      description: "",
      status: (["draft", "active", "upcoming"].includes(c.status) ? c.status : "active") as
        | "draft"
        | "active"
        | "upcoming",
    })
    setFormError("")
    setOpen(true)
  }

  const save = async () => {
    setFormError("")
    if (!editingId && form.code.trim().length < 2) return setFormError("Course code is required")
    if (form.title.trim().length < 2) return setFormError("Title is required")
    if (!form.subject.trim()) return setFormError("Subject is required")

    setSaving(true)
    try {
      if (editingId) {
        // PATCH ignores code and instructor by design, so only send what it
        // accepts — otherwise the request looks like it changed more than it did.
        await apiMutate(`/api/courses/${editingId}`, "PATCH", {
          title: form.title.trim(),
          subject: form.subject.trim(),
          schedule: form.schedule.trim() || undefined,
          room: form.room.trim() || undefined,
          maxStudents: Number(form.maxStudents) || 30,
          description: form.description.trim() || undefined,
          status: form.status,
        })
      } else {
        await apiMutate("/api/courses", "POST", {
          code: form.code.trim().toUpperCase(),
          title: form.title.trim(),
          subject: form.subject.trim(),
          instructor: form.instructor || undefined,
          schedule: form.schedule.trim() || undefined,
          room: form.room.trim() || undefined,
          maxStudents: Number(form.maxStudents) || 30,
          description: form.description.trim() || undefined,
          status: form.status,
        })
      }
      setOpen(false)
      setForm(EMPTY)
      setEditingId(null)
      await coursesReq.refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save the class")
    } finally {
      setSaving(false)
    }
  }

  const archive = async (id: string) => {
    await apiMutate(`/api/courses/${id}`, "DELETE").catch(() => {})
    await coursesReq.refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Management</h1>
          <p className="text-gray-600">Create and manage courses across the school</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o)
            if (!o) setEditingId(null)
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit class" : "Create a class"}</DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update the class details. The course code and instructor can't be changed here."
                  : "Assign a teacher and set the schedule."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Course code</Label>
                <Input
                  placeholder="MATH-101"
                  value={form.code}
                  onChange={(e) => set("code", e.target.value)}
                  disabled={!!editingId}
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input placeholder="Mathematics" value={form.subject} onChange={(e) => set("subject", e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Title</Label>
                <Input placeholder="Advanced Mathematics" value={form.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Instructor</Label>
                <Select value={form.instructor} onValueChange={(v) => set("instructor", v)} disabled={!!editingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t._id} value={t._id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Input placeholder="MWF 10:00-11:00" value={form.schedule} onChange={(e) => set("schedule", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Room</Label>
                <Input placeholder="A101" value={form.room} onChange={(e) => set("room", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" min={1} value={form.maxStudents} onChange={(e) => set("maxStudents", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v as typeof form.status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Description</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>
            </div>
            {formError && (
              <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{formError}</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {editingId ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile label="Total Classes" value={stats.total} icon={BookOpen} color="text-emerald-600" bg="bg-emerald-50" />
        <StatTile label="Active" value={stats.active} icon={GraduationCap} color="text-blue-600" bg="bg-blue-50" />
        <StatTile label="Students Enrolled" value={stats.enrolled} icon={Users} color="text-purple-600" bg="bg-purple-50" />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search classes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classes ({filtered.length})</CardTitle>
          <CardDescription>All courses on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <AsyncState
            isLoading={coursesReq.isLoading}
            error={coursesReq.error}
            isEmpty={filtered.length === 0}
            emptyMessage="No classes yet. Create one to get started."
            onRetry={coursesReq.refetch}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead className="text-right">Enrolled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>
                      <div className="font-medium">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{c.code}</div>
                    </TableCell>
                    <TableCell>{c.subject}</TableCell>
                    <TableCell>{c.instructor?.name ?? "Unassigned"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.schedule ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className="flex items-center justify-end gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {c.enrolledCount ?? 0}
                        {c.maxStudents ? `/${c.maxStudents}` : ""}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          c.status === "active"
                            ? "bg-green-100 text-green-800"
                            : c.status === "archived"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-blue-100 text-blue-800"
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewing(c)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {c.status !== "archived" && (
                            <DropdownMenuItem className="text-red-600" onClick={() => void archive(c._id)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AsyncState>
        </CardContent>
      </Card>

      {/* Read-only detail view. Editing is a separate action (the Edit menu item). */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.title}</DialogTitle>
            <DialogDescription>{viewing?.code}</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    viewing.status === "active"
                      ? "bg-green-100 text-green-800"
                      : viewing.status === "archived"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-blue-100 text-blue-800"
                  }
                >
                  {viewing.status}
                </Badge>
                <span className="text-sm text-muted-foreground">{viewing.subject}</span>
              </div>

              {viewing.description && (
                <p className="text-sm text-muted-foreground">{viewing.description}</p>
              )}

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Instructor</dt>
                  <dd className="font-medium">{viewing.instructor?.name ?? "Unassigned"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Enrolled</dt>
                  <dd className="font-medium tabular-nums">
                    {viewing.enrolledCount ?? 0}
                    {viewing.maxStudents ? ` / ${viewing.maxStudents}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Schedule</dt>
                  <dd className="font-medium">{viewing.schedule ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Room</dt>
                  <dd className="font-medium">{viewing.room ?? "—"}</dd>
                </div>
              </dl>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
            {viewing && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    const c = viewing
                    setViewing(null)
                    openEdit(c)
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button onClick={() => router.push(`/courses/${viewing._id}`)}>Open full page</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
