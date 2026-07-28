"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, CalendarClock, CheckCircle, Loader2, Lock, Pencil, RotateCcw } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { LESSON_TYPE_DEFINITIONS } from "@/lib/lessons/types"
import type { NormalisedLesson } from "@/lib/lessons/normalise"
import { LessonEditorDialog } from "@/components/lessons/lesson-editor-dialog"
import { LessonTypeIcon } from "@/components/lessons/lesson-type-icon"
import { ReadingLesson } from "@/components/lessons/renderers/reading-lesson"
import { VideoLesson } from "@/components/lessons/renderers/video-lesson"
import { InteractiveLesson } from "@/components/lessons/renderers/interactive-lesson"
import {
  AssignmentLesson,
  QuizLesson,
  type LinkedAssignment,
  type LinkedQuiz,
} from "@/components/lessons/renderers/linked-lesson"
import { LessonPractice } from "@/components/quizzes/lesson-practice"

interface LessonResponse {
  lesson: NormalisedLesson
  module: { _id: string; title: string }
  course: { _id: string; title: string; code: string }
  position: { index: number; total: number }
  previous: { lessonId: string; title: string } | null
  next: { lessonId: string; title: string } | null
  completed: boolean
  unlocked: boolean
  canEdit: boolean
  linked: { quiz: LinkedQuiz | null; assignment: LinkedAssignment | null }
}

/**
 * A single lesson.
 *
 * The chrome — heading, progress, navigation, completion — is shared; the body
 * is chosen by lesson type, so each type gets its own student-facing layout
 * rather than one generic page with irrelevant sections hidden.
 */
export function LessonViewer({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const router = useRouter()
  const { data, error, isLoading, refetch } = useApi<LessonResponse>(`/api/lessons/${lessonId}`)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState("")
  const [editing, setEditing] = useState(false)
  /** Set by a renderer once its own requirement is met (scrolled, watched). */
  const [requirementMet, setRequirementMet] = useState(false)

  const complete = useCallback(async () => {
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
  }, [courseId, lessonId, router])

  const reopen = async () => {
    setBusy(true)
    try {
      await apiMutate(`/api/lessons/${lessonId}/complete`, "DELETE")
      await refetch()
    } finally {
      setBusy(false)
    }
  }

  const onRequirementMet = useCallback(() => setRequirementMet(true), [])

  const lesson = data?.lesson
  const definition = lesson ? LESSON_TYPE_DEFINITIONS[lesson.type] : null
  const rule = lesson?.completion.rule

  // Which rules the student satisfies by doing something on this page, rather
  // than by pressing the button directly.
  const gatedByPageAction = rule === "scroll" || rule === "watch-percent" || rule === "watch-all"
  const canPressComplete = !gatedByPageAction || requirementMet

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <AsyncState isLoading={isLoading} error={error} onRetry={refetch}>
        {data && lesson && definition && (
          <>
            <BackButton fallback={`/courses/${courseId}`} label="Back to course" className="mb-4" />

            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  <Link href={`/courses/${courseId}`} className="hover:underline">
                    {data.course.title}
                  </Link>{" "}
                  · {data.module.title}
                </p>
                <h1 className="flex items-center gap-2 text-3xl font-bold text-emerald-700">
                  <LessonTypeIcon type={lesson.type} className="h-6 w-6" />
                  {lesson.title}
                </h1>
                {lesson.description && (
                  <p className="mt-1 text-muted-foreground">{lesson.description}</p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Badge className={definition.tone} variant="secondary">
                  {definition.label}
                </Badge>
                {lesson.duration && <Badge variant="secondary">{lesson.duration}</Badge>}
                {lesson.status === "draft" && <Badge variant="outline">Draft</Badge>}
                {data.canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {data.canEdit && lesson.status === "draft" && (
              <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                This lesson is a draft — students can&apos;t see it. Publish it from the edit dialog
                when it&apos;s ready.
              </p>
            )}

            {data.canEdit && lesson.availableFrom && new Date(lesson.availableFrom) > new Date() && (
              <p className="mb-4 flex items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                Opens to students on{" "}
                {new Date(lesson.availableFrom).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}

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
                value={
                  ((data.position.index + (data.completed ? 1 : 0)) /
                    Math.max(1, data.position.total)) *
                  100
                }
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
                {/* The body is entirely type-specific. */}
                {lesson.type === "reading" && (
                  <ReadingLesson lesson={lesson} onReachedEnd={onRequirementMet} />
                )}
                {lesson.type === "video" && (
                  <VideoLesson lesson={lesson} onWatched={onRequirementMet} />
                )}
                {lesson.type === "interactive" && (
                  <InteractiveLesson lesson={lesson} onOpened={onRequirementMet} />
                )}
                {lesson.type === "quiz" && (
                  <QuizLesson quiz={data.linked.quiz} canEdit={data.canEdit} />
                )}
                {lesson.type === "assignment" && (
                  <AssignmentLesson assignment={data.linked.assignment} canEdit={data.canEdit} />
                )}

                {/* Practice problems belong to reading, video and interactive
                    lessons. A quiz lesson already is the questions. */}
                {lesson.type !== "quiz" && (
                  <LessonPractice courseId={courseId} lessonId={lessonId} />
                )}

                {actionError && <p className="text-sm text-red-600">{actionError}</p>}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
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
                    ) : rule === "teacher" ? (
                      <p className="text-sm text-muted-foreground">
                        Your teacher marks this lesson complete.
                      </p>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <Button
                          onClick={() => void complete()}
                          disabled={busy || !canPressComplete}
                        >
                          {busy ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                          )}
                          {data.next ? "Complete & continue" : "Complete lesson"}
                        </Button>
                        {!canPressComplete && (
                          <p className="text-xs text-muted-foreground">
                            {rule === "scroll"
                              ? "Read to the end of the page first."
                              : rule === "watch-percent"
                                ? `Watch at least ${lesson.completion.watchPercent ?? 80}% first.`
                                : "Watch the whole video first."}
                          </p>
                        )}
                      </div>
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
                lessonId={lessonId}
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
