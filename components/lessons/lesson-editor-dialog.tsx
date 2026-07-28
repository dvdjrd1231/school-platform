"use client"

import { useCallback, useEffect, useState } from "react"
import { Eye, Loader2, Trash2 } from "lucide-react"

import { apiGet, apiMutate } from "@/lib/api/client"
import { useCourses } from "@/components/context/course-context"
import {
  LESSON_TYPES,
  LESSON_TYPE_DEFINITIONS,
  type CompletionRule,
  type LessonType,
} from "@/lib/lessons/types"
import type { NormalisedLesson } from "@/lib/lessons/normalise"
import { cn } from "@/lib/utils"

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
import { useConfirm } from "@/components/ui/confirm-dialog"

import { LessonTypeIcon } from "@/components/lessons/lesson-type-icon"
import { LessonPreview } from "@/components/lessons/lesson-preview"
import {
  blankDraft,
  blankPayload,
  draftFromLesson,
  draftToBody,
  payloadHasContent,
  type LessonDraft,
  type MaterialDraft,
} from "@/components/lessons/drafts"
import { ReadingFields } from "@/components/lessons/fields/reading-fields"
import { VideoFields } from "@/components/lessons/fields/video-fields"
import { InteractiveFields } from "@/components/lessons/fields/interactive-fields"
import {
  QuizFields,
  blankQuizSettings,
  type QuizSettings,
} from "@/components/lessons/fields/quiz-fields"
import {
  AssignmentFields,
  blankAssignmentSettings,
  type AssignmentSettings,
} from "@/components/lessons/fields/assignment-fields"
import {
  blankQuestion,
  nextQuestionKey,
  questionsToPayload,
  validateQuestions,
  type QuestionDraft,
} from "@/components/quizzes/question-builder"

interface CourseWithModules {
  _id: string
  modules: { _id: string; title: string }[]
}

interface LessonResponse {
  lesson: NormalisedLesson
  module: { _id: string; title: string }
  course: { _id: string; title: string }
}

