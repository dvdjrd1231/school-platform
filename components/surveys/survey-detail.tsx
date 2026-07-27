"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Loader2 } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { BackButton } from "@/components/ui/back-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

type SurveyQuestionType = "single" | "multiple" | "rating" | "text"

interface Question {
  _id: string
  prompt: string
  type: SurveyQuestionType
  options: string[]
  required: boolean
  order: number
}

interface QuestionResult {
  question: string
  type: SurveyQuestionType
  tally?: Record<string, number>
  average?: number | null
  texts?: string[]
}

interface SurveyDetailResponse {
  _id: string
  title: string
  description?: string
  status: "draft" | "open" | "closed"
  anonymous: boolean
  audience: string[]
  questions: Question[]
  canSeeResults: boolean
  alreadyAnswered: boolean | null
  responseCount?: number
  results?: QuestionResult[]
}

const RATINGS = ["1", "2", "3", "4", "5"]

/**
 * One survey: fill it in, or — if you created it — read the collated results.
 *
 * Choice questions come back as a tally, ratings as an average, and written
 * answers verbatim (without a name when the survey is anonymous).
 */
export function SurveyDetail({ surveyId }: { surveyId: string }) {
  const router = useRouter()
  const { data, error, isLoading, refetch } = useApi<SurveyDetailResponse>(
    `/api/surveys/${surveyId}`,
  )

  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [done, setDone] = useState(false)

  const questions = [...(data?.questions ?? [])].sort((a, b) => a.order - b.order)

  const set = (questionId: string, response: string[]) =>
    setAnswers((a) => ({ ...a, [questionId]: response }))

  const toggle = (questionId: string, option: string) =>
    setAnswers((a) => {
      const current = a[questionId] ?? []
      return {
        ...a,
        [questionId]: current.includes(option)
          ? current.filter((o) => o !== option)
          : [...current, option],
      }
    })

  const submit = async () => {
    setSubmitting(true)
    setSubmitError("")
    try {
      await apiMutate(`/api/surveys/${surveyId}/responses`, "POST", {
        answers: questions.map((q) => ({ question: q._id, response: answers[q._id] ?? [] })),
      })
      setDone(true)
      await refetch()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not submit your answers")
    } finally {
      setSubmitting(false)
    }
  }

  const showResults = data?.canSeeResults ?? false
  const showForm = !showResults && !done && data?.alreadyAnswered !== true && data?.status === "open"

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6">
      <BackButton fallback="/surveys" label="Back to surveys" />

      <AsyncState isLoading={isLoading} error={error} onRetry={refetch}>
        {data && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold text-emerald-600">{data.title}</h1>
                {data.description && <p className="text-muted-foreground">{data.description}</p>}
              </div>
              <div className="flex gap-2">
                <Badge variant={data.status === "open" ? "default" : "secondary"}>
                  {data.status}
                </Badge>
                {data.anonymous && <Badge variant="outline">Anonymous</Badge>}
              </div>
            </div>

            {done && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                  <p className="font-medium">Thanks — your answers were recorded.</p>
                  <Button variant="outline" onClick={() => router.push("/surveys")}>
                    Back to surveys
                  </Button>
                </CardContent>
              </Card>
            )}

            {!done && data.alreadyAnswered === true && !showResults && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  You&apos;ve already filled this one in.
                </CardContent>
              </Card>
            )}

            {showForm && (
              <>
                {questions.map((question, i) => {
                  const given = answers[question._id] ?? []

                  return (
                    <Card key={question._id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {i + 1}. {question.prompt}
                          {question.required && <span className="ml-1 text-red-600">*</span>}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {question.type === "single" && (
                          <RadioGroup
                            value={given[0] ?? ""}
                            onValueChange={(v) => set(question._id, [v])}
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

                        {question.type === "multiple" && (
                          <div className="space-y-2">
                            {question.options.map((option) => (
                              <label key={option} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={given.includes(option)}
                                  onCheckedChange={() => toggle(question._id, option)}
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        )}

                        {question.type === "rating" && (
                          <RadioGroup
                            className="flex gap-4"
                            value={given[0] ?? ""}
                            onValueChange={(v) => set(question._id, [v])}
                          >
                            {RATINGS.map((value) => (
                              <div key={value} className="flex items-center gap-1">
                                <RadioGroupItem value={value} id={`${question._id}-${value}`} />
                                <Label htmlFor={`${question._id}-${value}`} className="font-normal">
                                  {value}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}

                        {question.type === "text" && (
                          <Textarea
                            rows={4}
                            value={given[0] ?? ""}
                            onChange={(e) => set(question._id, [e.target.value])}
                          />
                        )}
                      </CardContent>
                    </Card>
                  )
                })}

                {submitError && <p className="text-sm text-red-600">{submitError}</p>}

                <Button onClick={() => void submit()} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit answers
                </Button>
              </>
            )}

            {showResults && (
              <>
                <p className="text-sm text-muted-foreground">
                  {data.responseCount ?? 0} response{data.responseCount === 1 ? "" : "s"}
                </p>

                {questions.map((question, i) => {
                  const result = data.results?.find((r) => r.question === question._id)
                  const tally = result?.tally ?? {}
                  const total = Object.values(tally).reduce((s, n) => s + n, 0)

                  return (
                    <Card key={question._id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {i + 1}. {question.prompt}
                        </CardTitle>
                        {result?.average != null && (
                          <p className="text-sm text-muted-foreground">
                            Average rating: {result.average} / 5
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {question.type === "text" ? (
                          result?.texts && result.texts.length > 0 ? (
                            result.texts.map((text, ti) => (
                              <p key={ti} className="rounded border p-3 text-sm">
                                {text}
                              </p>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No written answers yet.</p>
                          )
                        ) : total === 0 ? (
                          <p className="text-sm text-muted-foreground">No answers yet.</p>
                        ) : (
                          (question.type === "rating" ? RATINGS : question.options).map((option) => {
                            const count = tally[option] ?? 0
                            const pct = total > 0 ? Math.round((count / total) * 100) : 0

                            return (
                              <div key={option}>
                                <div className="mb-1 flex justify-between text-sm">
                                  <span>{option}</span>
                                  <span className="text-muted-foreground">
                                    {count} ({pct}%)
                                  </span>
                                </div>
                                <Progress value={pct} className="h-2" />
                              </div>
                            )
                          })
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </>
            )}
          </>
        )}
      </AsyncState>
    </div>
  )
}
