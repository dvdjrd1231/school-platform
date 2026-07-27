"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  CheckCircle,
  Download,
  Lock,
  Loader2,
  Pencil,
  RotateCcw,
} from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { LessonEditorDialog } from "@/components/courses/lesson-editor-dialog"
import { VideoPlayer } from "@/components/courses/video-player"
import type { ApiLesson } from "@/components/courses/course-modules"

interface LessonResponse {
  lesson: ApiLesson
  module: { _id: string; title: string }
  course: { _id: string; title: string; code: string }
  position: { index: number; total: number }
  previous: { lessonId: string; title: string } | null
  next: { lessonId: string; title: string } | null
  completed: boolean
  unlocked: boolean
  canEdit: boolean
}

/**
 * A single lesson: video, text, materials, and the "mark complete" action that
 * unlocks the next one.
 */
export function LessonViewer({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const router = useRouter()
  const { data, error, isLoading, refetch } = useApi<LessonResponse>(`/api/lessons/${lessonId}`)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState("")
  const [editing, setEditing] = useState(false)

  const complete = async () => {
    setBusy(true)
    setActionError("")
    try {
      const result = await apiMutate<{ next: { lessonId: string } | null }>(
        `/api/lessons/${lessonId}/complete`,
        "POST",
      )
      // Move straight on to the lesson they just unlocked; if this was the last
      // one, return to the course so they see the completed course.
      if (result.next) {
        router.push(`/courses/${courseId}/lessons/${result.next.lessonId}`)
      } else {
        router.push(`/courses/${courseId}`)
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not save your progress")
    } finally {
      setBusy(false)
    }
  }

  const reopen = async () => {
    setBusy(true)
    try {
      await apiMutate(`/api/lessons/${lessonId}/complete`, "DELETE")
      await refetch()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <AsyncState isLoading={isLoading} error={error} onRetry={refetch}>
        {data && (
          <>
            <BackButton fallback={`/courses/${courseId}`} label="Back to course" className="mb-4" />

            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  <Link href={`/courses/${courseId}`} className="hover:underline">
                    {data.course.title}
                  </Link>{" "}
                  · {data.module.title}
                </p>
                <h1 className="text-3xl font-bold text-emerald-700">{data.lesson.title}</h1>
                {data.lesson.description && (
                  <p className="mt-1 text-muted-foreground">{data.lesson.description}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline">{data.lesson.type}</Badge>
                {data.lesson.duration && <Badge variant="secondary">{data.lesson.duration}</Badge>}
                {data.canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-1 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Lesson {data.position.index + 1} of {data.position.total}
                </span>
                {data.completed && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Completed
                  </span>
                )}
              </div>
              <Progress
                value={((data.position.index + (data.completed ? 1 : 0)) / data.position.total) * 100}
                className="h-1.5"
              />
            </div>

            {!data.unlocked ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                  <Lock className="h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">This lesson is locked</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Complete the earlier lessons in this course to unlock it.
                  </p>
                  <Button variant="outline" onClick={() => router.push(`/courses/${courseId}`)}>
                    Back to the course
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {data.lesson.videoUrl && (
                  <VideoPlayer url={data.lesson.videoUrl} title={data.lesson.title} />
                )}

                {data.lesson.content && (
                  <Card>
                    <CardContent className="prose prose-emerald max-w-none py-6">
                      {data.lesson.content.split(/\n{2,}/).map((paragraph, i) => (
                        <p key={i} className="mb-4 whitespace-pre-wrap leading-relaxed last:mb-0">
                          {paragraph}
                        </p>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {!data.lesson.content && !data.lesson.videoUrl && (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      {data.canEdit
                        ? "This lesson has no content yet — use Edit to add a video or text."
                        : "Your teacher hasn't added content to this lesson yet."}
                    </CardContent>
                  </Card>
                )}

                {data.lesson.materials.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Materials</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {data.lesson.materials.map((m) => (
                        <a
                          key={m.url}
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/50"
                        >
                          <span>{m.name}</span>
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </a>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {actionError && <p className="text-sm text-red-600">{actionError}</p>}

                <div className="flex items-center justify-between gap-3 border-t pt-4">
                  <div>
                    {data.previous && (
                      <Button
                        variant="ghost"
                        onClick={() =>
                          router.push(`/courses/${courseId}/lessons/${data.previous!.lessonId}`)
                        }
                      >
                        ← {data.previous.title}
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {data.canEdit ? (
                      // Teachers have no progress to record; they just page through.
                      data.next && (
                        <Button
                          onClick={() =>
                            router.push(`/courses/${courseId}/lessons/${data.next!.lessonId}`)
                          }
                        >
                          Next lesson
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )
                    ) : data.completed ? (
                      <>
                        <Button variant="outline" onClick={() => void reopen()} disabled={busy}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Mark as not done
                        </Button>
                        {data.next && (
                          <Button
                            onClick={() =>
                              router.push(`/courses/${courseId}/lessons/${data.next!.lessonId}`)
                            }
                          >
                            Next lesson
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button onClick={() => void complete()} disabled={busy}>
                        {busy ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        {data.next ? "Complete & continue" : "Complete lesson"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {editing && (
              <LessonEditorDialog
                open
                courseId={data.course._id}
                moduleId={data.module._id}
                lesson={data.lesson}
                onOpenChange={(isOpen: boolean) => !isOpen && setEditing(false)}
                onSaved={() => {
                  setEditing(false)
                  void refetch()
                }}
              />
            )}
          </>
        )}
      </AsyncState>
    </div>
  )
}
