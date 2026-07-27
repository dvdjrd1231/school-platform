"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle,
  FileText,
  Megaphone,
  PlayCircle,
  TrendingUp,
} from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { useCourses } from "@/components/context/course-context"
import { useRole } from "@/components/context/role-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Announcement } from "@/components/announcements/announcement-board"

interface AssignmentItem {
  _id: string
  title: string
  dueDate: string
  status: string
  points: number
  course?: { _id: string; title: string } | null
}

interface NotificationItem {
  _id: string
  title: string
  message: string
  type: string
  createdAt: string
  actionUrl?: string
}

interface EnrollmentProgress {
  course?: { _id: string } | null
  progress: number
}

function relative(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now()
  const days = Math.round(ms / 86_400_000)
  if (days === 0) return "Due today"
  if (days === 1) return "Due tomorrow"
  if (days > 1) return `Due in ${days} days`
  if (days === -1) return "Due yesterday"
  return `${Math.abs(days)} days overdue`
}

/**
 * The classroom home screen.
 *
 * Everything here is the caller's real data: their courses and progress, the
 * work actually due, the announcements posted to them, and their notification
 * feed. It used to be a fixed set of three sample courses shown to everyone.
 */
export function DashboardContent() {
  const router = useRouter()
  const { userName, isTeacher, isAdmin } = useRole()
  const { courses, isLoading: coursesLoading, selected, select } = useCourses()
  const isStaff = isTeacher || isAdmin

  const assignmentsReq = useApi<{ assignments: AssignmentItem[] }>("/api/assignments")
  const announcementsReq = useApi<{ announcements: Announcement[] }>("/api/announcements")
  const notificationsReq = useApi<{ notifications: NotificationItem[] }>("/api/notifications")
  const progressReq = useApi<{ enrollments: EnrollmentProgress[] }>(
    isStaff ? null : "/api/enrollments/me",
  )

  const progressByCourse = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of progressReq.data?.enrollments ?? []) {
      if (e.course?._id) map.set(String(e.course._id), e.progress)
    }
    return map
  }, [progressReq.data])

  const upcoming = useMemo(() => {
    const all = assignmentsReq.data?.assignments ?? []
    return [...all]
      .filter((a) => a.status !== "draft")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
  }, [assignmentsReq.data])

  const announcements = (announcementsReq.data?.announcements ?? []).slice(0, 3)
  const updates = (notificationsReq.data?.notifications ?? []).slice(0, 5)

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="rounded-lg border bg-gradient-to-r from-primary/10 to-secondary/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-balance text-2xl font-bold">
              Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""}!
            </h1>
            <p className="mt-1 text-muted-foreground">
              {isStaff
                ? "Here's what's happening across your classes."
                : "Ready to continue your learning journey?"}
            </p>
          </div>
          {selected && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current course</p>
              <p className="font-semibold text-primary">{selected.title}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {isStaff ? "My classes" : "My courses"} ({courses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {coursesLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {!coursesLoading && courses.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {isStaff
                    ? "You have no classes yet — create one from My Courses."
                    : "You're not enrolled in any courses yet."}
                </p>
              )}
              {courses.map((course) => {
                const progress = progressByCourse.get(course._id) ?? 0

                return (
                  <div
                    key={course._id}
                    className="flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => router.push(`/courses/${course._id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-medium">{course.title}</h3>
                        <Badge variant={course.status === "active" ? "default" : "secondary"}>
                          {course.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {course.instructor?.name ?? "Unassigned"}
                        {course.schedule ? ` · ${course.schedule}` : ""}
                      </p>
                      {!isStaff && (
                        <div className="mt-2 flex items-center gap-3">
                          <Progress value={progress} className="h-2 w-40" />
                          <span className="text-xs text-muted-foreground">{progress}%</span>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        select(course._id)
                        router.push(`/courses/${course._id}`)
                      }}
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      {isStaff ? "Open" : progress > 0 ? "Continue" : "Start"}
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Updates ({updates.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {updates.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing new right now.</p>
              )}
              {updates.map((update) => (
                <div
                  key={update._id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  onClick={() => router.push(update.actionUrl ?? "/updates")}
                >
                  {update.type === "grade" ? (
                    <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                  ) : update.type === "assignment" ? (
                    <FileText className="mt-0.5 h-4 w-4 text-amber-600" />
                  ) : (
                    <Megaphone className="mt-0.5 h-4 w-4 text-emerald-600" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{update.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{update.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(update.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5" />
                {isStaff ? "Upcoming deadlines" : "Due soon"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing due.</p>
              )}
              {upcoming.map((a) => {
                const overdue = new Date(a.dueDate).getTime() < Date.now()

                return (
                  <div
                    key={a._id}
                    className="cursor-pointer rounded-lg border p-3 hover:bg-muted/50"
                    onClick={() => router.push(`/assignments/${a._id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{a.title}</p>
                      {overdue && <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{a.course?.title}</p>
                    <p className={`text-xs ${overdue ? "text-red-600" : "text-muted-foreground"}`}>
                      {relative(a.dueDate)} · {a.points} pts
                    </p>
                  </div>
                )
              })}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/classrooms/assignments")}
              >
                All assignments
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="h-5 w-5" />
                Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.length === 0 && (
                <p className="text-sm text-muted-foreground">No announcements yet.</p>
              )}
              {announcements.map((a) => (
                <div
                  key={a._id}
                  className="cursor-pointer rounded-lg border p-3 hover:bg-muted/50"
                  onClick={() => router.push("/announcements")}
                >
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{a.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.author?.name ?? "Unknown"} ·{" "}
                    {new Date(a.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </p>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/announcements")}
              >
                All announcements
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
