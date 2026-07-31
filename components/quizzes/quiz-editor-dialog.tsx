"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useCourses } from "@/components/context/course-context"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import {
  blankQuestion,
  nextQuestionKey,
  questionsToPayload,
  validateQuestions,
  type QuestionDraft,
} from "@/components/quizzes/question-builder"
import {
  QuizFields,
  blankQuizSettings,
  type QuizSettings,
} from "@/components/lessons/fields/quiz-fields"

interface QuizResponse {
  _id: string
  title: string
  description?: string
  instructions?: string
  kind: "quiz" | "test" | "practice"
  course: { _id: string } | string
  questions: Record<string, unknown>[]
  timeLimit: number
  attemptsAllowed: number
  passingScore: number
  shuffleQuestions: boolean
  shuffleAnswers: boolean
  oneQuestionAtATime: boolean
  allowBacktrack: boolean
  releaseResults: "immediately" | "after-review"
  showAnswers: boolean
  showExplanations: boolean
  availableFrom?: string
  closesAt?: string
  dueDate?: string
  status: "draft" | "published"
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

function toLocalInput(value?: string): string {
  if (!value) return ""
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

/**
 * The standalone quiz editor, for quizzes that aren't a lesson of their own —
 * practice problems attached to a lesson, and quizzes created from the Quizzes
 * page.
 *
 * Shares the settings panel and the question builder with the lesson form, so
 * a question type or setting added in one place works in both.
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

  const [basics, setBasics] = useState({
    title: "",
    description: "",
    kind: "quiz" as QuizResponse["kind"],
    course: defaultCourseId ?? "",
    dueDate: "",
  })
  const [settings, setSettings] = useState<QuizSettings>(blankQuizSettings)
  const [questions, setQuestions] = useState<QuestionDraft[]>([blankQuestion()])
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || quizId) return
    setBasics({
      title: "",
      description: "",
      kind: lessonId ? "practice" : "quiz",
      course: defaultCourseId ?? "",
      dueDate: "",
    })
    setSettings(blankQuizSettings())
    setQuestions([blankQuestion()])
    setError("")
  }, [open, quizId, defaultCourseId, lessonId])

  useEffect(() => {
    const quiz = existing.data
    if (!quiz) return

    setBasics({
      title: quiz.title,
      description: quiz.description ?? "",
      kind: quiz.kind,
      course: typeof quiz.course === "string" ? quiz.course : quiz.course._id,
      dueDate: quiz.dueDate ? quiz.dueDate.slice(0, 10) : "",
    })
    setSettings({
      instructions: quiz.instructions ?? "",
      timeLimit: String(quiz.timeLimit ?? 0),
      attemptsAllowed: String(quiz.attemptsAllowed ?? 1),
      passingScore: String(quiz.passingScore ?? 0),
      shuffleQuestions: Boolean(quiz.shuffleQuestions),
      shuffleAnswers: Boolean(quiz.shuffleAnswers),
      oneQuestionAtATime: quiz.oneQuestionAtATime !== false,
      allowBacktrack: quiz.allowBacktrack !== false,
      releaseResults: quiz.releaseResults ?? "immediately",
      showAnswers: quiz.showAnswers !== false,
      showExplanations: quiz.showExplanations !== false,
      availableFrom: toLocalInput(quiz.availableFrom),
      closesAt: toLocalInput(quiz.closesAt),
    })
    setQuestions(
      quiz.questions.length === 0
        ? [blankQuestion()]
        : quiz.questions.map((q) => ({
            key: nextQuestionKey(),
            prompt: (q.prompt as string) ?? "",
            type: (q.type as QuestionDraft["type"]) ?? "multiple-choice",
            options: ((q.options as string[]) ?? []).length ? (q.options as string[]) : ["", ""],
            correctAnswers: (q.correctAnswers as string[]) ?? [],
            pairs: ((q.pairs as QuestionDraft["pairs"]) ?? []).length
              ? (q.pairs as QuestionDraft["pairs"])
              : [
                  { left: "", right: "" },
                  { left: "", right: "" },
                ],
            points: String(q.points ?? 1),
            explanation: (q.explanation as string) ?? "",
            required: Boolean(q.required),
            mediaUrl: (q.media as { url?: string })?.url ?? "",
            mediaKind: ((q.media as { kind?: QuestionDraft["mediaKind"] })?.kind ??
              "image") as QuestionDraft["mediaKind"],
          })),
    )
  }, [existing.data])

  const save = async (publish: boolean) => {
    setError("")
    if (basics.title.trim().length < 2) return setError("Give the quiz a title")
    if (!basics.course) return setError("Choose which class this is for")
    if (questions.length === 0) return setError("Add at least one question")

    const problem = validateQuestions(questions)
    if (problem) return setError(problem)

    setSaving(true)

    const payload = {
      title: basics.title.trim(),
      description: basics.description.trim() || undefined,
      instructions: settings.instructions.trim() || undefined,
      kind: basics.kind,
      course: basics.course,
      lesson: lessonId,
      questions: questionsToPayload(questions),
      timeLimit: Number(settings.timeLimit) || 0,
      attemptsAllowed: Number(settings.attemptsAllowed) || 0,
      passingScore: Number(settings.passingScore) || 0,
      shuffleQuestions: settings.shuffleQuestions,
      shuffleAnswers: settings.shuffleAnswers,
      oneQuestionAtATime: settings.oneQuestionAtATime,
      allowBacktrack: settings.allowBacktrack,
      releaseResults: settings.releaseResults,
      showAnswers: settings.showAnswers,
      showExplanations: settings.showExplanations,
      availableFrom: settings.availableFrom
        ? new Date(settings.availableFrom).toISOString()
        : undefined,
      closesAt: settings.closesAt ? new Date(settings.closesAt).toISOString() : undefined,
      dueDate: basics.dueDate ? new Date(basics.dueDate).toISOString() : undefined,
      status: publish ? "published" : "draft",
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{quizId ? "Edit quiz" : "Create a quiz"}</DialogTitle>
          <DialogDescription>
            Multiple choice, select-all, true/false, fill-in-the-blank, matching and ordering are
            marked automatically. Essays come to you to mark.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quiz-title">Title</Label>
              <Input
                id="quiz-title"
                value={basics.title}
                onChange={(e) => setBasics((b) => ({ ...b, title: e.target.value }))}
                placeholder="Unit 1 check-up"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiz-description">Description (optional)</Label>
              <Textarea
                id="quiz-description"
                rows={2}
                value={basics.description}
                onChange={(e) => setBasics((b) => ({ ...b, description: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select
                  value={basics.course || undefined}
                  onValueChange={(course) => setBasics((b) => ({ ...b, course }))}
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
                  value={basics.kind}
                  onValueChange={(kind) =>
                    setBasics((b) => ({ ...b, kind: kind as QuizResponse["kind"] }))
                  }
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

              <div className="space-y-2">
                <Label htmlFor="quiz-due">Due date</Label>
                <Input
                  id="quiz-due"
                  type="date"
                  value={basics.dueDate}
                  onChange={(e) => setBasics((b) => ({ ...b, dueDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <QuizFields
            value={settings}
            onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
            questions={questions}
            onQuestionsChange={setQuestions}
          />

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
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
