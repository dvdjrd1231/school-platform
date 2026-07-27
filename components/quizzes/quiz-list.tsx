"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, ClipboardCheck, Clock, FileQuestion, Pencil, Plus, Trash2 } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useCourses } from "@/components/context/course-context"
import { useRole } from "@/components/context/role-context"
import { AsyncState } from "@/components/ui/async-state"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QuizEditorDialog } from "@/components/quizzes/quiz-editor-dialog"

export interface QuizListItem {
  _id: string
  title: string
  description?: string
  kind: "quiz" | "test" | "practice"
  status: "draft" | "published"
  timeLimit: number
  attemptsAllowed: number
  dueDate?: string
  questionCount: number
  totalPoints: number
  course?: { _id: string; title: string } | null
  // Staff-only
  attemptCount?: number
  studentCount?: number
  // Student-only
  attemptsTaken?: number
  bestScore?: { score: number; maxScore: number } | null
}

const KIND_LABEL: Record<QuizListItem["kind"], string> = {
  quiz: "Quiz",
  test: "Test",
  practice: "Practice",
}

/**
 * The quizzes screen.
 *
 * Answers "where are quizzes created?" — teachers author them here, with
 * multiple-choice, select-all, true/false, short-answer and essay questions.
 * Students see what they may take and their best score; "View results" opens
 * a real results page rather than doing nothing.
 */
export function QuizList({ courseId, lessonId }: { courseId?: string; lessonId?: string } = {}) {
  const router = useRouter()
  const { isTeacher, isAdmin } = useRole()
  const { courses, selectedId, select } = useCourses()
  const isStaff = isTeacher || isAdmin

  const scopeCourse = courseId ?? selectedId ?? undefined
  const query = new URLSearchParams()
  if (scopeCourse) query.set("courseId", scopeCourse)
  if (lessonId) query.set("lessonId", lessonId)

  const { data, error, isLoading, refetch } = useApi<{ quizzes: QuizListItem[] }>(
    `/api/quizzes${query.toString() ? `?${query}` : ""}`,
  )
  const quizzes = data?.quizzes ?? []

  const [editing, setEditing] = useState<{ quizId?: string } | null>(null)
  const [confirm, confirmDialog] = useConfirm()

  const remove = async (quiz: QuizListItem) => {
    const ok = await confirm({
      title: `Delete "${quiz.title}"?`,
      description:
        "The quiz and every student attempt at it will be permanently removed. This cannot be undone.",
      requireText: "delete",
    })
    if (!ok) return
    await apiMutate(`/api/quizzes/${quiz._id}`, "DELETE")
    await refetch()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">Quizzes &amp; tests</h1>
          <p className="text-muted-foreground">
            {isStaff
              ? "Write questions students answer on the platform, and see how they did."
              : "Everything you can take, and how you scored."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!courseId && (
            <div className="w-56">
              <Select value={selectedId ?? undefined} onValueChange={select}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
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
          )}
          {isStaff && (
            <Button onClick={() => setEditing({})}>
              <Plus className="mr-2 h-4 w-4" />
              Create quiz
            </Button>
          )}
        </div>
      </div>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={quizzes.length === 0}
        emptyMessage={
          isStaff
            ? "No quizzes yet — create one to add questions students answer on the platform."
            : "No quizzes have been set for you yet."
        }
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {quizzes.map((quiz) => (
            <Card key={quiz._id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {quiz.course?.title}
                      {quiz.description ? ` · ${quiz.description}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={quiz.kind === "practice" ? "secondary" : "default"}>
                      {KIND_LABEL[quiz.kind]}
                    </Badge>
                    {quiz.status === "draft" && <Badge variant="outline">Draft</Badge>}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileQuestion className="h-4 w-4" />
                    {quiz.questionCount} question{quiz.questionCount === 1 ? "" : "s"}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardCheck className="h-4 w-4" />
                    {quiz.totalPoints} pts
                  </span>
                  {quiz.timeLimit > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {quiz.timeLimit} min
                    </span>
                  )}
                  {quiz.dueDate && (
                    <span>
                      Due{" "}
                      {new Date(quiz.dueDate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </span>
                  )}
                </div>

                {isStaff ? (
                  <p className="text-sm text-muted-foreground">
                    {quiz.studentCount ?? 0} student{quiz.studentCount === 1 ? "" : "s"} submitted ·{" "}
                    {quiz.attemptCount ?? 0} attempt{quiz.attemptCount === 1 ? "" : "s"}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {quiz.attemptsTaken ?? 0} of{" "}
                    {quiz.attemptsAllowed === 0 ? "unlimited" : quiz.attemptsAllowed} attempts used
                    {quiz.bestScore
                      ? ` · best ${quiz.bestScore.score}/${quiz.bestScore.maxScore}`
                      : ""}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {isStaff ? (
                    <>
                      <Button size="sm" onClick={() => router.push(`/quizzes/${quiz._id}/results`)}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        View results
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing({ quizId: quiz._id })}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => void remove(quiz)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/quizzes/${quiz._id}`)}
                        disabled={
                          quiz.attemptsAllowed > 0 &&
                          (quiz.attemptsTaken ?? 0) >= quiz.attemptsAllowed
                        }
                      >
                        {(quiz.attemptsTaken ?? 0) > 0 ? "Try again" : "Start"}
                      </Button>
                      {(quiz.attemptsTaken ?? 0) > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/quizzes/${quiz._id}/results`)}
                        >
                          View results
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncState>

      {editing && (
        <QuizEditorDialog
          open
          quizId={editing.quizId}
          defaultCourseId={scopeCourse}
          lessonId={lessonId}
          onOpenChange={(isOpen: boolean) => !isOpen && setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void refetch()
          }}
        />
      )}

      {confirmDialog}
    </div>
  )
}
