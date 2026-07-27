"use client"

import { useRouter } from "next/navigation"
import { BarChart3, BookOpen, ClipboardCheck, Users } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { useCourses } from "@/components/context/course-context"
import { AsyncState } from "@/components/ui/async-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ProgressRow {
  student: { _id: string; name?: string; email?: string }
  lessonProgress: number
  lessonsCompleted: number
  lessonTotal: number
  assignments: { submitted: number; graded: number; total: number }
  quizzes: { taken: number; total: number }
  average: number | null
  lastActivity: string | null
  status: string
}

interface ProgressResponse {
  course: { _id: string; title: string }
  students: ProgressRow[]
  totals: { students: number; assignments: number; quizzes: number; lessons: number }
}

function relative(iso: string | null): string {
  if (!iso) return "No activity yet"
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" })
}

/** A plain-language read on how a student is doing, from their average. */
function standing(average: number | null): { label: string; variant: "default" | "secondary" | "destructive" } {
  if (average === null) return { label: "No marks yet", variant: "secondary" }
  if (average >= 85) return { label: "Excellent", variant: "default" }
  if (average >= 70) return { label: "On track", variant: "default" }
  return { label: "Needs attention", variant: "destructive" }
}

/**
 * Class progress — every enrolled student's real position in the course.
 *
 * The client asked for references to be clickable: the class title opens the
 * course, and every student row opens their performance summary, which is where
 * you'd want to go next.
 */
export default function ClassProgressPage() {
  const router = useRouter()
  const { courses, selectedId, select, isLoading: coursesLoading } = useCourses()

  const { data, error, isLoading, refetch } = useApi<ProgressResponse>(
    selectedId ? `/api/courses/${selectedId}/progress` : null,
  )
  const rows = data?.students ?? []

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">Class progress</h1>
          <p className="text-muted-foreground">
            How far each student has got, and how they&apos;re doing. Click a student to open their
            progress summary.
          </p>
        </div>
        <div className="w-64">
          <Select value={selectedId ?? undefined} onValueChange={select}>
            <SelectTrigger>
              <SelectValue placeholder={coursesLoading ? "Loading…" : "Choose a class"} />
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
      </div>

      {!selectedId ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Choose a class to see how it&apos;s going.
          </CardContent>
        </Card>
      ) : (
        <AsyncState isLoading={isLoading} error={error} onRetry={refetch}>
          {data && (
            <>
              <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                  <CardContent className="flex items-center gap-3 py-4">
                    <Users className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Students</p>
                      <p className="text-xl font-bold">{data.totals.students}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 py-4">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Lessons</p>
                      <p className="text-xl font-bold">{data.totals.lessons}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 py-4">
                    <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Assignments</p>
                      <p className="text-xl font-bold">{data.totals.assignments}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 py-4">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Quizzes</p>
                      <p className="text-xl font-bold">{data.totals.quizzes}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    <button
                      type="button"
                      className="hover:text-emerald-600 hover:underline"
                      onClick={() => router.push(`/courses/${data.course._id}`)}
                    >
                      {data.course.title}
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AsyncState
                    isLoading={false}
                    error={null}
                    isEmpty={rows.length === 0}
                    emptyMessage="Nobody is enrolled in this class yet."
                  >
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Lessons</TableHead>
                          <TableHead>Assignments</TableHead>
                          <TableHead>Quizzes</TableHead>
                          <TableHead>Average</TableHead>
                          <TableHead>Last active</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row) => {
                          const mark = standing(row.average)

                          return (
                            <TableRow
                              key={row.student._id}
                              className="cursor-pointer"
                              onClick={() =>
                                router.push(`/performance?studentId=${row.student._id}`)
                              }
                            >
                              <TableCell>
                                <div className="font-medium hover:text-emerald-600 hover:underline">
                                  {row.student.name ?? "Unknown"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {row.student.email}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={row.lessonProgress} className="h-2 w-20" />
                                  <span className="text-xs text-muted-foreground">
                                    {row.lessonsCompleted}/{row.lessonTotal}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {row.assignments.submitted}/{row.assignments.total} in
                                <span className="block text-xs text-muted-foreground">
                                  {row.assignments.graded} marked
                                </span>
                              </TableCell>
                              <TableCell className="text-sm">
                                {row.quizzes.taken}/{row.quizzes.total}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {row.average === null ? "—" : `${row.average}%`}
                                  </span>
                                  <Badge variant={mark.variant}>{mark.label}</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {relative(row.lastActivity)}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </AsyncState>
                </CardContent>
              </Card>
            </>
          )}
        </AsyncState>
      )}
    </div>
  )
}
