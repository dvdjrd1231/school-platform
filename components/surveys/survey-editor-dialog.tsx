"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useCourses } from "@/components/context/course-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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

type SurveyQuestionType = "single" | "multiple" | "rating" | "text"
type Audience = "student" | "parent" | "teacher"

interface DraftQuestion {
  key: string
  prompt: string
  type: SurveyQuestionType
  options: string[]
  required: boolean
}

interface SurveyResponsePayload {
  _id: string
  title: string
  description?: string
  audience: Audience[]
  course?: { _id: string } | string | null
  anonymous: boolean
  closesAt?: string
  status: "draft" | "open" | "closed"
  questions: {
    _id: string
    prompt: string
    type: SurveyQuestionType
    options: string[]
    required: boolean
    order: number
  }[]
}

let counter = 0
const nextKey = () => `sq${++counter}`

const blank = (): DraftQuestion => ({
  key: nextKey(),
  prompt: "",
  type: "single",
  options: ["", ""],
  required: false,
})

const needsOptions = (type: SurveyQuestionType) => type === "single" || type === "multiple"

interface Props {
  open: boolean
  surveyId?: string
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

/** Write a survey and choose who is asked to fill it in. */
export function SurveyEditorDialog({ open, surveyId, onOpenChange, onSaved }: Props) {
  const { courses } = useCourses()
  const existing = useApi<SurveyResponsePayload>(open && surveyId ? `/api/surveys/${surveyId}` : null)

  const [form, setForm] = useState({
    title: "",
    description: "",
    audience: ["student"] as Audience[],
    course: "",
    anonymous: false,
    closesAt: "",
  })
  const [questions, setQuestions] = useState<DraftQuestion[]>([blank()])
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || surveyId) return
    setForm({
      title: "",
      description: "",
      audience: ["student"],
      course: "",
      anonymous: false,
      closesAt: "",
    })
    setQuestions([blank()])
    setError("")
  }, [open, surveyId])

  useEffect(() => {
    const survey = existing.data
    if (!survey) return
    setForm({
      title: survey.title,
      description: survey.description ?? "",
      audience: survey.audience,
      course:
        typeof survey.course === "string" ? survey.course : (survey.course?._id ?? ""),
      anonymous: survey.anonymous,
      closesAt: survey.closesAt ? survey.closesAt.slice(0, 10) : "",
    })
    setQuestions(
      [...survey.questions]
        .sort((a, b) => a.order - b.order)
        .map((q) => ({
          key: nextKey(),
          prompt: q.prompt,
          type: q.type,
          options: q.options.length > 0 ? q.options : ["", ""],
          required: q.required,
        })),
    )
  }, [existing.data])

  const update = (key: string, patch: Partial<DraftQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...patch } : q)))

  const toggleAudience = (role: Audience) =>
    setForm((f) => ({
      ...f,
      audience: f.audience.includes(role)
        ? f.audience.filter((r) => r !== role)
        : [...f.audience, role],
    }))

  const save = async (openIt: boolean) => {
    if (form.title.trim().length < 2) return setError("Give the survey a title")
    if (form.audience.length === 0) return setError("Choose who should fill this in")
    if (questions.length === 0) return setError("Add at least one question")

    for (const [i, q] of questions.entries()) {
      if (!q.prompt.trim()) return setError(`Question ${i + 1} needs a prompt`)
      if (needsOptions(q.type) && q.options.filter((o) => o.trim()).length < 2) {
        return setError(`Question ${i + 1} needs at least two options`)
      }
    }

    setError("")
    setSaving(true)

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      audience: form.audience,
      course: form.course || undefined,
      anonymous: form.anonymous,
      closesAt: form.closesAt ? new Date(form.closesAt).toISOString() : undefined,
      status: openIt ? "open" : "draft",
      questions: questions.map((q, index) => ({
        prompt: q.prompt.trim(),
        type: q.type,
        options: needsOptions(q.type) ? q.options.filter((o) => o.trim()) : [],
        required: q.required,
        order: index,
      })),
    }

    try {
      if (surveyId) {
        await apiMutate(`/api/surveys/${surveyId}`, "PATCH", payload)
      } else {
        await apiMutate("/api/surveys", "POST", payload)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the survey")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{surveyId ? "Edit survey" : "Create a survey"}</DialogTitle>
          <DialogDescription>
            Pick who is asked, write the questions, then open it when you&apos;re ready.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="End of term feedback"
              />
            </div>

            <div className="space-y-2">
              <Label>Introduction (optional)</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Who should fill this in?</Label>
              <div className="flex flex-wrap gap-4">
                {(["student", "parent", "teacher"] as Audience[]).map((role) => (
                  <label key={role} className="flex items-center gap-2 text-sm capitalize">
                    <Checkbox
                      checked={form.audience.includes(role)}
                      onCheckedChange={() => toggleAudience(role)}
                    />
                    {role}s
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Limit to a class (optional)</Label>
                <Select
                  value={form.course || "all"}
                  onValueChange={(v) => setForm((f) => ({ ...f, course: v === "all" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone in those roles</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Closes on (optional)</Label>
                <Input
                  type="date"
                  value={form.closesAt}
                  onChange={(e) => setForm((f) => ({ ...f, closesAt: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Anonymous</Label>
                <p className="text-xs text-muted-foreground">
                  Answers are stored with no name attached — which also means repeat submissions
                  can&apos;t be prevented.
                </p>
              </div>
              <Switch
                checked={form.anonymous}
                onCheckedChange={(v) => setForm((f) => ({ ...f, anonymous: v }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Questions ({questions.length})</h3>
              <Button variant="outline" size="sm" onClick={() => setQuestions((qs) => [...qs, blank()])}>
                <Plus className="mr-2 h-4 w-4" />
                Add question
              </Button>
            </div>

            {questions.map((question, index) => (
              <Card key={question.key}>
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Label>Question {index + 1}</Label>
                      <Textarea
                        rows={2}
                        value={question.prompt}
                        onChange={(e) => update(question.key, { prompt: e.target.value })}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                      onClick={() => setQuestions((qs) => qs.filter((q) => q.key !== question.key))}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Answer type</Label>
                      <Select
                        value={question.type}
                        onValueChange={(v) =>
                          update(question.key, {
                            type: v as SurveyQuestionType,
                            options: needsOptions(v as SurveyQuestionType)
                              ? question.options
                              : [],
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Choose one</SelectItem>
                          <SelectItem value="multiple">Choose several</SelectItem>
                          <SelectItem value="rating">Rating (1–5)</SelectItem>
                          <SelectItem value="text">Written answer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <label className="flex items-end gap-2 pb-2 text-sm">
                      <Checkbox
                        checked={question.required}
                        onCheckedChange={(v) => update(question.key, { required: Boolean(v) })}
                      />
                      Required
                    </label>
                  </div>

                  {needsOptions(question.type) && (
                    <div className="space-y-2">
                      <Label>Options</Label>
                      {question.options.map((option, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <Input
                            value={option}
                            placeholder={`Option ${oi + 1}`}
                            onChange={(e) => {
                              const options = [...question.options]
                              options[oi] = e.target.value
                              update(question.key, { options })
                            }}
                          />
                          {question.options.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                update(question.key, {
                                  options: question.options.filter((_, i) => i !== oi),
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
                        onClick={() => update(question.key, { options: [...question.options, ""] })}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add option
                      </Button>
                    </div>
                  )}
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
            Open survey
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
