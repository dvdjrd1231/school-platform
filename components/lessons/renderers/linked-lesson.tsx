"use client"

import { useRouter } from "next/navigation"
import {
  AlertCircle,
  BarChart3,
  CalendarClock,
  ClipboardList,
  Clock,
  FileQuestion,
  Trophy,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RichTextContent } from "@/components/ui/rich-text-editor"
import { SUBMISSION_TYPE_LABELS, describeAllowedTypes } from "@/lib/services/submission-rules"
import type { FileTypeGroup, SubmissionType } from "@/lib/models/Assignment"

export interface LinkedQuiz {
  _id: string
  title: string
  status: string
  questionCount: number
  totalPoints: number
  timeLimit: number
  attemptsAllowed: number
  passingScore: number
  instructions?: string
}

export interface LinkedAssignment {
  _id: string
  title: string
  status: string
  instructions?: string
  dueDate: string
  points: number
  submissionType: SubmissionType
  allowedFileTypes: FileTypeGroup[]
  maxFileSizeMb: number
  maxFiles: number
  allowLateSubmission: boolean
  latePenaltyPerDay: number
  lateMessage?: string
  rubric: { criterion: string; description?: string; points: number }[]
}

/**
 * A quiz lesson: the rules up front, then straight into the quiz itself.
 *
 * The quiz interface lives at /quizzes/:id and is shared with standalone
 * quizzes, so a student meets the same screen either way.
 */
export function QuizLesson({ quiz, canEdit }: { quiz: LinkedQuiz | null; canEdit: boolean }) {
  const router = useRouter()

  if (!quiz) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {canEdit
            ? "This quiz lesson has no quiz attached yet — edit the lesson to add questions."
            : "Your teacher hasn't set up this quiz yet."}
        </CardContent>
      </Card>
    )
  }

  const notReady = quiz.questionCount === 0

  return (
    <div className="space-y-6">
      {quiz.instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Before you begin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap leading-relaxed">{quiz.instructions}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border p-3">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileQuestion className="h-3 w-3" />
            Questions
          </p>
          <p className="text-lg font-semibold">{quiz.questionCount}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Points</p>
          <p className="text-lg font-semibold">{quiz.totalPoints}</p>
        </div>
        <div className="rounded-md border p-3">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Time limit
          </p>
          <p className="text-lg font-semibold">
            {quiz.timeLimit > 0 ? `${quiz.timeLimit} min` : "None"}
          </p>
        </div>
        <div className="rounded-md border p-3">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Trophy className="h-3 w-3" />
            Pass mark
          </p>
          <p className="text-lg font-semibold">
            {quiz.passingScore > 0 ? `${quiz.passingScore}%` : "—"}
          </p>
        </div>
      </div>

      {notReady ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {canEdit
              ? "This quiz has no questions yet. Edit the lesson to add some."
              : "Your teacher is still preparing this quiz."}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push(`/quizzes/${quiz._id}`)}>Start the quiz</Button>
          <Button variant="outline" onClick={() => router.push(`/quizzes/${quiz._id}/results`)}>
            <BarChart3 className="mr-2 h-4 w-4" />
            {canEdit ? "View results" : "My results"}
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * An assignment lesson: the brief, the rules, the rubric, and a way in to the
 * submission screen where the work is actually handed over.
 */
export function AssignmentLesson({
  assignment,
  canEdit,
}: {
  assignment: LinkedAssignment | null
  canEdit: boolean
}) {
  const router = useRouter()

  if (!assignment) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {canEdit
            ? "This assignment lesson has no assignment attached yet — edit the lesson to set it up."
            : "Your teacher hasn't set up this assignment yet."}
        </CardContent>
      </Card>
    )
  }

  const due = new Date(assignment.dueDate)
  const overdue = due.getTime() < Date.now()
  const rubricTotal = assignment.rubric.reduce((sum, row) => sum + row.points, 0)

  return (
    <div className="space-y-6">
      {assignment.instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextContent html={assignment.instructions} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border p-3">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3 w-3" />
            Due
          </p>
          <p className={`font-semibold ${overdue ? "text-red-600" : ""}`}>
            {due.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <div className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">Points possible</p>
          <p className="font-semibold">{assignment.points}</p>
        </div>
      </div>

      {overdue && assignment.allowLateSubmission && (
        <p className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {assignment.lateMessage ||
            `This is now late — ${assignment.latePenaltyPerDay}% is deducted per day.`}
        </p>
      )}
      {overdue && !assignment.allowLateSubmission && (
        <p className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          <AlertCircle className="h-4 w-4 shrink-0" />
          The deadline has passed and late submissions aren&apos;t accepted.
        </p>
      )}

      <div className="rounded-md border p-4 text-sm">
        <p className="mb-1 flex items-center gap-2 font-medium">
          <ClipboardList className="h-4 w-4" />
          How to submit
        </p>
        <p className="text-muted-foreground">
          {SUBMISSION_TYPE_LABELS[assignment.submissionType]}
        </p>
        {["file", "image", "media"].includes(assignment.submissionType) && (
          <p className="text-muted-foreground">
            {describeAllowedTypes(assignment.allowedFileTypes)} · up to {assignment.maxFileSizeMb} MB
            · max {assignment.maxFiles} file{assignment.maxFiles === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {assignment.rubric.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Rubric{" "}
              <span className="font-normal text-muted-foreground">({rubricTotal} points)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {assignment.rubric.map((row, i) => (
                <li key={i} className="flex justify-between gap-3 border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{row.criterion}</p>
                    {row.description && (
                      <p className="text-sm text-muted-foreground">{row.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {row.points} pts
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {assignment.submissionType === "none" ? (
          <p className="text-sm text-muted-foreground">
            Nothing to hand in online — mark the lesson complete when you have finished.
          </p>
        ) : (
          <Button onClick={() => router.push(`/assignments/${assignment._id}`)}>
            {canEdit ? "Open assignment" : "Go to submission"}
          </Button>
        )}
      </div>
    </div>
  )
}
