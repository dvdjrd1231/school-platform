"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Brain,
  CheckCircle,
  Clock,
  FileText,
  HelpCircle,
  Lock,
  MapPin,
  PenTool,
  Play,
  Plus,
  Users,
  Video,
} from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { AsyncState } from "@/components/ui/async-state"
import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { LessonEditorDialog } from "@/components/courses/lesson-editor-dialog"

export interface ApiLesson {
  _id: string
  title: string
  description?: string
  type: "video" | "reading" | "interactive" | "quiz" | "assignment"
  duration?: string
  order: number
  content?: string
  videoUrl?: string
  materials: { name: string; url: string; size?: number }[]
}

export interface ApiModule {
  _id: string
  title: string
  description?: string
  order: number
  lessons: ApiLesson[]
}

export interface ApiCourseDetail {
  _id: string
  code: string
  title: string
  description?: string
  subject: string
  schedule?: string
  room?: string
  status: string
  modules: ApiModule[]
  instructor?: { _id?: string; name?: string } | null
  viewer: {
    canEdit: boolean
    enrolled: boolean
    progress: number
    completedLessonIds: string[]
    lessonCount: number
  }
}

function lessonIcon(type: ApiLesson["type"]) {
  switch (type) {
    case "video":
      return <Video className="h-4 w-4" />
    case "interactive":
      return <Brain className="h-4 w-4" />
    case "quiz":
      return <HelpCircle className="h-4 w-4" />
    case "assignment":
      return <PenTool className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

/**
 * The course detail page: modules, lessons, and progress against real data.
 *
 * Students walk the lessons in order — each is locked until the ones before it
 * are complete. Teachers and admins see everything unlocked and can add, edit,
 * or remove lessons in place.
 */
export default function CourseModules({ courseId }: { courseId: string }) {
  const router = useRouter()
  const { data, error, isLoading, refetch } = useApi<ApiCourseDetail>(`/api/courses/${courseId}`)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ lesson?: ApiLesson; moduleId?: string } | null>(null)

  const modules = useMemo(
    () => [...(data?.modules ?? [])].sort((a, b) => a.order - b.order),
    [data],
  )

  // The flat, ordered walk-through used for the lock rule, mirroring the server.
  const flat = useMemo(
    () => modules.flatMap((m) => [...m.lessons].sort((a, b) => a.order - b.order)),
    [modules],
  )

  const completed = useMemo(
    () => new Set(data?.viewer.completedLessonIds ?? []),
    [data],
  )

  const canEdit = data?.viewer.canEdit ?? false

  const unlockedAt = (lessonId: string): boolean => {
    if (canEdit) return true
    const index = flat.findIndex((l) => l._id === lessonId)
    if (index <= 0) return true
    return flat.slice(0, index).every((l) => completed.has(l._id))
  }

  const openLesson = (lessonId: string) => {
    if (!unlockedAt(lessonId)) return
    router.push(`/courses/${courseId}/lessons/${lessonId}`)
  }

  const nextLessonId = flat.find((l) => !completed.has(l._id))?._id

  return (
    <div className="container mx-auto p-6">
      <AsyncState isLoading={isLoading} error={error} onRetry={refetch}>
        {data && (
          <>
            <div className="mb-6">
              <BackButton fallback="/courses" label="Back to Courses" className="mb-4" />

              <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="mb-2 text-3xl font-bold text-emerald-800">{data.title}</h1>
                    <p className="mb-4 text-emerald-700">
                      {data.description ?? `${data.subject} · ${data.code}`}
                    </p>

                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm">{data.instructor?.name ?? "Unassigned"}</span>
                      </div>
                      {data.schedule && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm">{data.schedule}</span>
                        </div>
                      )}
                      {data.room && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm">Room {data.room}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm">
                          {modules.length} module{modules.length === 1 ? "" : "s"} ·{" "}
                          {flat.length} lesson{flat.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>

                    {!canEdit && (
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm font-medium">Course progress</span>
                            <span className="text-sm text-emerald-600">
                              {completed.size} of {flat.length} lessons ({data.viewer.progress}%)
                            </span>
                          </div>
                          <Progress value={data.viewer.progress} className="h-2" />
                        </div>
                        <Badge variant={data.status === "active" ? "default" : "secondary"}>
                          {data.status}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {!canEdit && nextLessonId && (
                    <Button onClick={() => openLesson(nextLessonId)}>
                      <Play className="mr-2 h-4 w-4" />
                      {completed.size === 0 ? "Start course" : "Continue"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Course content</h2>
                {canEdit && (
                  <Button variant="outline" onClick={() => setEditing({})}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add lesson
                  </Button>
                )}
              </div>

              {modules.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    {canEdit
                      ? "No content yet. Add your first lesson to get started."
                      : "Your teacher hasn't added any lessons to this course yet."}
                  </CardContent>
                </Card>
              )}

              {modules.map((module) => {
                const lessons = [...module.lessons].sort((a, b) => a.order - b.order)
                const done = lessons.filter((l) => completed.has(l._id)).length
                const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0
                const isOpen = expanded === module._id

                return (
                  <Card key={module._id} className="overflow-hidden">
                    <CardHeader
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                      onClick={() => setExpanded(isOpen ? null : module._id)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {pct === 100 && lessons.length > 0 ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <BookOpen className="h-5 w-5 text-emerald-600" />
                          )}
                          <div>
                            <CardTitle className="text-lg">{module.title}</CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {module.description ??
                                `${lessons.length} lesson${lessons.length === 1 ? "" : "s"}`}
                            </p>
                          </div>
                        </div>
                        {!canEdit && (
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm font-medium">{pct}%</div>
                              <div className="text-xs text-muted-foreground">
                                {done}/{lessons.length}
                              </div>
                            </div>
                            <Progress value={pct} className="h-2 w-20" />
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    {isOpen && (
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {lessons.length === 0 && (
                            <p className="py-4 text-sm text-muted-foreground">
                              This module has no lessons yet.
                            </p>
                          )}
                          {lessons.map((lesson, i) => {
                            const isDone = completed.has(lesson._id)
                            const unlocked = unlockedAt(lesson._id)

                            return (
                              <div
                                key={lesson._id}
                                className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                                  unlocked
                                    ? "cursor-pointer hover:bg-emerald-50"
                                    : "cursor-not-allowed bg-gray-50"
                                }`}
                                onClick={() => openLesson(lesson._id)}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-6 text-xs text-muted-foreground">{i + 1}.</span>
                                  {isDone ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : unlocked ? (
                                    lessonIcon(lesson.type)
                                  ) : (
                                    <Lock className="h-4 w-4 text-gray-400" />
                                  )}
                                  <div>
                                    <div className="text-sm font-medium">{lesson.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {lesson.description ??
                                        (unlocked
                                          ? ""
                                          : "Complete the previous lesson to unlock this")}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {lesson.type}
                                  </Badge>
                                  {lesson.duration && (
                                    <span className="text-xs text-muted-foreground">
                                      {lesson.duration}
                                    </span>
                                  )}
                                  {canEdit && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setEditing({ lesson, moduleId: module._id })
                                      }}
                                    >
                                      Edit
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </AsyncState>

      {editing && (
        <LessonEditorDialog
          open
          courseId={courseId}
          moduleId={editing.moduleId}
          lesson={editing.lesson}
          onOpenChange={(isOpen: boolean) => !isOpen && setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void refetch()
          }}
        />
      )}
    </div>
  )
}
