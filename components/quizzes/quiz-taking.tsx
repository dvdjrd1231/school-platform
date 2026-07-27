"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle, Clock, Loader2, XCircle } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { BackButton } from "@/components/ui/back-button"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

type QuestionType =
  | "multiple-choice"
  | "multiple-select"
  | "true-false"
  | "short-answer"
  | "essay"

interface Question {
  _id: string
  prompt: string
  type: QuestionType
  options: string[]
  points: number
  order: number
}

interface QuizResponse {
  _id: string
  title: string
  description?: string
  kind: "quiz" | "test" | "practice"
  questions: Question[]
  timeLimit: number
  attemptsAllowed: number
  showAnswers: boolean
  totalPoints: number
  canEdit: boolean
  canAttempt?: boolean
  attemptsLeft?: number | null
}

interface SubmitResult {
  attemptId: string
  score: number
  maxScore: number
  percent: number
  fullyGraded: boolean
  answers: {
    question: string
    correct: boolean | null
    earned: number | null
    correctAnswers: string[]
    explanation?: string
  }[]
}

/**
 * Taking a quiz.
 *
 * Answers go to the server to be marked — the correct answers are never sent to
 * the browser beforehand, so a student can't read them out of the page. When the
 * time limit runs out the attempt submits itself rather than being lost.
 */
