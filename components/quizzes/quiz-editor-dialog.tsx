"use client"

import { useEffect, useState } from "react"
import { GripVertical, Loader2, Plus, Trash2 } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useCourses } from "@/components/context/course-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type QuestionType =
  | "multiple-choice"
  | "multiple-select"
  | "true-false"
  | "short-answer"
  | "essay"

interface DraftQuestion {
  key: string
  prompt: string
  type: QuestionType
  options: string[]
  correctAnswers: string[]
  points: number
  explanation: string
}

interface QuizResponse {
  _id: string
  title: string
  description?: string
  kind: "quiz" | "test" | "practice"
  course: { _id: string } | string
  questions: {
    _id: string
    prompt: string
    type: QuestionType
    options: string[]
    correctAnswers: string[]
    points: number
    explanation?: string
    order: number
  }[]
  timeLimit: number
  attemptsAllowed: number
  showAnswers: boolean
  dueDate?: string
  status: "draft" | "published"
}

let keyCounter = 0
const nextKey = () => `q${++keyCounter}`

function blankQuestion(): DraftQuestion {
  return {
    key: nextKey(),
    prompt: "",
    type: "multiple-choice",
    options: ["", ""],
    correctAnswers: [],
    points: 1,
    explanation: "",
  }
}

function needsOptions(type: QuestionType): boolean {
  return type === "multiple-choice" || type === "multiple-select"
}

