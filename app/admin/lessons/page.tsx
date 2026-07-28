"use client"

import { useMemo, useState } from "react"
import { BookOpen, ClipboardCheck, FileText, Pencil, Plus, Search, Video } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { LESSON_TYPE_DEFINITIONS, lessonCardLabel, type LessonType } from "@/lib/lessons/types"
import { AsyncState } from "@/components/ui/async-state"
import { StatTile } from "@/components/admin/stat-tile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LessonTypeIcon } from "@/components/lessons/lesson-type-icon"
import { LessonEditorDialog } from "@/components/lessons/lesson-editor-dialog"

interface Lesson {
  lessonId: string
  title: string
  type: LessonType
  status: "draft" | "published"
  duration: string | null
  order: number
  courseId: string
  courseCode: string
  courseTitle: string
  moduleId: string
  moduleTitle: string
  points: number | null
  dueDate: string | null
  questionCount: number | null
}

interface Course {
  _id: string
  code: string
  title: string
}

/**
 * Admin › Lesson Management.
 *
 * Uses the same lesson editor as the course page rather than its own cut-down
 * form — a lesson created here is the same shape as one created anywhere else,
 * and gains nothing from a second, simpler form that can only make untyped
 * lessons.
 */
export default function LessonManagement() {
  const [search, setSearch] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [editing, setEditing] = useState<{ lesson?: Lesson } | null>(null)

  const lessonsReq = useApi<{ lessons: Lesson[] }>("/api/lessons")
  const coursesReq = useApi<{ courses: Course[] }>("/api/courses")

  const lessons = useMemo(() => lessonsReq.data?.lessons ?? [], [lessonsReq.data])
  const courses = coursesReq.data?.courses ?? []

  const filtered = lessons.filter((l) => {
    const term = search.toLowerCase()
    const matchSearch =
      l.title.toLowerCase().includes(term) || l.courseCode.toLowerCase().includes(term)
    const matchClass = classFilter === "all" || l.courseId === classFilter
    const matchType = typeFilter === "all" || l.type === typeFilter
    return matchSearch && matchClass && matchType
  })

  const stats = {
    total: lessons.length,
    published: lessons.filter((l) => l.status === "published").length,
    drafts: lessons.filter((l) => l.status === "draft").length,
    assessed: lessons.filter((l) => l.type === "quiz" || l.type === "assignment").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lesson Management</h1>
          <p className="text-gray-600">Create and manage lesson content across courses</p>
        </div>
        <Button onClick={() => setEditing({})}>
          <Plus className="mr-2 h-4 w-4" />
          Create Lesson
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile
          label="Total Lessons"
          value={stats.total}
          icon={BookOpen}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <StatTile
          label="Published"
          value={stats.published}
          icon={Video}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatTile
          label="Drafts"
          value={stats.drafts}
          icon={FileText}
          color="text-purple-600"
          bg="bg-purple-50"
        />
        <StatTile
          label="Quizzes & assignments"
          value={stats.assessed}
          icon={ClipboardCheck}
          color="text-orange-600"
          bg="bg-orange-50"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search lessons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
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
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.values(LESSON_TYPE_DEFINITIONS).map((definition) => (
              <SelectItem key={definition.type} value={definition.type}>
                {definition.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lesson Library ({filtered.length})</CardTitle>
          <CardDescription>
            All lesson content across courses. Lessons appear to students in module order, then in
            the order shown here.
          </CardDescription>
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
                  <TableHead>Order</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.lessonId}>
                    <TableCell>
                      <span className="flex items-center gap-2 font-medium">
                        <LessonTypeIcon type={l.type} className="text-emerald-600" />
                        {l.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {lessonCardLabel(l)}
                        {l.questionCount != null ? ` · ${l.questionCount} questions` : ""}
                      </span>
                    </TableCell>
                    <TableCell>{l.courseCode}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.moduleTitle}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.order + 1}</TableCell>
                    <TableCell>
                      <Badge className={LESSON_TYPE_DEFINITIONS[l.type].tone} variant="secondary">
                        {LESSON_TYPE_DEFINITIONS[l.type].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.status === "published" ? "default" : "outline"}>
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit lesson"
                        onClick={() => setEditing({ lesson: l })}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit {l.title}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AsyncState>
        </CardContent>
      </Card>

      {editing && (
        <LessonEditorDialog
          open
          // Editing keeps the lesson's own class; creating pre-fills whichever
          // class is being filtered on, when one is.
          courseId={editing.lesson?.courseId ?? (classFilter === "all" ? "" : classFilter)}
          moduleId={editing.lesson?.moduleId}
          lessonId={editing.lesson?.lessonId}
          onOpenChange={(isOpen: boolean) => !isOpen && setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void lessonsReq.refetch()
          }}
        />
      )}
    </div>
  )
}
