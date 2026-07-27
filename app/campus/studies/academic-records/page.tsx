"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Download, FileText, GraduationCap } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { useRole } from "@/components/context/role-context"
import { AsyncState } from "@/components/ui/async-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CoursePerformance {
  courseId: string
  courseTitle: string
  courseCode: string
  subject: string
  percent: number | null
  letter: string | null
  gradedCount: number
  pendingCount: number
  missingCount: number
}

interface PerformanceReport {
  overall: { percent: number | null; letter: string | null; gpa: number | null }
  courses: CoursePerformance[]
}

interface ReportFile {
  _id: string
  title?: string
  filename: string
  createdAt: string
  tags: string[]
}

/**
 * Academic records: the student's own transcript-style summary.
 *
 * Every course, its grade, and the overall standing, plus any report cards the
 * school has filed. The CSV export is the same one the performance page
 * produces, so there is one definition of the transcript rather than two.
 */
export default function AcademicRecordsPage() {
  const router = useRouter()
  const { userId } = useRole()

  const report = useApi<PerformanceReport>(userId ? `/api/performance/${userId}` : null)
  const reports = useApi<{ files: ReportFile[] }>(
    userId ? `/api/files?context=report&studentId=${userId}` : null,
  )

  const courses = useMemo(() => report.data?.courses ?? [], [report.data])
  const overall = report.data?.overall

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Academic records</h1>
        <p className="text-gray-600">Your courses, grades and official reports</p>
      </div>

      <AsyncState isLoading={report.isLoading} error={report.error} onRetry={report.refetch}>
        {report.data && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="h-5 w-5" />
                  Standing
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-8">
                <div>
                  <p className="text-sm text-muted-foreground">Overall</p>
                  <p className="text-3xl font-bold">
                    {overall?.percent == null ? "—" : `${overall.percent}%`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Grade</p>
                  <p className="text-3xl font-bold">{overall?.letter ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GPA</p>
                  <p className="text-3xl font-bold">{overall?.gpa ?? "—"}</p>
                </div>
                <div className="ml-auto flex items-end">
                  {userId && (
                    <Button variant="outline" asChild>
                      <a href={`/api/performance/${userId}?format=csv`} download>
                        <Download className="mr-2 h-4 w-4" />
                        Download transcript (CSV)
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Courses</CardTitle>
                <CardDescription>Every course on your record</CardDescription>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You&apos;re not enrolled in any courses yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Marked</TableHead>
                        <TableHead>Outstanding</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow
                          key={course.courseId}
                          className="cursor-pointer"
                          onClick={() => router.push(`/courses/${course.courseId}`)}
                        >
                          <TableCell>
                            <div className="font-medium hover:text-emerald-600 hover:underline">
                              {course.courseTitle}
                            </div>
                            <div className="text-xs text-muted-foreground">{course.courseCode}</div>
                          </TableCell>
                          <TableCell className="text-sm">{course.subject}</TableCell>
                          <TableCell className="text-sm">{course.gradedCount}</TableCell>
                          <TableCell className="text-sm">
                            {course.pendingCount} pending
                            {course.missingCount > 0 && (
                              <span className="block text-xs text-red-600">
                                {course.missingCount} missing
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {course.percent == null ? (
                              <Badge variant="secondary">No marks yet</Badge>
                            ) : (
                              <span className="flex items-center gap-2">
                                {course.percent}%<Badge>{course.letter}</Badge>
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5" />
                  Official reports
                </CardTitle>
                <CardDescription>Report cards and progress reports from the school</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(reports.data?.files ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No reports have been filed for you yet.
                  </p>
                )}
                {(reports.data?.files ?? []).map((file) => (
                  <div
                    key={file._id}
                    className="flex items-center justify-between rounded border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{file.title ?? file.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(file.createdAt).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/files/${file._id}/download`}>
                        <Download className="mr-1 h-3.5 w-3.5" />
                        Download
                      </a>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </AsyncState>
    </div>
  )
}
