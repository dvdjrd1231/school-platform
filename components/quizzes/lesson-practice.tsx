"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, CheckCircle, FileQuestion, Pencil, Plus } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { useRole } from "@/components/context/role-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QuizEditorDialog } from "@/components/quizzes/quiz-editor-dialog"
import type { QuizListItem } from "@/components/quizzes/quiz-list"

interface Props {
  courseId: string
  lessonId: string
}

/**
 * The practice problems attached to a lesson.
 *
 * This is what the client meant by "practice problems should be part of lesson
 * creation": a teacher writes questions against the lesson itself, and students
 * answer them on the platform right below the lesson content.
 */
export function LessonPractice({ courseId, lessonId }: Props) {
  const router = useRouter()
  const { isTeacher, isAdmin } = useRole()
  const isStaff = isTeacher || isAdmin

  const { data, isLoading, refetch } = useApi<{ quizzes: QuizListItem[] }>(
    `/api/quizzes?courseId=${courseId}&lessonId=${lessonId}`,
  )
  const quizzes = data?.quizzes ?? []

  const [editing, setEditing] = useState<{ quizId?: string } | null>(null)

  if (isLoading) return null
  if (quizzes.length === 0 && !isStaff) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileQuestion className="h-5 w-5" />
            Practice problems
          </CardTitle>
          {isStaff && (
            <Button variant="outline" size="sm" onClick={() => setEditing({})}>
              <Plus className="mr-2 h-4 w-4" />
              Add questions
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {quizzes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No practice problems for this lesson yet. Add questions students can answer here.
          </p>
        )}

        {quizzes.map((quiz) => {
          const done = (quiz.attemptsTaken ?? 0) > 0

          return (
            <div
              key={quiz._id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{quiz.title}</p>
                  {quiz.status === "draft" && <Badge variant="outline">Draft</Badge>}
                  {done && <CheckCircle className="h-4 w-4 text-green-600" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  {quiz.questionCount} question{quiz.questionCount === 1 ? "" : "s"} ·{" "}
                  {quiz.totalPoints} pts
                  {quiz.bestScore
                    ? ` · best ${quiz.bestScore.score}/${quiz.bestScore.maxScore}`
                    : ""}
                </p>
              </div>

              <div className="flex gap-2">
                {isStaff ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/quizzes/${quiz._id}/results`)}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Results
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing({ quizId: quiz._id })}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => router.push(`/quizzes/${quiz._id}`)}>
                    {done ? "Try again" : "Start"}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>

      {editing && (
        <QuizEditorDialog
          open
          quizId={editing.quizId}
          defaultCourseId={courseId}
          lessonId={lessonId}
          onOpenChange={(isOpen: boolean) => !isOpen && setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void refetch()
          }}
        />
      )}
    </Card>
  )
}
