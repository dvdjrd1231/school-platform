"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, CalendarCheck, FileText, MessageSquare, Target } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { useRole } from "@/components/context/role-context"
import { AsyncState } from "@/components/ui/async-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Child {
  _id: string
  name?: string
  email?: string
  studentId?: string
  gradeLevel?: string
}

interface PerformanceSummary {
  overall: {
    percent: number | null
    letter?: string
    gpa?: number | null
    trend?: { direction: string }
  }
  courses: { courseId: string; courseTitle: string; percent: number | null }[]
}

interface ReportFile {
  _id: string
  title?: string
  filename: string
  createdAt: string
  student?: { _id: string } | null
}

const STORAGE_KEY = "school-platform:selected-child"

/**
 * The parent home.
 *
 * A parent with more than one child had no single place to switch between them
 * — each screen asked separately, and there was no overview. This page holds the
 * choice (remembered between visits) and links every per-child view from it.
 */
export default function FamilyPage() {
  const router = useRouter()
  const { userId, isParent, isAdmin, isTeacher } = useRole()

  const profile = useApi<{ children?: Child[] }>(userId ? `/api/users/${userId}` : null)
  const children = useMemo(() => profile.data?.children ?? [], [profile.data])

  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) setSelectedId(stored)
  }, [])

  useEffect(() => {
    if (children.length === 0) return
    if (!selectedId || !children.some((c) => c._id === selectedId)) {
      setSelectedId(children[0]._id)
    }
  }, [children, selectedId])

  const select = (id: string) => {
    setSelectedId(id)
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id)
  }

  const performance = useApi<PerformanceSummary>(
    selectedId ? `/api/performance/${selectedId}` : null,
  )
  const reports = useApi<{ files: ReportFile[] }>(
    selectedId ? `/api/files?context=report&studentId=${selectedId}` : null,
  )

  const selected = children.find((c) => c._id === selectedId) ?? null
  const overall = performance.data?.overall

  if (!isParent && !isAdmin && !isTeacher) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            This page is for parents and guardians.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">My family</h1>
          <p className="text-muted-foreground">
            Everything about your {children.length === 1 ? "child" : "children"} in one place
          </p>
        </div>

        {children.length > 1 && (
          <div className="w-64">
            <Select value={selectedId ?? undefined} onValueChange={select}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child._id} value={child._id}>
                    {child.name}
                    {child.gradeLevel ? ` — ${child.gradeLevel}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <AsyncState
        isLoading={profile.isLoading}
        error={profile.error}
        isEmpty={children.length === 0}
        emptyMessage="No students are linked to your account yet. An administrator can link them from User Management."
        onRetry={profile.refetch}
      >
        {selected && (
          <>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">{selected.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selected.studentId ? `${selected.studentId} · ` : ""}
                      {selected.gradeLevel ?? "No grade level set"}
                    </p>
                  </div>
                  {overall?.letter && (
                    <Badge className="text-base">{overall.letter}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {overall?.percent != null ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Overall grade</span>
                      <span>
                        {overall.percent}%{overall.gpa != null ? ` · GPA ${overall.gpa}` : ""}
                      </span>
                    </div>
                    <Progress value={overall.percent} className="h-2" />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No graded work yet.
                  </p>
                )}

                <div className="grid gap-2 sm:grid-cols-2">
                  {(performance.data?.courses ?? []).map((course) => (
                    <div
                      key={course.courseId}
                      className="flex items-center justify-between rounded border p-2 text-sm"
                    >
                      <span className="truncate">{course.courseTitle}</span>
                      <span className="text-muted-foreground">
                        {course.percent == null ? "—" : `${course.percent}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-6"
                onClick={() => router.push("/performance")}
              >
                <BarChart3 className="h-6 w-6" />
                Performance
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-6"
                onClick={() => router.push("/campus/studies/skills-report")}
              >
                <Target className="h-6 w-6" />
                Skills report
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-6"
                onClick={() => router.push("/reports")}
              >
                <FileText className="h-6 w-6" />
                Progress reports
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 py-6"
                onClick={() => router.push("/messages")}
              >
                <MessageSquare className="h-6 w-6" />
                Message teachers
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5" />
                  Recent reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(reports.data?.files ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No progress reports have been shared yet.
                  </p>
                )}
                {(reports.data?.files ?? []).slice(0, 5).map((report) => (
                  <div
                    key={report._id}
                    className="flex items-center justify-between rounded border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{report.title ?? report.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/files/${report._id}/download`}>Download</a>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarCheck className="h-5 w-5" />
                  Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AttendanceHistory studentId={selected._id} />
              </CardContent>
            </Card>
          </>
        )}
      </AsyncState>
    </div>
  )
}

interface AttendanceRecord {
  _id: string
  date: string
  status: "present" | "absent" | "late" | "excused"
  note?: string
  course?: { title?: string } | null
}

/** The recent attendance marks for one student, newest first. */
function AttendanceHistory({ studentId }: { studentId: string }) {
  const { data, error, isLoading, refetch } = useApi<{ records: AttendanceRecord[] }>(
    `/api/attendance?studentId=${studentId}`,
  )
  const records = (data?.records ?? []).slice(0, 10)

  return (
    <AsyncState
      isLoading={isLoading}
      error={error}
      isEmpty={records.length === 0}
      emptyMessage="No attendance has been recorded yet."
      onRetry={refetch}
    >
      <div className="space-y-2">
        {records.map((record) => (
          <div
            key={record._id}
            className="flex items-center justify-between rounded border p-2 text-sm"
          >
            <span>
              {new Date(record.date).toLocaleDateString(undefined, { dateStyle: "medium" })}
              {record.course?.title ? ` · ${record.course.title}` : ""}
            </span>
            <div className="flex items-center gap-2">
              {record.note && (
                <span className="text-xs text-muted-foreground">{record.note}</span>
              )}
              <Badge
                variant={
                  record.status === "present"
                    ? "default"
                    : record.status === "absent"
                      ? "destructive"
                      : "secondary"
                }
                className="capitalize"
              >
                {record.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </AsyncState>
  )
}
