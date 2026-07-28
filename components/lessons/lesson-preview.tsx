"use client"

import { CalendarClock, CheckCircle, FileText, Lock, Trophy } from "lucide-react"

import { LESSON_TYPE_DEFINITIONS } from "@/lib/lessons/types"
import { BUILTIN_ACTIVITY_LABELS, type BuiltinActivity } from "@/lib/lessons/types"
import { SUBMISSION_TYPE_LABELS, describeAllowedTypes } from "@/lib/services/submission-rules"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RichTextContent } from "@/components/ui/rich-text-editor"
import { VideoPlayer } from "@/components/courses/video-player"
import { LessonTypeIcon } from "@/components/lessons/lesson-type-icon"
import type { LessonDraft } from "@/components/lessons/drafts"
import type { QuizSettings } from "@/components/lessons/fields/quiz-fields"
import type { AssignmentSettings } from "@/components/lessons/fields/assignment-fields"
import type { QuestionDraft } from "@/components/quizzes/question-builder"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: LessonDraft
  quizSettings: QuizSettings
  questions: QuestionDraft[]
  assignmentSettings: AssignmentSettings
}

/**
 * What the lesson will look like to a student.
 *
 * Rendered from the unsaved form state rather than from the database, so a
 * teacher can check the shape of a lesson before committing to it — including
 * before it exists at all.
 */
