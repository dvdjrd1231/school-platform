"use client"

import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Lock,
  PlayCircle,
  Video,
} from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { AsyncState } from "@/components/ui/async-state"
import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ModuleLesson {
  _id: string
  title: string
  description?: string
  type: "video" | "reading" | "interactive" | "quiz" | "assignment"
  duration?: string
  videoUrl?: string
  completed: boolean
  unlocked: boolean
}

interface ModuleResponse {
  module: { _id: string; title: string; description?: string }
  course: { _id: string; title: string; code: string }
  lessons: ModuleLesson[]
  previous: { _id: string; title: string } | null
  next: { _id: string; title: string } | null
  canEdit: boolean
}

/** One module of a course, with its lessons and the caller's progress through them. */
export function ModuleContent({ moduleId }: { moduleId: string }) {
  const router = useRouter()
  const { data, error, isLoading, refetch } = useApi<ModuleResponse>(`/api/modules/${moduleId}`)

  const lessons = data?.lessons ?? []
  const done = lessons.filter((l) => l.completed).length
  const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0
  const videos = lessons.filter((l) => l.type === "video" || l.videoUrl).length

  return (
    <div className="flex-1 space-y-6 p-6">
      <AsyncState isLoading={isLoading} error={error} onRetry={refetch}>
        {data && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <BackButton fallback="/content" label="Back to Content" />
                <div>
                  <h1 className="text-2xl font-bold text-balance">{data.module.title}</h1>
                  <p className="text-muted-foreground">
                    {data.module.description ?? data.course.title}
                  </p>
                </div>
              </div>
              {!data.canEdit && (
                <div className="text-right">
                  <div className="mb-1 flex items-center gap-2">
                    <Progress value={pct} className="w-24" />
                    <span className="text-sm font-medium">{pct}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {done} of {lessons.length} lessons completed
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{lessons.length} lessons</p>
                      <p className="text-xs text-muted-foreground">Total content</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        {lessons.filter((l) => l.duration).length > 0
                          ? lessons
                              .map((l) => l.duration)
                              .filter(Boolean)
                              .join(", ")
                          : "Not set"}
                      </p>
                      <p className="text-xs text-muted-foreground">Lesson durations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">{done} completed</p>
                      <p className="text-xs text-muted-foreground">Lessons done</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{videos} videos</p>
                      <p className="text-xs text-muted-foreground">Video content</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Module lessons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lessons.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    This module has no lessons yet.
                  </p>
                )}
                {lessons.map((lesson) => {
                  const isCurrent = !lesson.completed && lesson.unlocked

                  return (
                    <div
                      key={lesson._id}
                      className={`rounded-lg border p-4 ${isCurrent ? "border-primary bg-primary/5" : ""}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            {lesson.type === "video" ? (
                              <Video className="h-5 w-5" />
                            ) : lesson.type === "assignment" ? (
                              <FileText className="h-5 w-5" />
                            ) : (
                              <BookOpen className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">{lesson.title}</h3>
                            {lesson.description && (
                              <p className="mb-1 text-sm text-muted-foreground">
                                {lesson.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="capitalize">{lesson.type}</span>
                              {lesson.duration && <span>{lesson.duration}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {lesson.completed && (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Completed
                            </Badge>
                          )}
                          {isCurrent && <Badge>Current</Badge>}
                          <Button
                            size="sm"
                            variant={isCurrent ? "default" : "outline"}
                            disabled={!lesson.unlocked}
                            onClick={() =>
                              router.push(`/courses/${data.course._id}/lessons/${lesson._id}`)
                            }
                          >
                            {!lesson.unlocked ? (
                              <>
                                <Lock className="mr-2 h-4 w-4" />
                                Locked
                              </>
                            ) : (
                              <>
                                {lesson.type === "video" && <PlayCircle className="mr-2 h-4 w-4" />}
                                {lesson.completed ? "Review" : isCurrent ? "Continue" : "Start"}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                disabled={!data.previous}
                onClick={() => data.previous && router.push(`/content/${data.previous._id}`)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {data.previous?.title ?? "Previous module"}
              </Button>
              <Button
                disabled={!data.next}
                onClick={() => data.next && router.push(`/content/${data.next._id}`)}
              >
                {data.next?.title ?? "Next module"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </AsyncState>
    </div>
  )
}
