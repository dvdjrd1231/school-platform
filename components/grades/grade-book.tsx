"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Award, BookOpen, TrendingUp } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { useRole } from "@/components/context/role-context"
import { AsyncState } from "@/components/ui/async-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PickerUser {
  _id: string
  name?: string
  studentId?: string
}

interface CourseGrade {
  courseId: string
  courseCode: string
  courseTitle: string
  percent: number | null
  letter?: string | null
}

/** One graded result, as the performance report returns it. */
interface TimelineEntry {
  date: string
  percent: number
  assignment: string
  course: string
}

interface PerformanceReport {
  studentId: string
  overall: { percent: number | null; letter?: string | null; gpa?: number | null }
  courses: CourseGrade[]
  timeline: TimelineEntry[]
}

function letterFor(percent: number | null): string {
  if (percent === null) return "—"
  if (percent >= 90) return "A"
  if (percent >= 80) return "B"
  if (percent >= 70) return "C"
  if (percent >= 60) return "D"
  return "F"
}

/**
 * The grades screen.
 *
 * The client's question — "how do I know whose grades I'm looking at as a
 * parent?" — is answered by naming the student prominently at the top and, when
 * a parent has more than one child, keeping the picker on screen rather than
 * silently defaulting.
 */
export function GradeBook() {
  const searchParams = useSearchParams()
  const { userId, isTeacher, isAdmin, isParent } = useRole()
  const isStaff = isTeacher || isAdmin

  const [studentId, setStudentId] = useState("")

  const staffList = useApi<{ users: PickerUser[] }>(
    isStaff ? "/api/users?role=student&limit=100" : null,
  )
  const parentSelf = useApi<{ children?: PickerUser[] }>(
    isParent && userId ? `/api/users/${userId}` : null,
  )

  const options: PickerUser[] = useMemo(() => {
    if (isStaff) return staffList.data?.users ?? []
    if (isParent) return parentSelf.data?.children ?? []
    return []
  }, [isStaff, isParent, staffList.data, parentSelf.data])

  const linked = searchParams.get("studentId")

  useEffect(() => {
    if (studentId) return
    if (linked && (isStaff || isParent)) setStudentId(linked)
    else if (!isStaff && !isParent && userId) setStudentId(userId)
    else if (options.length > 0) setStudentId(options[0]._id)
  }, [isStaff, isParent, userId, options, studentId, linked])

  const report = useApi<PerformanceReport>(studentId ? `/api/performance/${studentId}` : null)
  const data = report.data

  const whose = options.find((o) => o._id === studentId)?.name

  // Newest first — the most recent mark is the one people look for.
  const marked = useMemo(
    () => [...(data?.timeline ?? [])].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [data],
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">Grades</h1>
          <p className="text-muted-foreground">
            {isStaff || isParent
              ? whose
                ? `Showing grades for ${whose}`
                : "Choose a student to see their grades"
              : "Your marks across every course"}
          </p>
        </div>

        {(isStaff || isParent) && options.length > 0 && (
          <div className="w-64">
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option._id} value={option._id}>
                    {option.name}
                    {option.studentId ? ` (${option.studentId})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {isParent && options.length === 0 && !parentSelf.isLoading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No students are linked to your account yet. An administrator can link your children from
            User Management.
          </CardContent>
        </Card>
      )}

      {studentId && (
        <AsyncState isLoading={report.isLoading} error={report.error} onRetry={report.refetch}>
          {data && (
            <>
              {whose && (
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Grades for</p>
                      <p className="text-xl font-semibold">{whose}</p>
                    </div>
                    <div className="flex gap-6 text-right">
                      <div>
                        <p className="text-sm text-muted-foreground">Overall</p>
                        <p className="text-2xl font-bold">
                          {data.overall.percent == null ? "—" : `${data.overall.percent}%`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Grade</p>
                        <p className="text-2xl font-bold">
                          {data.overall.letter ?? letterFor(data.overall.percent)}
                        </p>
                      </div>
                      {data.overall.gpa != null && (
                        <div>
                          <p className="text-sm text-muted-foreground">GPA</p>
                          <p className="text-2xl font-bold">{data.overall.gpa}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="h-5 w-5" />
                    By course
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.courses.length === 0 && (
                    <p className="text-sm text-muted-foreground">No courses yet.</p>
                  )}
                  {data.courses.map((course) => (
                    <div key={course.courseId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{course.courseTitle}</span>
                        <span className="flex items-center gap-2">
                          {course.percent == null ? (
                            <Badge variant="secondary">No marks yet</Badge>
                          ) : (
                            <>
                              <span>{course.percent}%</span>
                              <Badge>{course.letter ?? letterFor(course.percent)}</Badge>
                            </>
                          )}
                        </span>
                      </div>
                      <Progress value={course.percent ?? 0} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {marked.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Award className="h-5 w-5" />
                      Marked work
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Assignment</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Marked</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marked.map((entry, index) => (
                          <TableRow key={`${entry.assignment}-${entry.date}-${index}`}>
                            <TableCell className="font-medium">{entry.assignment}</TableCell>
                            <TableCell className="text-sm">{entry.course}</TableCell>
                            <TableCell className="text-sm">{Math.round(entry.percent)}%</TableCell>
                            <TableCell>
                              <Badge>{letterFor(entry.percent)}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(entry.date).toLocaleDateString(undefined, {
                                dateStyle: "medium",
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                For trends over time and a CSV export, see the Performance page.
              </p>
            </>
          )}
        </AsyncState>
      )}
    </div>
  )
}