export function LessonPreview({
  open,
  onOpenChange,
  draft,
  quizSettings,
  questions,
  assignmentSettings,
}: Props) {
  const type = draft.payload.type
  const definition = LESSON_TYPE_DEFINITIONS[type]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LessonTypeIcon type={type} />
            Preview — as a student sees it
          </DialogTitle>
          <DialogDescription>
            {draft.status === "draft"
              ? "This lesson is a draft, so students can't see it yet."
              : "This is how the lesson will appear once published."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge className={definition.tone} variant="secondary">
                {definition.label}
              </Badge>
              {draft.duration && <Badge variant="outline">{draft.duration}</Badge>}
              {draft.status === "draft" && <Badge variant="outline">Draft</Badge>}
            </div>
            <h2 className="text-2xl font-bold text-emerald-700">
              {draft.title || "Untitled lesson"}
            </h2>
            {draft.description && <p className="text-muted-foreground">{draft.description}</p>}
          </div>

          {draft.availableFrom && (
            <p className="flex items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              Opens {new Date(draft.availableFrom).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}

          {/* ---- Reading ------------------------------------------------- */}
          {draft.payload.type === "reading" && (
            <div className="space-y-4">
              {draft.payload.reading.teacherNotes && (
                <div className="rounded-md border-l-4 border-emerald-500 bg-emerald-50 p-3 text-sm">
                  {draft.payload.reading.teacherNotes}
                </div>
              )}
              {draft.payload.reading.content ? (
                <Card>
                  <CardContent className="py-6">
                    <RichTextContent html={draft.payload.reading.content} />
                  </CardContent>
                </Card>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No reading content yet.
                </p>
              )}
              {draft.payload.reading.externalUrl && (
                <a
                  href={draft.payload.reading.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-emerald-600 underline"
                >
                  Open the external reading
                </a>
              )}
            </div>
          )}

          {/* ---- Video --------------------------------------------------- */}
          {draft.payload.type === "video" && (
            <div className="space-y-4">
              {draft.payload.video.url.trim() ? (
                <VideoPlayer url={draft.payload.video.url.trim()} title={draft.title} />
              ) : (
                <p className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
                  No YouTube link yet.
                </p>
              )}

              {draft.payload.video.notes && (
                <Card>
                  <CardContent className="whitespace-pre-wrap py-4 text-sm">
                    {draft.payload.video.notes}
                  </CardContent>
                </Card>
              )}
              {draft.payload.video.transcript && (
                <details className="rounded-md border p-3 text-sm">
                  <summary className="cursor-pointer font-medium">Transcript</summary>
                  <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                    {draft.payload.video.transcript}
                  </p>
                </details>
              )}
            </div>
          )}

          {/* ---- Interactive --------------------------------------------- */}
          {draft.payload.type === "interactive" && (
            <div className="space-y-4">
              {draft.payload.interactive.instructions && (
                <Card>
                  <CardContent className="whitespace-pre-wrap py-4 text-sm">
                    {draft.payload.interactive.instructions}
                  </CardContent>
                </Card>
              )}

              <div className="rounded-md border p-4 text-sm">
                <p className="font-medium">Activity</p>
                <p className="text-muted-foreground">
                  {draft.payload.interactive.method === "embed" &&
                    "Opens inside the lesson page."}
                  {draft.payload.interactive.method === "link" &&
                    "Opens in a separate activity window."}
                  {draft.payload.interactive.method === "upload" &&
                    "Runs from the uploaded activity package."}
                  {draft.payload.interactive.method === "builtin" &&
                    `Built-in activity: ${
                      BUILTIN_ACTIVITY_LABELS[
                        draft.payload.interactive.builtinActivity as BuiltinActivity
                      ] ?? "not chosen yet"
                    }`}
                </p>
                {draft.payload.interactive.passingScore && (
                  <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    Pass mark {draft.payload.interactive.passingScore}%
                  </p>
                )}
                <p className="text-muted-foreground">
                  {Number(draft.payload.interactive.attempts) === 0
                    ? "Unlimited attempts"
                    : `${draft.payload.interactive.attempts} attempt(s)`}
                </p>
              </div>
            </div>
          )}

          {/* ---- Quiz ---------------------------------------------------- */}
          {draft.payload.type === "quiz" && (
            <div className="space-y-4">
              {quizSettings.instructions && (
                <Card>
                  <CardContent className="whitespace-pre-wrap py-4 text-sm">
                    {quizSettings.instructions}
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Questions</p>
                  <p className="text-lg font-semibold">{questions.length}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Points</p>
                  <p className="text-lg font-semibold">
                    {questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0)}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Time limit</p>
                  <p className="text-lg font-semibold">
                    {Number(quizSettings.timeLimit) > 0 ? `${quizSettings.timeLimit}m` : "None"}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Attempts</p>
                  <p className="text-lg font-semibold">
                    {Number(quizSettings.attemptsAllowed) === 0
                      ? "Unlimited"
                      : quizSettings.attemptsAllowed}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {questions.map((question, index) => (
                  <div key={question.key} className="rounded-md border p-3">
                    <p className="font-medium">
                      {index + 1}. {question.prompt || <em>No prompt yet</em>}
                      {question.required && <span className="ml-1 text-red-600">*</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {question.type} · {question.points || 0} point(s)
                    </p>
                  </div>
                ))}
                {questions.length === 0 && (
                  <p className="text-sm text-muted-foreground">No questions yet.</p>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Correct answers are {quizSettings.showAnswers ? "shown" : "hidden"} after
                submitting, and results are released{" "}
                {quizSettings.releaseResults === "immediately"
                  ? "immediately"
                  : "after you review them"}
                .
              </p>
            </div>
          )}

          {/* ---- Assignment ---------------------------------------------- */}
          {draft.payload.type === "assignment" && (
            <div className="space-y-4">
              {assignmentSettings.instructions && (
                <Card>
                  <CardContent className="py-4">
                    <RichTextContent html={assignmentSettings.instructions} />
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Due</p>
                  <p className="font-semibold">
                    {assignmentSettings.dueDate
                      ? new Date(assignmentSettings.dueDate).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Not set"}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Points</p>
                  <p className="font-semibold">{assignmentSettings.points}</p>
                </div>
              </div>

              <div className="rounded-md border p-4 text-sm">
                <p className="mb-1 font-medium">Submission</p>
                <p className="text-muted-foreground">
                  {SUBMISSION_TYPE_LABELS[assignmentSettings.submissionType]}
                </p>
                {["file", "image", "media"].includes(assignmentSettings.submissionType) && (
                  <p className="text-muted-foreground">
                    {describeAllowedTypes(assignmentSettings.allowedFileTypes)} · up to{" "}
                    {assignmentSettings.maxFileSizeMb} MB · max {assignmentSettings.maxFiles} file(s)
                  </p>
                )}
                <p className="text-muted-foreground">
                  {assignmentSettings.allowLateSubmission
                    ? `Late work accepted, ${assignmentSettings.latePenaltyPerDay}% per day`
                    : "No late submissions"}
                </p>
              </div>

              {assignmentSettings.rubric.length > 0 && (
                <div className="rounded-md border p-4">
                  <p className="mb-2 font-medium">Rubric</p>
                  <ul className="space-y-1 text-sm">
                    {assignmentSettings.rubric.map((row, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span>
                          {row.criterion || <em>Unnamed criterion</em>}
                          {row.description && (
                            <span className="text-muted-foreground"> — {row.description}</span>
                          )}
                        </span>
                        <span className="shrink-0 text-muted-foreground">{row.points} pts</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ---- Materials ----------------------------------------------- */}
          {draft.materials.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Materials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {draft.materials.map((material, i) => (
                  <p key={i} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {material.name}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ---- Completion ---------------------------------------------- */}
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm">
            {draft.completionRule === "teacher" ? (
              <Lock className="h-4 w-4 text-muted-foreground" />
            ) : (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            )}
            <span className="text-muted-foreground">
              Completed by:{" "}
              {definition.completionRules.find((r) => r.value === draft.completionRule)?.label ??
                draft.completionRule}
              {draft.completionRule === "watch-percent" && ` (${draft.watchPercent}%)`}
              {draft.completionRule === "min-score" && ` (${draft.minScore}%)`}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
