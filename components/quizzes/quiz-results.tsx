"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle, Loader2, XCircle } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"

interface ResultQuestion {
  _id: string
  prompt: string
  type: string
  options: string[]
  points: number
  order: number
  correctAnswers: string[]
  explanation?: string
}

interface Attempt {
  _id: string
  student?: { _id: string; name?: string; email?: string } | null
  answers: {
    question: string
    response: string[]
    earned: number | null
    correct: boolean | null
    feedback?: string
  }[]
  score: number
  maxScore: number
  fullyGraded: boolean
  attemptNumber: number
  submittedAt: string
}

interface ResultsResponse {
  quiz: { _id: string; title: string; kind: string; showAnswers: boolean; questions: ResultQuestion[] }
  attempts: Attempt[]
  isStaff: boolean
  summary: { count: number; averagePercent: number | null; awaitingMarking: number }
}

function percent(score: number, max: number): number {
  return max > 0 ? Math.round((score / max) * 100) : 0
}

/**
 * Quiz results — the screen behind the "View results" button.
 *
 * A teacher sees every attempt and can mark the essay answers, which recomputes
 * the score and notifies the student. A student sees only their own attempts.
 */
export function QuizResults({ quizId }: { quizId: string }) {
  const { data, error, isLoading, refetch } = useApi<ResultsResponse>(
    `/api/quizzes/${quizId}/attempts`,
  )

  const [open, setOpen] = useState<string | null>(null)
  const [marks, setMarks] = useState<Record<string, { earned: string; feedback: string }>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const questionsById = new Map((data?.quiz.questions ?? []).map((q) => [q._id, q]))

  const saveMarks = async (attempt: Attempt) => {
    const payload = Object.entries(marks)
      .filter(([key]) => key.startsWith(`${attempt._id}:`))
      .map(([key, value]) => ({
        question: key.split(":")[1],
        earned: Number(value.earned) || 0,
        feedback: value.feedback || undefined,
      }))

    if (payload.length === 0) return

    setSaving(true)
    setSaveError("")
    try {
      await apiMutate(`/api/attempts/${attempt._id}`, "PATCH", { marks: payload })
      setMarks({})
      await refetch()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save the marks")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <BackButton fallback="/quizzes" label="Back to quizzes" />

      <AsyncState isLoading={isLoading} error={error} onRetry={refetch}>
        {data && (
          <>
            <div>
              <h1 className="text-3xl font-bold text-emerald-600">{data.quiz.title}</h1>
              <p className="text-muted-foreground">
                {data.isStaff ? "How the class did" : "Your attempts"}
              </p>
            </div>

            {data.isStaff && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="py-4">
                    <p className="text-sm text-muted-foreground">Attempts</p>
                    <p className="text-2xl font-bold">{data.summary.count}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <p className="text-sm text-muted-foreground">Class average</p>
                    <p className="text-2xl font-bold">
                      {data.summary.averagePercent === null
                        ? "—"
                        : `${data.summary.averagePercent}%`}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <p className="text-sm text-muted-foreground">Awaiting marking</p>
                    <p className="text-2xl font-bold">{data.summary.awaitingMarking}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {data.attempts.length === 0 && (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  {data.isStaff ? "Nobody has taken this yet." : "You haven't taken this yet."}
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {data.attempts.map((attempt) => {
                const isOpen = open === attempt._id
                const pct = percent(attempt.score, attempt.maxScore)

                return (
                  <Card key={attempt._id}>
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => setOpen(isOpen ? null : attempt._id)}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">
                            {data.isStaff
                              ? (attempt.student?.name ?? "Unknown student")
                              : `Attempt ${attempt.attemptNumber}`}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {new Date(attempt.submittedAt).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                            {data.isStaff ? ` · attempt ${attempt.attemptNumber}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {!attempt.fullyGraded && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Needs marking
                            </Badge>
                          )}
                          <div className="text-right">
                            <p className="font-semibold">
                              {attempt.score} / {attempt.maxScore}
                            </p>
                            <Progress value={pct} className="h-1.5 w-24" />
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    {isOpen && (
                      <CardContent className="space-y-4 border-t pt-4">
                        {attempt.answers.map((answer, i) => {
                          const question = questionsById.get(answer.question)
                          if (!question) return null

                          const markKey = `${attempt._id}:${answer.question}`
                          const needsMarking = data.isStaff && answer.earned === null

                          return (
                            <div key={answer.question} className="space-y-2 border-b pb-4 last:border-0">
                              <div className="flex items-start justify-between gap-3">
                                <p className="font-medium">
                                  {i + 1}. {question.prompt}
                                </p>
                                <div className="flex shrink-0 items-center gap-2">
                                  {answer.correct === true && (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  )}
                                  {answer.correct === false && (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                  )}
                                  <span className="text-sm text-muted-foreground">
                                    {answer.earned ?? "—"} / {question.points}
                                  </span>
                                </div>
                              </div>

                              <p className="whitespace-pre-wrap text-sm">
                                <span className="text-muted-foreground">Answer: </span>
                                {answer.response.length > 0 ? (
                                  answer.response.join(", ")
                                ) : (
                                  <em>blank</em>
                                )}
                              </p>

                              {question.correctAnswers.length > 0 && answer.correct === false && (
                                <p className="text-sm text-green-700">
                                  Correct: {question.correctAnswers.join(", ")}
                                </p>
                              )}
                              {question.explanation && (
                                <p className="text-sm text-muted-foreground">
                                  {question.explanation}
                                </p>
                              )}
                              {answer.feedback && (
                                <p className="text-sm">
                                  <span className="text-muted-foreground">Teacher: </span>
                                  {answer.feedback}
                                </p>
                              )}

                              {needsMarking && (
                                <div className="grid gap-2 rounded-md border bg-muted/40 p-3 sm:grid-cols-[120px_1fr]">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Points (max {question.points})</Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={question.points}
                                      value={marks[markKey]?.earned ?? ""}
                                      onChange={(e) =>
                                        setMarks((m) => ({
                                          ...m,
                                          [markKey]: {
                                            earned: e.target.value,
                                            feedback: m[markKey]?.feedback ?? "",
                                          },
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Feedback (optional)</Label>
                                    <Textarea
                                      rows={2}
                                      value={marks[markKey]?.feedback ?? ""}
                                      onChange={(e) =>
                                        setMarks((m) => ({
                                          ...m,
                                          [markKey]: {
                                            earned: m[markKey]?.earned ?? "",
                                            feedback: e.target.value,
                                          },
                                        }))
                                      }
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}

                        {data.isStaff && !attempt.fullyGraded && (
                          <>
                            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                            <Button onClick={() => void saveMarks(attempt)} disabled={saving}>
                              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Save marks
                            </Button>
                          </>
                        )}
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </AsyncState>
    </div>
  )
}