interface Props {
  open: boolean
  /** Omit to create. */
  quizId?: string
  defaultCourseId?: string
  /** Attaches the quiz to a lesson — this is how practice problems are made. */
  lessonId?: string
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

/**
 * Write a quiz, test, or a set of practice problems for a lesson.
 *
 * Question types cover what a school actually sets: pick one, pick several,
 * true/false, a typed short answer (marked automatically, ignoring case and
 * spacing), and an essay the teacher marks afterwards.
 */
export function QuizEditorDialog({
  open,
  quizId,
  defaultCourseId,
  lessonId,
  onOpenChange,
  onSaved,
}: Props) {
  const { courses } = useCourses()
  const existing = useApi<QuizResponse>(open && quizId ? `/api/quizzes/${quizId}` : null)

  const [form, setForm] = useState({
    title: "",
    description: "",
    kind: "quiz" as QuizResponse["kind"],
    course: defaultCourseId ?? "",
    timeLimit: 0,
    attemptsAllowed: 1,
    showAnswers: true,
    dueDate: "",
    status: "draft" as QuizResponse["status"],
  })
  const [questions, setQuestions] = useState<DraftQuestion[]>([blankQuestion()])
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!quizId) {
      setForm({
        title: "",
        description: "",
        kind: lessonId ? "practice" : "quiz",
        course: defaultCourseId ?? "",
        timeLimit: 0,
        attemptsAllowed: 1,
        showAnswers: true,
        dueDate: "",
        status: "draft",
      })
      setQuestions([blankQuestion()])
      setError("")
    }
  }, [open, quizId, defaultCourseId, lessonId])

  useEffect(() => {
    const quiz = existing.data
    if (!quiz) return
    setForm({
      title: quiz.title,
      description: quiz.description ?? "",
      kind: quiz.kind,
      course: typeof quiz.course === "string" ? quiz.course : quiz.course._id,
      timeLimit: quiz.timeLimit,
      attemptsAllowed: quiz.attemptsAllowed,
      showAnswers: quiz.showAnswers,
      dueDate: quiz.dueDate ? quiz.dueDate.slice(0, 10) : "",
      status: quiz.status,
    })
    setQuestions(
      [...quiz.questions]
        .sort((a, b) => a.order - b.order)
        .map((q) => ({
          key: nextKey(),
          prompt: q.prompt,
          type: q.type,
          options: q.options.length > 0 ? q.options : ["", ""],
          correctAnswers: q.correctAnswers,
          points: q.points,
          explanation: q.explanation ?? "",
        })),
    )
  }, [existing.data])

  const updateQuestion = (key: string, patch: Partial<DraftQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...patch } : q)))

  const changeType = (key: string, type: QuestionType) =>
    setQuestions((qs) =>
      qs.map((q) => {
        if (q.key !== key) return q
        if (type === "true-false") {
          return { ...q, type, options: ["True", "False"], correctAnswers: [] }
        }
        if (needsOptions(type)) {
          return {
            ...q,
            type,
            options: q.options.length >= 2 ? q.options : ["", ""],
            correctAnswers: [],
          }
        }
        return { ...q, type, options: [], correctAnswers: type === "essay" ? [] : q.correctAnswers }
      }),
    )

  const toggleCorrect = (key: string, option: string, multi: boolean) =>
    setQuestions((qs) =>
      qs.map((q) => {
        if (q.key !== key) return q
        if (!multi) return { ...q, correctAnswers: [option] }
        const has = q.correctAnswers.includes(option)
        return {
          ...q,
          correctAnswers: has
            ? q.correctAnswers.filter((a) => a !== option)
            : [...q.correctAnswers, option],
        }
      }),
    )

  const validate = (): string | null => {
    if (form.title.trim().length < 2) return "Give the quiz a title"
    if (!form.course) return "Choose which class this is for"
    if (questions.length === 0) return "Add at least one question"

    for (const [i, q] of questions.entries()) {
      if (!q.prompt.trim()) return `Question ${i + 1} needs a prompt`

      if (needsOptions(q.type)) {
        const filled = q.options.filter((o) => o.trim())
        if (filled.length < 2) return `Question ${i + 1} needs at least two options`
        if (q.correctAnswers.length === 0) return `Mark the correct answer for question ${i + 1}`
      }
      if (q.type === "true-false" && q.correctAnswers.length === 0) {
        return `Mark True or False for question ${i + 1}`
      }
      if (q.type === "short-answer" && q.correctAnswers.filter((a) => a.trim()).length === 0) {
        return `Question ${i + 1} needs at least one accepted answer`
      }
    }
    return null
  }

  const save = async (publish: boolean) => {
    const problem = validate()
    if (problem) return setError(problem)

    setError("")
    setSaving(true)

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      kind: form.kind,
      course: form.course,
      lesson: lessonId,
      timeLimit: form.timeLimit,
      attemptsAllowed: form.attemptsAllowed,
      showAnswers: form.showAnswers,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      status: publish ? "published" : "draft",
      questions: questions.map((q, index) => ({
        prompt: q.prompt.trim(),
        type: q.type,
        options: needsOptions(q.type) || q.type === "true-false"
          ? q.options.filter((o) => o.trim())
          : [],
        correctAnswers: q.correctAnswers.filter((a) => a.trim()),
        points: q.points,
        explanation: q.explanation.trim() || undefined,
        order: index,
      })),
    }

    try {
      if (quizId) {
        await apiMutate(`/api/quizzes/${quizId}`, "PATCH", payload)
      } else {
        await apiMutate("/api/quizzes", "POST", payload)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the quiz")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quizId ? "Edit quiz" : "Create a quiz"}</DialogTitle>
          <DialogDescription>
            Multiple choice, select-all and true/false are marked automatically. Short answers are
            matched ignoring case and spacing. Essays come to you to mark.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Unit 1 check-up"
              />
            </div>

            <div className="space-y-2">
              <Label>Instructions (optional)</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select
                  value={form.course || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, course: v }))}
                  disabled={Boolean(quizId)}
                >
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

              <div className="space-y-2">
                <Label>Kind</Label>
                <Select
                  value={form.kind}
                  onValueChange={(v) => setForm((f) => ({ ...f, kind: v as QuizResponse["kind"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="practice">Practice problems</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Time limit (min)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.timeLimit}
                  onChange={(e) => setForm((f) => ({ ...f, timeLimit: Number(e.target.value) || 0 }))}
                />
                <p className="text-xs text-muted-foreground">0 = untimed</p>
              </div>
              <div className="space-y-2">
                <Label>Attempts allowed</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.attemptsAllowed}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, attemptsAllowed: Number(e.target.value) || 0 }))
                  }
                />
                <p className="text-xs text-muted-foreground">0 = unlimited</p>
              </div>
              <div className="space-y-2">
                <Label>Due date</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Show answers after submitting</Label>
                <p className="text-xs text-muted-foreground">
                  Students see which they got right, plus any explanation you wrote.
                </p>
              </div>
              <Switch
                checked={form.showAnswers}
                onCheckedChange={(v) => setForm((f) => ({ ...f, showAnswers: v }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Questions ({questions.length}) ·{" "}
                {questions.reduce((sum, q) => sum + q.points, 0)} points
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add question
              </Button>
            </div>

            {questions.map((question, index) => (
              <Card key={question.key}>
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-start gap-2">
                    <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 space-y-2">
                      <Label>Question {index + 1}</Label>
                      <Textarea
                        rows={2}
                        value={question.prompt}
                        onChange={(e) => updateQuestion(question.key, { prompt: e.target.value })}
                        placeholder="What is 3 × 4?"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                      onClick={() =>
                        setQuestions((qs) => qs.filter((q) => q.key !== question.key))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove question</span>
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={question.type}
                        onValueChange={(v) => changeType(question.key, v as QuestionType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple-choice">Multiple choice (one answer)</SelectItem>
                          <SelectItem value="multiple-select">Select all that apply</SelectItem>
                          <SelectItem value="true-false">True / False</SelectItem>
                          <SelectItem value="short-answer">Short answer</SelectItem>
                          <SelectItem value="essay">Essay (you mark it)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Points</Label>
                      <Input
                        type="number"
                        min={0}
                        value={question.points}
                        onChange={(e) =>
                          updateQuestion(question.key, { points: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>

                  {question.type === "true-false" && (
                    <div className="space-y-2">
                      <Label>Correct answer</Label>
                      <div className="flex gap-4">
                        {["True", "False"].map((option) => (
                          <label key={option} className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name={`tf-${question.key}`}
                              checked={question.correctAnswers[0] === option}
                              onChange={() => toggleCorrect(question.key, option, false)}
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {needsOptions(question.type) && (
                    <div className="space-y-2">
                      <Label>
                        Options —{" "}
                        {question.type === "multiple-select"
                          ? "tick every correct one"
                          : "tick the correct one"}
                      </Label>
                      {question.options.map((option, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type={question.type === "multiple-select" ? "checkbox" : "radio"}
                            name={`opt-${question.key}`}
                            checked={question.correctAnswers.includes(option) && option !== ""}
                            disabled={!option.trim()}
                            onChange={() =>
                              toggleCorrect(
                                question.key,
                                option,
                                question.type === "multiple-select",
                              )
                            }
                          />
                          <Input
                            value={option}
                            placeholder={`Option ${oi + 1}`}
                            onChange={(e) => {
                              const previous = option
                              const options = [...question.options]
                              options[oi] = e.target.value
                              // Keep the answer key pointing at the renamed option.
                              updateQuestion(question.key, {
                                options,
                                correctAnswers: question.correctAnswers.map((a) =>
                                  a === previous ? e.target.value : a,
                                ),
                              })
                            }}
                          />
                          {question.options.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                updateQuestion(question.key, {
                                  options: question.options.filter((_, i) => i !== oi),
                                  correctAnswers: question.correctAnswers.filter((a) => a !== option),
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove option</span>
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateQuestion(question.key, { options: [...question.options, ""] })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add option
                      </Button>
                    </div>
                  )}

                  {question.type === "short-answer" && (
                    <div className="space-y-2">
                      <Label>Accepted answers</Label>
                      <Input
                        value={question.correctAnswers.join(", ")}
                        onChange={(e) =>
                          updateQuestion(question.key, {
                            correctAnswers: e.target.value.split(",").map((a) => a.trim()),
                          })
                        }
                        placeholder="12, twelve"
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma separated. Any one of them counts as correct.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Explanation (optional)</Label>
                    <Input
                      value={question.explanation}
                      onChange={(e) =>
                        updateQuestion(question.key, { explanation: e.target.value })
                      }
                      placeholder="Shown after submitting, if answers are revealed"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => void save(false)} disabled={saving}>
            Save as draft
          </Button>
          <Button onClick={() => void save(true)} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
