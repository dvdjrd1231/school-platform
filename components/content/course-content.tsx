"use client"

import { useRouter } from "next/navigation"
import { BookOpen, Brain, CheckCircle, FileText, HelpCircle, Lock, PenTool, Play, Video } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { useCourses } from "@/components/context/course-context"
import { AsyncState } from "@/components/ui/async-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ApiCourseDetail, ApiLesson } from "@/components/courses/course-modules"

function typeIcon(type: ApiLesson["type"]) {
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
 * The Content tab: every module and lesson of the selected course, live.
 *
 * The course picker here is the shared list the sidebar uses, so a course
 * created a minute ago appears immediately — the old dropdown was hard-coded
 * sample data, which is why a newly created course never showed up in it.
 */
export function CourseContent() {
  const router = useRouter()
  const { courses, selectedId, select, isLoading: coursesLoading, error: coursesError } = useCourses()
  const { data, error, isLoading, refetch } = useApi<ApiCourseDetail>(
    selectedId ? `/api/courses/${selectedId}` : null,
  )

  const modules = [...(data?.modules ?? [])].sort((a, b) => a.order - b.order)
  const flat = modules.flatMap((m) => [...m.lessons].sort((a, b) => a.order - b.order))
  const completed = new Set(data?.viewer.completedLessonIds ?? [])
  const canEdit = data?.viewer.canEdit ?? false

  const unlocked = (lessonId: string) => {
    if (canEdit) return true
    const index = flat.findIndex((l) => l._id === lessonId)
    return index <= 0 || flat.slice(0, index).every((l) => completed.has(l._id))
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">Course content</h1>
          <p className="text-muted-foreground">Work through the modules in order</p>
        </div>

        <div className="w-72">
          <Select value={selectedId ?? undefined} onValueChange={select}>
            <SelectTrigger>
              <SelectValue placeholder={coursesLoading ? "Loading…" : "Choose a course"} />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!coursesLoading && courses.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            {coursesError ?? "You have no courses yet."}
            <div className="mt-4">
              <Button variant="outline" onClick={() => router.push("/courses")}>
                Go to My Courses
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedId && (
        <AsyncState isLoading={isLoading} error={error} onRetry={refetch}>
          {data && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{data.title}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {data.description ?? `${data.subject} · ${data.code}`}
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => router.push(`/courses/${data._id}`)}>
                      Open course
                    </Button>
                  </div>
                </CardHeader>
                {!canEdit && (
                  <CardContent>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">Progress</span>
                      <span className="text-muted-foreground">
                        {completed.size} of {flat.length} lessons
                      </span>
                    </div>
                    <Progress value={data.viewer.progress} className="h-2" />
                  </CardContent>
                )}
              </Card>

              {modules.length === 0 && (
                <Card>
                  <CardContent className="py-16 text-center text-muted-foreground">
                    {canEdit
                      ? "No modules yet — add a lesson from the course page and a module is created for it."
                      : "Your teacher hasn't published any content for this course yet."}
                  </CardContent>
                </Card>
              )}

              {modules.map((module) => {
                const lessons = [...module.lessons].sort((a, b) => a.order - b.order)
                const done = lessons.filter((l) => completed.has(l._id)).length
                const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0

                return (
                  <Card key={module._id}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {pct === 100 && lessons.length > 0 ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <BookOpen className="h-5 w-5 text-emerald-600" />
                          )}
                          <div>
                            <CardTitle className="text-lg">{module.title}</CardTitle>
                            {module.description && (
                              <p className="text-sm text-muted-foreground">{module.description}</p>
                            )}
                          </div>
                        </div>
                        {!canEdit && (
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                              {done}/{lessons.length}
                            </span>
                            <Progress value={pct} className="h-2 w-24" />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {lessons.length === 0 && (
                        <p className="text-sm text-muted-foreground">No lessons in this module.</p>
                      )}
                      {lessons.map((lesson, i) => {
                        const open = unlocked(lesson._id)
                        const isDone = completed.has(lesson._id)

                        return (
                          <div
                            key={lesson._id}
                            className={`flex items-center justify-between rounded-lg border p-3 ${
                              open ? "cursor-pointer hover:bg-emerald-50" : "cursor-not-allowed bg-muted/40"
                            }`}
                            onClick={() =>
                              open && router.push(`/courses/${data._id}/lessons/${lesson._id}`)
                            }
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 text-xs text-muted-foreground">{i + 1}.</span>
                              {isDone ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : open ? (
                                typeIcon(lesson.type)
                              ) : (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div>
                                <div className="text-sm font-medium">{lesson.title}</div>
                                {lesson.description && (
                                  <div className="text-xs text-muted-foreground">
                                    {lesson.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {lesson.type}
                              </Badge>
                              {lesson.duration && (
                                <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                              )}
                              {open && <Play className="h-4 w-4 text-emerald-600" />}
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                )
              })}
            </>
          )}
        </AsyncState>
      )}
    </div>
  )
}