interface Props {
  open: boolean
  courseId: string
  /** The module the lesson sits in, when editing. */
  moduleId?: string
  /** Omit to create a new lesson. */
  lessonId?: string
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

/** Local datetime string for a `datetime-local` input. */
function toLocalInput(value?: string): string {
  if (!value) return ""
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

/**
 * Create or edit a lesson.
 *
 * The lesson type drives everything below the type picker: which fields show,
 * which completion rules are offered, what gets validated, and what is sent.
 * Switching type replaces the type-specific section outright rather than hiding
 * fields, so nothing from the old type can be saved with the new one.
 */
export function LessonEditorDialog({
  open,
  courseId,
  moduleId,
  lessonId,
  onOpenChange,
  onSaved,
}: Props) {
  const isEdit = Boolean(lessonId)
  const { courses } = useCourses()

  const [draft, setDraft] = useState<LessonDraft>(() => blankDraft("reading", courseId, moduleId))
  const [quizSettings, setQuizSettings] = useState<QuizSettings>(blankQuizSettings)
  const [questions, setQuestions] = useState<QuestionDraft[]>([])
  const [assignmentSettings, setAssignmentSettings] = useState<AssignmentSettings>(
    blankAssignmentSettings,
  )

  const [modules, setModules] = useState<{ _id: string; title: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirm, confirmDialog] = useConfirm()

  const type = draft.payload.type
  const definition = LESSON_TYPE_DEFINITIONS[type]

  // Modules of whichever course the lesson is being filed under.
  useEffect(() => {
    if (!open || !draft.courseId) return
    let cancelled = false

    apiGet<CourseWithModules>(`/api/courses/${draft.courseId}`)
      .then((course) => {
        if (!cancelled) setModules(course.modules.map((m) => ({ _id: m._id, title: m.title })))
      })
      .catch(() => {
        if (!cancelled) setModules([])
      })

    return () => {
      cancelled = true
    }
  }, [open, draft.courseId])

  // Load the lesson being edited, plus its linked quiz or assignment.
  useEffect(() => {
    if (!open) return

    if (!lessonId) {
      setDraft(blankDraft("reading", courseId, moduleId))
      setQuizSettings(blankQuizSettings())
      setQuestions([blankQuestion()])
      setAssignmentSettings(blankAssignmentSettings())
      setError("")
      return
    }

    let cancelled = false
    setLoading(true)
    setError("")

    apiGet<LessonResponse>(`/api/lessons/${lessonId}`)
      .then(async (data) => {
        if (cancelled) return
        setDraft(draftFromLesson(data.lesson, data.course._id, data.module._id))

        if (data.lesson.type === "quiz" && data.lesson.quiz?.quizId) {
          const quiz = await apiGet<Record<string, unknown>>(
            `/api/quizzes/${data.lesson.quiz.quizId}`,
          )
          if (cancelled) return
          setQuizSettings({
            instructions: (quiz.instructions as string) ?? "",
            timeLimit: String(quiz.timeLimit ?? 0),
            attemptsAllowed: String(quiz.attemptsAllowed ?? 1),
            passingScore: String(quiz.passingScore ?? 0),
            shuffleQuestions: Boolean(quiz.shuffleQuestions),
            shuffleAnswers: Boolean(quiz.shuffleAnswers),
            oneQuestionAtATime: quiz.oneQuestionAtATime !== false,
            allowBacktrack: quiz.allowBacktrack !== false,
            releaseResults: (quiz.releaseResults as QuizSettings["releaseResults"]) ?? "immediately",
            showAnswers: quiz.showAnswers !== false,
            showExplanations: quiz.showExplanations !== false,
            availableFrom: toLocalInput(quiz.availableFrom as string),
            closesAt: toLocalInput(quiz.closesAt as string),
          })

          const loaded = (quiz.questions as Record<string, unknown>[]) ?? []
          setQuestions(
            loaded.length === 0
              ? [blankQuestion()]
              : loaded.map((q) => ({
                  key: nextQuestionKey(),
                  prompt: (q.prompt as string) ?? "",
                  type: (q.type as QuestionDraft["type"]) ?? "multiple-choice",
                  options: ((q.options as string[]) ?? []).length
                    ? (q.options as string[])
                    : ["", ""],
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
                  mediaUrl: ((q.media as { url?: string })?.url as string) ?? "",
                  mediaKind:
                    ((q.media as { kind?: QuestionDraft["mediaKind"] })?.kind as
                      | QuestionDraft["mediaKind"]
                      | undefined) ?? "image",
                })),
          )
        }

        if (data.lesson.type === "assignment" && data.lesson.assignment?.assignmentId) {
          const assignment = await apiGet<Record<string, unknown>>(
            `/api/assignments/${data.lesson.assignment.assignmentId}`,
          )
          if (cancelled) return
          setAssignmentSettings({
            instructions: (assignment.instructions as string) ?? "",
            dueDate: toLocalInput(assignment.dueDate as string),
            points: String(assignment.points ?? 10),
            category: (assignment.category as AssignmentSettings["category"]) ?? "homework",
            submissionType:
              (assignment.submissionType as AssignmentSettings["submissionType"]) ?? "file",
            allowedFileTypes:
              (assignment.allowedFileTypes as AssignmentSettings["allowedFileTypes"]) ?? [],
            maxFileSizeMb: String(assignment.maxFileSizeMb ?? 25),
            maxFiles: String(assignment.maxFiles ?? 1),
            attemptsAllowed: String(assignment.attemptsAllowed ?? 0),
            allowResubmission: assignment.allowResubmission !== false,
            allowLateSubmission: assignment.allowLateSubmission !== false,
            latePenaltyPerDay: String(assignment.latePenaltyPerDay ?? 10),
            lateMessage: (assignment.lateMessage as string) ?? "",
            rubric: ((assignment.rubric as Record<string, unknown>[]) ?? []).map((row) => ({
              criterion: (row.criterion as string) ?? "",
              description: (row.description as string) ?? "",
              points: String(row.points ?? 0),
            })),
            gradingInstructions: (assignment.gradingInstructions as string) ?? "",
            groupAssignment: Boolean(assignment.groupAssignment),
          })
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the lesson")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, lessonId, courseId, moduleId])

  const set = useCallback(
    <K extends keyof LessonDraft>(key: K, value: LessonDraft[K]) =>
      setDraft((d) => ({ ...d, [key]: value })),
    [],
  )

  const setMaterials = useCallback(
    (materials: MaterialDraft[]) => setDraft((d) => ({ ...d, materials })),
    [],
  )

  /**
   * Switch lesson type.
   *
   * Warns first when there is work in the current type-specific fields, because
   * that work is discarded — the client asked for exactly this prompt.
   */
  const changeType = async (nextType: LessonType) => {
    if (nextType === type) return

    if (payloadHasContent(draft.payload)) {
      const ok = await confirm({
        title: "Change the lesson type?",
        description:
          "Changing the lesson type may remove information entered in fields that do not apply to the new type. Do you want to continue?",
        confirmLabel: "Change type",
        cancelLabel: "Keep editing",
        destructive: false,
      })
      if (!ok) return
    }

    setDraft((d) => ({
      ...d,
      payload: blankPayload(nextType),
      // The completion rule belongs to the type, so it resets with it.
      completionRule: LESSON_TYPE_DEFINITIONS[nextType].defaultCompletion,
    }))
    if (nextType === "quiz" && questions.length === 0) setQuestions([blankQuestion()])
    setError("")
  }

  /** Type-specific checks, mirroring what the server enforces. */
  const validate = (): string | null => {
    if (draft.title.trim().length < 2) return "Give the lesson a title"
    if (!draft.courseId) return "Choose which class this lesson is for"

    if (draft.payload.type === "video") {
      const video = draft.payload.video
      if (video.source === "upload" && !video.fileId) return "Upload the video file"
      if (video.source !== "upload" && !video.url.trim()) return "Add the video link"
    }

    if (draft.payload.type === "interactive") {
      const activity = draft.payload.interactive
      if ((activity.method === "link" || activity.method === "embed") && !activity.url.trim()) {
        return "Add the activity link"
      }
      if (activity.method === "upload" && !activity.fileId) return "Upload the activity package"
      if (activity.method === "builtin" && !activity.builtinActivity) {
        return "Choose an activity type"
      }
    }

    if (draft.payload.type === "quiz") {
      if (questions.length === 0) return "Add at least one question"
      const problem = validateQuestions(questions)
      if (problem) return problem
    }

    if (draft.payload.type === "assignment") {
      if (!assignmentSettings.dueDate) return "Set a due date"
      if (!assignmentSettings.points.trim()) return "Set the total points"
    }

    if (draft.completionRule === "min-score" && !draft.minScore.trim()) {
      return "Set the score students need to reach"
    }

    return null
  }

  const save = async (publish: boolean) => {
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }

    setSaving(true)
    setError("")

    try {
      const body = {
        ...draftToBody({ ...draft, status: publish ? "published" : "draft" }),
        ...(isEdit
          ? {
              moveToCourseId: draft.courseId,
              moveToModuleId: draft.moduleId || undefined,
              moveToModuleTitle: draft.moduleTitle.trim() || undefined,
            }
          : {
              courseId: draft.courseId,
              moduleId: draft.moduleId || undefined,
              moduleTitle: draft.moduleTitle.trim() || undefined,
            }),
      }

      const saved = isEdit
        ? await apiMutate<{ lessonId: string }>(`/api/lessons/${lessonId}`, "PATCH", body)
        : await apiMutate<{ lessonId: string; quizId?: string; assignmentId?: string }>(
            "/api/lessons",
            "POST",
            body,
          )

      // The linked record is created by the lesson route; its settings are
      // saved separately because they belong to the Quiz/Assignment, not the
      // lesson. Re-reading the lesson gets the id in the edit case.
      if (type === "quiz" || type === "assignment") {
        const detail = await apiGet<LessonResponse>(`/api/lessons/${saved.lessonId}`)

        if (type === "quiz" && detail.lesson.quiz?.quizId) {
          await apiMutate(`/api/quizzes/${detail.lesson.quiz.quizId}`, "PATCH", {
            title: draft.title.trim(),
            description: draft.description.trim() || undefined,
            instructions: quizSettings.instructions.trim() || undefined,
            questions: questionsToPayload(questions),
            timeLimit: Number(quizSettings.timeLimit) || 0,
            attemptsAllowed: Number(quizSettings.attemptsAllowed) || 0,
            passingScore: Number(quizSettings.passingScore) || 0,
            shuffleQuestions: quizSettings.shuffleQuestions,
            shuffleAnswers: quizSettings.shuffleAnswers,
            oneQuestionAtATime: quizSettings.oneQuestionAtATime,
            allowBacktrack: quizSettings.allowBacktrack,
            releaseResults: quizSettings.releaseResults,
            showAnswers: quizSettings.showAnswers,
            showExplanations: quizSettings.showExplanations,
            availableFrom: quizSettings.availableFrom
              ? new Date(quizSettings.availableFrom).toISOString()
              : undefined,
            closesAt: quizSettings.closesAt
              ? new Date(quizSettings.closesAt).toISOString()
              : undefined,
            // The quiz follows the lesson: publishing the lesson publishes it.
            status: publish ? "published" : "draft",
          })
        }

        if (type === "assignment" && detail.lesson.assignment?.assignmentId) {
          await apiMutate(`/api/assignments/${detail.lesson.assignment.assignmentId}`, "PATCH", {
            title: draft.title.trim(),
            description: draft.description.trim() || undefined,
            instructions: assignmentSettings.instructions || undefined,
            dueDate: new Date(assignmentSettings.dueDate).toISOString(),
            points: Number(assignmentSettings.points) || 0,
            category: assignmentSettings.category,
            submissionType: assignmentSettings.submissionType,
            allowedFileTypes: assignmentSettings.allowedFileTypes,
            maxFileSizeMb: Number(assignmentSettings.maxFileSizeMb) || 25,
            maxFiles: Number(assignmentSettings.maxFiles) || 1,
            attemptsAllowed: Number(assignmentSettings.attemptsAllowed) || 0,
            allowResubmission: assignmentSettings.allowResubmission,
            allowLateSubmission: assignmentSettings.allowLateSubmission,
            latePenaltyPerDay: Number(assignmentSettings.latePenaltyPerDay) || 0,
            lateMessage: assignmentSettings.lateMessage.trim() || undefined,
            rubric: assignmentSettings.rubric
              .filter((row) => row.criterion.trim())
              .map((row) => ({
                criterion: row.criterion.trim(),
                description: row.description.trim() || undefined,
                points: Number(row.points) || 0,
              })),
            gradingInstructions: assignmentSettings.gradingInstructions.trim() || undefined,
            groupAssignment: assignmentSettings.groupAssignment,
            attachments: draft.materials,
            status: publish ? "published" : "draft",
          })
        }
      }

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the lesson")
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!lessonId) return
    const ok = await confirm({
      title: "Delete this lesson?",
      description:
        "The lesson is removed from the course and any student completion of it is cleared. A linked quiz or assignment is unpublished rather than deleted, so submissions and marks survive.",
    })
    if (!ok) return

    setSaving(true)
    try {
      await apiMutate(`/api/lessons/${lessonId}`, "DELETE")
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the lesson")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit lesson" : "Create a lesson"}</DialogTitle>
            <DialogDescription>
              Choose the kind of lesson first — the rest of the form changes to match it.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : (
            <div className="space-y-6">
              {/* ---- Lesson type ------------------------------------------- */}
              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium">Lesson type</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {LESSON_TYPES.map((option) => {
                    const optionDefinition = LESSON_TYPE_DEFINITIONS[option]
                    const active = option === type

                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={active}
                        onClick={() => void changeType(option)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-md border p-3 text-center transition-colors",
                          active
                            ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                            : "hover:bg-muted/50",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full",
                            optionDefinition.tone,
                          )}
                        >
                          <LessonTypeIcon type={option} />
                        </span>
                        <span className="text-xs font-medium">{optionDefinition.label}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">{definition.blurb}</p>
              </fieldset>

              {/* ---- Shared fields ----------------------------------------- */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson-title">Lesson title</Label>
                  <Input
                    id="lesson-title"
                    value={draft.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder={`e.g. ${definition.label} — Unit 1`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lesson-description">Short description</Label>
                  <Input
                    id="lesson-description"
                    value={draft.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="One line shown in the lesson list"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="lesson-duration">
                      {type === "reading" ? "Estimated reading time" : "Estimated duration"}
                    </Label>
                    <Input
                      id="lesson-duration"
                      value={draft.duration}
                      onChange={(e) => set("duration", e.target.value)}
                      placeholder="e.g. 15 min"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select
                      value={draft.courseId || undefined}
                      onValueChange={(value) =>
                        setDraft((d) => ({ ...d, courseId: value, moduleId: "" }))
                      }
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
                    <Label>Module or unit</Label>
                    <Select
                      value={draft.moduleId || "new"}
                      onValueChange={(value) => set("moduleId", value === "new" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {modules.map((m) => (
                          <SelectItem key={m._id} value={m._id}>
                            {m.title}
                          </SelectItem>
                        ))}
                        <SelectItem value="new">New module…</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!draft.moduleId && (
                  <div className="space-y-2">
                    <Label htmlFor="lesson-module-title">New module name</Label>
                    <Input
                      id="lesson-module-title"
                      value={draft.moduleTitle}
                      onChange={(e) => set("moduleTitle", e.target.value)}
                      placeholder="e.g. Unit 1 — Fractions"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="lesson-available">Available from (optional)</Label>
                  <Input
                    id="lesson-available"
                    type="datetime-local"
                    value={draft.availableFrom}
                    onChange={(e) => set("availableFrom", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Students can&apos;t open the lesson before this date, even once published.
                  </p>
                </div>
              </div>

              {/* ---- Type-specific fields ---------------------------------- */}
              <div className="rounded-lg border p-4">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <LessonTypeIcon type={type} />
                  {definition.label} settings
                </h3>

                {draft.payload.type === "reading" && (
                  <ReadingFields
                    value={draft.payload.reading}
                    onChange={(patch) =>
                      setDraft((d) =>
                        d.payload.type === "reading"
                          ? {
                              ...d,
                              payload: {
                                type: "reading",
                                reading: { ...d.payload.reading, ...patch },
                              },
                            }
                          : d,
                      )
                    }
                    materials={draft.materials}
                    onMaterialsChange={setMaterials}
                    courseId={draft.courseId}
                  />
                )}

                {draft.payload.type === "video" && (
                  <VideoFields
                    value={draft.payload.video}
                    onChange={(patch) =>
                      setDraft((d) =>
                        d.payload.type === "video"
                          ? { ...d, payload: { type: "video", video: { ...d.payload.video, ...patch } } }
                          : d,
                      )
                    }
                    materials={draft.materials}
                    onMaterialsChange={setMaterials}
                    courseId={draft.courseId}
                  />
                )}

                {draft.payload.type === "interactive" && (
                  <InteractiveFields
                    value={draft.payload.interactive}
                    onChange={(patch) =>
                      setDraft((d) =>
                        d.payload.type === "interactive"
                          ? {
                              ...d,
                              payload: {
                                type: "interactive",
                                interactive: { ...d.payload.interactive, ...patch },
                              },
                            }
                          : d,
                      )
                    }
                    courseId={draft.courseId}
                    scoreRequired={draft.completionRule === "min-score"}
                  />
                )}

                {draft.payload.type === "quiz" && (
                  <QuizFields
                    value={quizSettings}
                    onChange={(patch) => setQuizSettings((s) => ({ ...s, ...patch }))}
                    questions={questions}
                    onQuestionsChange={setQuestions}
                  />
                )}

                {draft.payload.type === "assignment" && (
                  <AssignmentFields
                    value={assignmentSettings}
                    onChange={(patch) => setAssignmentSettings((s) => ({ ...s, ...patch }))}
                    materials={draft.materials}
                    onMaterialsChange={setMaterials}
                    courseId={draft.courseId}
                  />
                )}
              </div>

              {/* ---- Completion ------------------------------------------- */}
              <div className="space-y-3 rounded-lg border p-4">
                <h3 className="font-semibold">How students complete this lesson</h3>
                <Select
                  value={draft.completionRule}
                  onValueChange={(value) => set("completionRule", value as CompletionRule)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {definition.completionRules.map((rule) => (
                      <SelectItem key={rule.value} value={rule.value}>
                        {rule.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {definition.completionRules.find((r) => r.value === draft.completionRule)?.hint && (
                  <p className="text-xs text-muted-foreground">
                    {definition.completionRules.find((r) => r.value === draft.completionRule)?.hint}
                  </p>
                )}

                {draft.completionRule === "watch-percent" && (
                  <div className="space-y-2">
                    <Label htmlFor="lesson-watch">Percentage that must be watched</Label>
                    <Input
                      id="lesson-watch"
                      type="number"
                      min={1}
                      max={100}
                      value={draft.watchPercent}
                      onChange={(e) => set("watchPercent", e.target.value)}
                    />
                  </div>
                )}

                {draft.completionRule === "min-score" && (
                  <div className="space-y-2">
                    <Label htmlFor="lesson-min-score">Minimum score (%)</Label>
                    <Input
                      id="lesson-min-score"
                      type="number"
                      min={0}
                      max={100}
                      value={draft.minScore}
                      onChange={(e) => set("minScore", e.target.value)}
                    />
                  </div>
                )}
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="justify-between sm:justify-between">
            <div className="flex gap-2">
              {isEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => void remove()}
                  disabled={saving}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPreviewOpen(true)}
                disabled={saving}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>

            <div className="flex gap-2">
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
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LessonPreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        draft={draft}
        quizSettings={quizSettings}
        questions={questions}
        assignmentSettings={assignmentSettings}
      />

      {confirmDialog}
    </>
  )
}
