"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  Eye,
  Plus,
  Search,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { useApi } from "@/hooks/use-api"
import { AsyncState } from "@/components/ui/async-state"
import { useRole } from "@/components/context/role-context"

interface ApiAssignment {
  _id: string
  title: string
  description?: string
  course?: { _id: string; title?: string; code?: string; subject?: string } | null
  dueDate: string
  points: number
  category: string
  status: "draft" | "published" | "closed"
  attachments: { name: string; url: string }[]
}

interface ApiSubmission {
  _id: string
  assignment?: { _id: string } | string
  status: "not-started" | "in-progress" | "submitted" | "graded" | "returned"
  score?: number | null
  submittedAt?: string | null
  feedback?: string | null
}

/** Per-student display status derived from the submission (or lack of one). */
type DisplayStatus = "not-started" | "submitted" | "graded" | "overdue"

function deriveStatus(assignment: ApiAssignment, submission: ApiSubmission | undefined): DisplayStatus {
  if (submission) {
    if (submission.status === "graded" || submission.status === "returned" || submission.score != null) {
      return "graded"
    }
    if (submission.status === "submitted") return "submitted"
  }
  if (new Date(assignment.dueDate).getTime() < Date.now()) return "overdue"
  return "not-started"
}

function statusBadge(status: DisplayStatus) {
  switch (status) {
    case "graded":
      return <Badge className="bg-green-100 text-green-800">Graded</Badge>
    case "submitted":
      return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>
    case "overdue":
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
    default:
      return <Badge variant="secondary">Not Started</Badge>
  }
}

function daysUntil(dueDate: string) {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000)
}

export function AssignmentList() {
  const [selectedTab, setSelectedTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const { isTeacher, isAdmin } = useRole()

  const assignmentsReq = useApi<{ assignments: ApiAssignment[] }>("/api/assignments")
  // Staff grade rather than submit, so their own submissions are irrelevant.
  const submissionsReq = useApi<{ submissions: ApiSubmission[] }>(
    isTeacher || isAdmin ? null : "/api/submissions",
  )

  const assignments = assignmentsReq.data?.assignments ?? []

  const submissionByAssignment = useMemo(() => {
    const map = new Map<string, ApiSubmission>()
    for (const s of submissionsReq.data?.submissions ?? []) {
      const id = typeof s.assignment === "string" ? s.assignment : s.assignment?._id
      if (id) map.set(id, s)
    }
    return map
  }, [submissionsReq.data])

  const withStatus = useMemo(
    () =>
      assignments.map((a) => ({
        assignment: a,
        submission: submissionByAssignment.get(a._id),
        status: deriveStatus(a, submissionByAssignment.get(a._id)),
      })),
    [assignments, submissionByAssignment],
  )

  const filtered = withStatus.filter(({ assignment, status }) => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab =
      selectedTab === "all" ||
      (selectedTab === "pending" && status === "not-started") ||
      (selectedTab === "submitted" && (status === "submitted" || status === "graded")) ||
      (selectedTab === "overdue" && status === "overdue")
    return matchesSearch && matchesTab
  })

  const stats = {
    total: withStatus.length,
    submitted: withStatus.filter((a) => a.status === "submitted" || a.status === "graded").length,
    pending: withStatus.filter((a) => a.status === "not-started").length,
    overdue: withStatus.filter((a) => a.status === "overdue").length,
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-balance">Assignments</h1>
          <p className="text-muted-foreground">Across your courses</p>
        </div>
        {(isTeacher || isAdmin) && (
          <Button onClick={() => router.push("/classrooms/assignments/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Assignment
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{stats.total} Total</p>
                <p className="text-xs text-muted-foreground">All assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">{stats.submitted} Submitted</p>
                <p className="text-xs text-muted-foreground">Completed work</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">{stats.pending} Pending</p>
                <p className="text-xs text-muted-foreground">Not started</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">{stats.overdue} Overdue</p>
                <p className="text-xs text-muted-foreground">Past due date</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({stats.submitted})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({stats.overdue})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4 mt-6">
          <AsyncState
            isLoading={assignmentsReq.isLoading || submissionsReq.isLoading}
            error={assignmentsReq.error}
            isEmpty={filtered.length === 0}
            emptyMessage="No assignments match this view."
            onRetry={assignmentsReq.refetch}
          >
            {filtered.map(({ assignment, submission, status }) => {
              const left = daysUntil(assignment.dueDate)
              const isUrgent = left <= 2 && status !== "submitted" && status !== "graded"

              return (
                <Card key={assignment._id} className={isUrgent ? "border-red-200 bg-red-50/50" : ""}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Link href={`/classrooms/assignments/${assignment._id}`}>
                            <h3 className="text-lg font-semibold hover:text-primary cursor-pointer text-balance">
                              {assignment.title}
                            </h3>
                          </Link>
                          {statusBadge(status)}
                          {assignment.course?.code && (
                            <Badge variant="outline">{assignment.course.code}</Badge>
                          )}
                          {isUrgent && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                        </div>
                        {assignment.description && (
                          <p className="text-muted-foreground mb-3 text-pretty">{assignment.description}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium">{assignment.points} points</p>
                        {submission?.score != null && (
                          <p className="text-sm text-green-600">
                            {submission.score}/{assignment.points}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {left > 0 ? `${left} days left` : left === 0 ? "Due today" : `${Math.abs(left)} days overdue`}
                        </span>
                      </div>
                      {submission?.submittedAt && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Submitted {new Date(submission.submittedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {submission?.feedback && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-1">Teacher Feedback:</p>
                        <p className="text-sm text-blue-700">{submission.feedback}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {isTeacher || isAdmin ? (
                        <Link href={`/classrooms/assignments/${assignment._id}/grade`}>
                          <Button size="sm">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Grade submissions
                          </Button>
                        </Link>
                      ) : status === "submitted" || status === "graded" ? (
                        <Link href={`/classrooms/assignments/${assignment._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Submission
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/classrooms/assignments/${assignment._id}`}>
                          <Button size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            {status === "not-started" ? "Start Assignment" : "Continue Work"}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </AsyncState>
        </TabsContent>
      </Tabs>
    </div>
  )
}
