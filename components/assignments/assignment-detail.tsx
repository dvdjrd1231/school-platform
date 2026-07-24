"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, CheckCircle, Clock, Loader2, Send } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { useRole } from "@/components/context/role-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

interface AssignmentDetailProps {
  assignmentId: string
}

interface ApiAssignment {
  _id: string
  title: string
  description?: string
  course?: { title?: string; code?: string } | null
  dueDate: string
  points: number
  category: string
  status: string
  allowLateSubmission: boolean
}

interface ApiSubmission {
  _id: string
  content?: string | null
  status: string
  submittedAt?: string | null
  isLate?: boolean
  score?: number | null
  feedback?: string | null
}

function dueInfo(dueDate: string) {
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000)
  if (days > 0) return { label: `${days} day${days === 1 ? "" : "s"} left`, late: false }
  if (days === 0) return { label: "Due today", late: false }
  return { label: `${Math.abs(days)} day${days === -1 ? "" : "s"} overdue`, late: true }
}

export function AssignmentDetail({ assignmentId }: AssignmentDetailProps) {
  const { isTeacher, isAdmin } = useRole()
  const isStaff = isTeacher || isAdmin

  const assignmentReq = useApi<ApiAssignment>(`/api/assignments/${assignmentId}`)
  // A student's own submission for this assignment (empty array if none).
  const submissionReq = useApi<{ submissions: ApiSubmission[] }>(
    isStaff ? null : `/api/submissions?assignmentId=${assignmentId}`,
  )

  const assignment = assignmentReq.data
  const submission = submissionReq.data?.submissions?.[0]

  const [content, setContent] = useState<string>("")
  const [initialised, setInitialised] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Seed the editor once from any existing draft/submission.
  const draft = useMemo(() => submission?.content ?? "", [submission])
  if (!initialised && submission !== undefined) {
    setInitialised(true)
    setContent(draft)
  }

  const alreadyGraded = submission?.status === "graded" || submission?.status === "returned"
  const due = assignment ? dueInfo(assignment.dueDate) : null

  const submit = async () => {
    setError("")
    if (!content.trim()) return setError("Write your response before submitting.")
    setSaving(true)
    try {
      await apiMutate("/api/submissions", "POST", { assignment: assignmentId, content: content.trim() })
      await submissionReq.refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Link href="/assignments" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to assignments
      </Link>

      <AsyncState isLoading={assignmentReq.isLoading} error={assignmentReq.error} onRetry={assignmentReq.refetch}>
        {assignment && (
          <>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{assignment.title}</h1>
                {assignment.course?.code && <Badge variant="outline">{assignment.course.code}</Badge>}
                <Badge variant="secondary" className="capitalize">
                  {assignment.category}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Due {new Date(assignment.dueDate).toLocaleDateString()}
                </span>
                {due && (
                  <span className={`flex items-center gap-1 ${due.late ? "text-red-600" : ""}`}>
                    <Clock className="h-4 w-4" />
                    {due.label}
                  </span>
                )}
                <span>{assignment.points} points</span>
              </div>
            </div>

            {assignment.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{assignment.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Graded result, once the teacher has released it. */}
            {submission?.score != null && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Graded: {submission.score}/{assignment.points}
                  </CardTitle>
                </CardHeader>
                {submission.feedback && (
                  <CardContent>
                    <p className="text-sm font-medium text-gray-700">Teacher feedback</p>
                    <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Staff view this page read-only; grading happens on the grade screen. */}
            {isStaff ? (
              <Card>
                <CardContent className="py-6">
                  <p className="text-sm text-muted-foreground">
                    You&apos;re viewing this as staff.{" "}
                    <Link
                      href={`/classrooms/assignments/${assignmentId}/grade`}
                      className="text-emerald-600 underline"
                    >
                      Grade submissions
                    </Link>
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your submission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AsyncState isLoading={submissionReq.isLoading} error={submissionReq.error} onRetry={submissionReq.refetch}>
                    {submission?.submittedAt && (
                      <p className="text-sm text-muted-foreground">
                        {alreadyGraded ? "Submitted and graded" : "Submitted"} on{" "}
                        {new Date(submission.submittedAt).toLocaleString()}
                        {submission.isLate ? " · late" : ""}
                      </p>
                    )}

                    <Textarea
                      rows={8}
                      placeholder="Type your response here…"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      disabled={alreadyGraded}
                    />

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    {alreadyGraded ? (
                      <p className="text-sm text-muted-foreground">
                        This submission has been graded and can no longer be changed.
                      </p>
                    ) : (
                      <Button onClick={submit} disabled={saving}>
                        {saving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        {submission?.submittedAt ? "Resubmit" : "Submit"}
                      </Button>
                    )}
                  </AsyncState>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </AsyncState>
    </div>
  )
}