export function QuizTaking({ quizId }: { quizId: string }) {
  const router = useRouter()
  const { data, error, isLoading, refetch } = useApi<QuizResponse>(`/api/quizzes/${quizId}`)

  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [index, setIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const startedAt = useRef<Date>(new Date())
  const [confirm, confirmDialog] = useConfirm()

  const questions = useMemo(
    () => [...(data?.questions ?? [])].sort((a, b) => a.order - b.order),
    [data],
  )

  const submit = useRef<(auto?: boolean) => Promise<void>>(async () => {})

  submit.current = async (auto = false) => {
    if (!data || result) return

    if (!auto) {
      const unanswered = questions.filter((q) => (answers[q._id] ?? []).length === 0).length
      const ok = await confirm({
        title: "Submit your answers?",
        description:
          unanswered > 0
            ? `${unanswered} question${unanswered === 1 ? " is" : "s are"} still unanswered. You can't change your answers after submitting.`
            : "You can't change your answers after submitting.",
        confirmLabel: "Submit",
        destructive: false,
      })
      if (!ok) return
    }

    setSubmitting(true)
    setSubmitError("")
    try {
      const submitted = await apiMutate<SubmitResult>(`/api/quizzes/${quizId}/attempts`, "POST", {
        startedAt: startedAt.current.toISOString(),
        answers: questions.map((q) => ({ question: q._id, response: answers[q._id] ?? [] })),
      })
      setResult(submitted)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not submit your answers")
    } finally {
      setSubmitting(false)
    }
  }

  // Countdown for timed quizzes; auto-submits at zero so work isn't lost.
  useEffect(() => {
    if (!data || data.timeLimit <= 0 || result) return

    const deadline = startedAt.current.getTime() + data.timeLimit * 60_000
    const tick = () => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) void submit.current(true)
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [data, result])

  const setAnswer = (questionId: string, response: string[]) =>
    setAnswers((a) => ({ ...a, [questionId]: response }))

  const toggleMulti = (questionId: string, option: string) =>
    setAnswers((a) => {
      const current = a[questionId] ?? []
      return {
        ...a,
        [questionId]: current.includes(option)
          ? current.filter((o) => o !== option)
          : [...current, option],
      }
    })

  if (result) {
    const byQuestion = new Map(result.answers.map((a) => [a.question, a]))

    return (
      <div className="container mx-auto max-w-3xl space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Submitted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold">
              {result.score} / {result.maxScore}
              <span className="ml-2 text-lg font-normal text-muted-foreground">
                ({result.percent}%)
              </span>
            </p>
            {!result.fullyGraded && (
              <p className="flex items-center gap-2 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4" />
                Some answers need marking by your teacher, so this score may go up.
              </p>
            )}
            <Progress value={result.percent} className="h-2" />
          </CardContent>
        </Card>

        {result.answers.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your answers</h2>
            {questions.map((question, i) => {
              const feedback = byQuestion.get(question._id)
              const given = answers[question._id] ?? []

              return (
                <Card key={question._id}>
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">
                        {i + 1}. {question.prompt}
                      </p>
                      {feedback?.correct === true && (
                        <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                      )}
                      {feedback?.correct === false && (
                        <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                      )}
                      {feedback?.correct === null && <Badge variant="outline">To be marked</Badge>}
                    </div>

                    <p className="text-sm">
                      <span className="text-muted-foreground">Your answer: </span>
                      {given.length > 0 ? given.join(", ") : <em>blank</em>}
                    </p>

                    {feedback?.correct === false && feedback.correctAnswers.length > 0 && (
                      <p className="text-sm text-green-700">
                        Correct answer: {feedback.correctAnswers.join(", ")}
                      </p>
                    )}
                    {feedback?.explanation && (
                      <p className="text-sm text-muted-foreground">{feedback.explanation}</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={() => router.push(`/quizzes/${quizId}/results`)}>
            View all my results
          </Button>
          <Button variant="outline" onClick={() => router.push("/quizzes")}>
            Back to quizzes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6">
      <BackButton fallback="/quizzes" label="Back to quizzes" />

      <AsyncState isLoading={isLoading} error={error} onRetry={refetch}>
        {data && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-emerald-700">{data.title}</h1>
                {data.description && (
                  <p className="text-muted-foreground">{data.description}</p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  {questions.length} question{questions.length === 1 ? "" : "s"} ·{" "}
                  {data.totalPoints} points
                  {data.attemptsLeft !== null && data.attemptsLeft !== undefined
                    ? ` · ${data.attemptsLeft} attempt(s) left`
                    : ""}
                </p>
              </div>

              {remaining !== null && (
                <Badge
                  variant={remaining < 60 ? "destructive" : "secondary"}
                  className="flex items-center gap-1 text-base"
                >
                  <Clock className="h-4 w-4" />
                  {String(Math.floor(remaining / 60)).padStart(2, "0")}:
                  {String(remaining % 60).padStart(2, "0")}
                </Badge>
              )}
            </div>

            {data.canEdit && (
              <Card>
                <CardContent className="py-4 text-sm text-muted-foreground">
                  You wrote this quiz, so you&apos;re seeing the student view. Teachers&apos;
                  attempts aren&apos;t recorded — open{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => router.push(`/quizzes/${quizId}/results`)}
                  >
                    results
                  </button>{" "}
                  to see how the class did.
                </CardContent>
              </Card>
            )}

            {data.canAttempt === false ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="mb-4 text-muted-foreground">
                    You&apos;ve used all your attempts at this quiz.
                  </p>
                  <Button onClick={() => router.push(`/quizzes/${quizId}/results`)}>
                    View your results
                  </Button>
                </CardContent>
              </Card>
            ) : questions.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  This quiz has no questions yet.
                </CardContent>
              </Card>
            ) : (
              <>
                <Progress
                  value={((index + 1) / questions.length) * 100}
                  className="h-1.5"
                />

                {questions.map((question, i) => {
                  if (i !== index) return null
                  const given = answers[question._id] ?? []

                  return (
                    <Card key={question._id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-lg">
                            Question {i + 1} of {questions.length}
                          </CardTitle>
                          <Badge variant="outline">
                            {question.points} pt{question.points === 1 ? "" : "s"}
                          </Badge>
                        </div>
                        <p className="whitespace-pre-wrap text-base">{question.prompt}</p>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {(question.type === "multiple-choice" ||
                          question.type === "true-false") && (
                          <RadioGroup
                            value={given[0] ?? ""}
                            onValueChange={(v) => setAnswer(question._id, [v])}
                          >
                            {question.options.map((option) => (
                              <div key={option} className="flex items-center gap-2">
                                <RadioGroupItem value={option} id={`${question._id}-${option}`} />
                                <Label htmlFor={`${question._id}-${option}`} className="font-normal">
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}

                        {question.type === "multiple-select" && (
                          <div className="space-y-2">
                            {question.options.map((option) => (
                              <div key={option} className="flex items-center gap-2">
                                <Checkbox
                                  id={`${question._id}-${option}`}
                                  checked={given.includes(option)}
                                  onCheckedChange={() => toggleMulti(question._id, option)}
                                />
                                <Label htmlFor={`${question._id}-${option}`} className="font-normal">
                                  {option}
                                </Label>
                              </div>
                            ))}
                            <p className="text-xs text-muted-foreground">
                              Tick every answer that applies.
                            </p>
                          </div>
                        )}

                        {question.type === "short-answer" && (
                          <Textarea
                            rows={2}
                            value={given[0] ?? ""}
                            onChange={(e) => setAnswer(question._id, [e.target.value])}
                            placeholder="Type your answer"
                          />
                        )}

                        {question.type === "essay" && (
                          <>
                            <Textarea
                              rows={10}
                              value={given[0] ?? ""}
                              onChange={(e) => setAnswer(question._id, [e.target.value])}
                              placeholder="Write your answer"
                            />
                            <p className="text-xs text-muted-foreground">
                              Your teacher marks this one by hand.
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}

                {submitError && <p className="text-sm text-red-600">{submitError}</p>}

                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    disabled={index === 0}
                    onClick={() => setIndex((i) => i - 1)}
                  >
                    Previous
                  </Button>

                  <div className="flex flex-wrap justify-center gap-1">
                    {questions.map((q, i) => (
                      <button
                        type="button"
                        key={q._id}
                        onClick={() => setIndex(i)}
                        className={`h-7 w-7 rounded text-xs ${
                          i === index
                            ? "bg-emerald-600 text-white"
                            : (answers[q._id] ?? []).length > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  {index < questions.length - 1 ? (
                    <Button onClick={() => setIndex((i) => i + 1)}>Next</Button>
                  ) : (
                    <Button onClick={() => void submit.current()} disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit
                    </Button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </AsyncState>

      {confirmDialog}
    </div>
  )
}
