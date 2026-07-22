"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, Clock, Loader2 } from "lucide-react"

import { useRole } from "@/components/context/role-context"
import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface ApiAssignment {
  _id: string
  title: string
  points: number
  dueDate: string
  course?: { title?: string; code?: string } | null
}

interface ApiSubmission {
  _id: string
  student?: { _id: string; name?: string; email?: string; studentId?: string } | null
  status: string
  submittedAt?: string | null
  isLate?: boolean
  daysLate?: number
  rawScore?: number | null
  score?: number | null
  feedback?: string | null
  content?: string | null
}

/** Per-row grading state, keyed by submission id. */
interface RowState {
  score: string
  feedback: string
  waiveLatePenalty: boolean
  saving: boolean
  saved: boolean
  error: string
}

export default function GradeAssignmentPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const { isTeacher, isAdmin, isLoading: rolesLoading } = useRole()
  const canGrade = isTeacher || isAdmin

  const assignmentReq = useApi<ApiAssignment>(id ? `/api/assignments/${id}` : null)
  const submissionsReq = useApi<{ submissions: ApiSubmission[] }>(
    id && canGrade ? `/api/submissions?assignmentId=${id}` : null,
  )

  const assignment = assignmentReq.data
  const submissions = submissionsReq.data?.submissions ?? []

  const [rows, setRows] = useState<Record<string, RowState>>({})

  // Seed each row from whatever grade already exists.
  useEffect(() => {
    setRows((prev) => {
      const next = { ...prev }
      for (const s of submissions) {
        if (!next[s._id]) {
          next[s._id] = {
            score: s.rawScore != null ? String(s.rawScore) : s.score != null ? String(s.score) : "",
            feedback: s.feedback ?? "",
            waiveLatePenalty: false,
            saving: false,
            saved: false,
            error: "",
          }
        }
      }
      return next
    })
  }, [submissions])

  useEffect(() => {
    if (!rolesLoading && !canGrade) router.push("/classrooms/assignments")
  }, [rolesLoading, canGrade, router])

  const update = (sid: string, patch: Partial<RowState>) =>
    setRows((r) => ({ ...r, [sid]: { ...r[sid], ...patch } }))

  const saveGrade = async (sub: ApiSubmission) => {
    const row = rows[sub._id]
    if (!row) return

    const score = Number(row.score)
    if (!Number.isFinite(score) || score < 0) {
      return update(sub._id, { error: "Enter a score of zero or more" })
    }
    if (assignment && score > assignment.points) {
      return update(sub._id, { error: `Score cannot exceed ${assignment.points}` })
    }

    update(sub._id, { saving: true, error: "", saved: false })
    try {
      await apiMutate(`/api/submissions/${sub._id}/grade`, "POST", {
        score,
        feedback: row.feedback.trim() || undefined,
        release: true,
        waiveLatePenalty: row.waiveLatePenalty,
      })
      update(sub._id, { saving: false, saved: true })
      // Pull the server's final score, which may include a late penalty.
      void submissionsReq.refetch()
    } catch (err) {
      update(sub._id, {
        saving: false,
        error: err instanceof Error ? err.message : "Could not save the grade",
      })
    }
  }

  const gradedCount = submissions.filter((s) => s.score != null).length

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-emerald-600">
          {assignment ? `Grade: ${assignment.title}` : "Grade assignment"}
        </h1>
        {assignment && (
          <p className="text-muted-foreground">
            {assignment.course?.code ? `${assignment.course.code} · ` : ""}
            {assignment.points} points · {gradedCount}/{submissions.length} graded
          </p>
        )}
      </div>

      <AsyncState
        isLoading={assignmentReq.isLoading || submissionsReq.isLoading}
        error={assignmentReq.error ?? submissionsReq.error}
        isEmpty={submissions.length === 0}
        emptyMessage="No submissions yet for this assignment."
        onRetry={submissionsReq.refetch}
      >
        <div className="space-y-4">
          {submissions.map((sub) => {
            const row = rows[sub._id]
            if (!row) return null

            return (
              <Card key={sub._id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-base">
                      {sub.student?.name ?? "Unknown student"}
                      {sub.student?.studentId && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          {sub.student.studentId}
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {sub.score != null && (
                        <Badge className="bg-green-100 text-green-800">
                          {sub.score}/{assignment?.points ?? "?"}
                        </Badge>
                      )}
                      {sub.isLate && (
                        <Badge className="bg-red-100 text-red-800">
                          Late {sub.daysLate ? `${sub.daysLate}d` : ""}
                        </Badge>
                      )}
                      {sub.submittedAt && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sub.content && (
                    <div className="rounded border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                      {sub.content}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`score-${sub._id}`}>
                        Score{assignment ? ` / ${assignment.points}` : ""}
                      </Label>
                      <Input
                        id={`score-${sub._id}`}
                        type="number"
                        min={0}
                        max={assignment?.points}
                        value={row.score}
                        onChange={(e) => update(sub._id, { score: e.target.value, saved: false })}
                      />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Label htmlFor={`fb-${sub._id}`}>Feedback</Label>
                      <Textarea
                        id={`fb-${sub._id}`}
                        rows={2}
                        placeholder="Comments for the student…"
                        value={row.feedback}
                        onChange={(e) => update(sub._id, { feedback: e.target.value, saved: false })}
                      />
                    </div>
                  </div>

                  {sub.isLate && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`waive-${sub._id}`}
                        checked={row.waiveLatePenalty}
                        onCheckedChange={(c) =>
                          update(sub._id, { waiveLatePenalty: c === true, saved: false })
                        }
                      />
                      <Label htmlFor={`waive-${sub._id}`} className="font-normal text-sm">
                        Waive the late penalty for this submission
                      </Label>
                    </div>
                  )}

                  {row.error && <p className="text-sm text-red-600">{row.error}</p>}

                  <div className="flex items-center gap-3">
                    <Button size="sm" onClick={() => saveGrade(sub)} disabled={row.saving}>
                      {row.saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Save grade"
                      )}
                    </Button>
                    {row.saved && (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Saved — student notified
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </AsyncState>
    </div>
  )
}
