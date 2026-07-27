"use client"

import { useRouter } from "next/navigation"
import { CheckCircle, Circle, GraduationCap } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { useRole } from "@/components/context/role-context"
import { AsyncState } from "@/components/ui/async-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface EnrollmentRow {
  _id: string
  status: "active" | "completed" | "dropped" | "pending"
  progress: number
  completedCount: number
  finalGrade?: number
  course?: {
    _id: string
    title: string
    code: string
    subject: string
    status: string
  } | null
}

/**
 * Study plan — progress through the courses this student is taking.
 *
 * The template called this a "degree plan" and showed invented credit totals,
 * which doesn't describe a K-12 school. This is the honest version: each
 * enrolled course, how far through it they are, and what's finished.
 */
export default function StudyPlanPage() {
  const router = useRouter()
  const { userId } = useRole()
  const { data, error, isLoading, refetch } = useApi<{ enrollments: EnrollmentRow[] }>(
    userId ? "/api/enrollments/me" : null,
  )

  const enrollments = data?.enrollments ?? []
  const active = enrollments.filter((e) => e.status === "active")
  const completed = enrollments.filter((e) => e.status === "completed")

  const overall =
    enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress ?? 0), 0) / enrollments.length)
      : 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Study plan</h1>
        <p className="text-gray-600">How far through each of your courses you are</p>
      </div>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={enrollments.length === 0}
        emptyMessage="You're not enrolled in any courses yet."
        onRetry={refetch}
      >
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="h-5 w-5" />
                Overall progress
              </CardTitle>
              <CardDescription>
                {completed.length} of {enrollments.length} course
                {enrollments.length === 1 ? "" : "s"} finished
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Across all courses</span>
                <span>{overall}%</span>
              </div>
              <Progress value={overall} className="h-3" />
            </CardContent>
          </Card>

          {active.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">In progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {active.map((enrollment) => (
                  <button
                    type="button"
                    key={enrollment._id}
                    className="w-full rounded-lg border p-4 text-left hover:bg-muted/50"
                    onClick={() =>
                      enrollment.course && router.push(`/courses/${enrollment.course._id}`)
                    }
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Circle className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium">
                          {enrollment.course?.title ?? "Untitled course"}
                        </span>
                      </div>
                      {enrollment.course?.subject && (
                        <Badge variant="secondary">{enrollment.course.subject}</Badge>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <Progress value={enrollment.progress} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground">
                        {enrollment.progress}% · {enrollment.completedCount} lesson
                        {enrollment.completedCount === 1 ? "" : "s"} done
                      </span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {completed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Finished</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {completed.map((enrollment) => (
                  <button
                    type="button"
                    key={enrollment._id}
                    className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/50"
                    onClick={() =>
                      enrollment.course && router.push(`/courses/${enrollment.course._id}`)
                    }
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {enrollment.course?.title ?? "Untitled course"}
                    </span>
                    {enrollment.finalGrade != null && <Badge>{enrollment.finalGrade}%</Badge>}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </AsyncState>
    </div>
  )
}
