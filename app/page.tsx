"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Calendar, Clock, Megaphone, TrendingUp, Users } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { useCourses } from "@/components/context/course-context"
import { useRole } from "@/components/context/role-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Announcement } from "@/components/announcements/announcement-board"

interface EnrollmentProgress {
  course?: { _id: string } | null
  progress: number
  status: string
}

interface CalendarItem {
  _id: string
  title: string
  start: string
  type: string
  source: "event" | "assignment"
  course?: { title?: string } | null
}

/**
 * The campus home page.
 *
 * Was a fixed set of invented classes and events shown to everyone; it now
 * shows the signed-in person's own classes, what's coming up, and the
 * announcements aimed at them.
 */
export default function CampusHomePage() {
  const router = useRouter()
  const { userName, isTeacher, isAdmin, isParent } = useRole()
  const { courses, isLoading: coursesLoading } = useCourses()
  const isStaff = isTeacher || isAdmin

  const progressReq = useApi<{ enrollments: EnrollmentProgress[] }>(
    isStaff ? null : "/api/enrollments/me",
  )
  const announcementsReq = useApi<{ announcements: Announcement[] }>("/api/announcements")

  // The next fortnight, which is what "coming up" usefully means.
  const window = useMemo(() => {
    const from = new Date()
    const to = new Date()
    to.setDate(to.getDate() + 14)
    return { from: from.toISOString(), to: to.toISOString() }
  }, [])
  const eventsReq = useApi<{ events: CalendarItem[]; deadlines: CalendarItem[] }>(
    `/api/events?from=${window.from}&to=${window.to}`,
  )

  const progressByCourse = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of progressReq.data?.enrollments ?? []) {
      if (e.course?._id) map.set(String(e.course._id), e.progress)
    }
    return map
  }, [progressReq.data])

  const upcoming = useMemo(
    () =>
      [...(eventsReq.data?.events ?? []), ...(eventsReq.data?.deadlines ?? [])]
        .sort((a, b) => +new Date(a.start) - +new Date(b.start))
        .slice(0, 6),
    [eventsReq.data],
  )

  const announcements = (announcementsReq.data?.announcements ?? []).slice(0, 4)

  const current = courses.filter((c) => c.status === "active")
  const other = courses.filter((c) => c.status !== "active")

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 p-8 text-white">
        <h1 className="mb-2 text-3xl font-bold">
          Welcome{userName ? `, ${userName.split(" ")[0]}` : " to Campus Portal"}
        </h1>
        <p className="text-lg text-emerald-100">
          {isParent
            ? "Your children's classes, progress and school news"
            : isStaff
              ? "Your classes, what's coming up, and school news"
              : "Your gateway to academic success and campus life"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  <span>{isStaff ? "My classes" : "My courses"}</span>
                </CardTitle>
                <CardDescription>
                  {coursesLoading
                    ? "Loading…"
                    : `${courses.length} in total, ${current.length} active`}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push("/courses")}>
                View all
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {!coursesLoading && courses.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {isStaff
                    ? "You have no classes yet — create one from My Courses."
                    : "You're not enrolled in any courses yet."}
                </p>
              )}

              {current.length > 0 && (
                <div>
                  <h4 className="mb-3 font-semibold text-emerald-600">Current</h4>
                  <div className="space-y-3">
                    {current.map((course) => {
                      const progress = progressByCourse.get(course._id) ?? 0

                      return (
                        <button
                          type="button"
                          key={course._id}
                          className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                          onClick={() => router.push(`/courses/${course._id}`)}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-medium">{course.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {course.instructor?.name ?? "Unassigned"}
                                {course.schedule ? ` · ${course.schedule}` : ""}
                                {course.room ? ` · Room ${course.room}` : ""}
                              </p>
                            </div>
                            <Badge>{course.subject}</Badge>
                          </div>
                          {!isStaff && (
                            <div className="mt-3 flex items-center gap-3">
                              <Progress value={progress} className="h-2 flex-1" />
                              <span className="text-xs text-muted-foreground">{progress}%</span>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {other.length > 0 && (
                <div>
                  <h4 className="mb-3 font-semibold text-muted-foreground">Other</h4>
                  <div className="space-y-2">
                    {other.map((course) => (
                      <button
                        type="button"
                        key={course._id}
                        className="flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm hover:bg-muted/50"
                        onClick={() => router.push(`/courses/${course._id}`)}
                      >
                        <span>{course.title}</span>
                        <Badge variant="secondary">{course.status}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Megaphone className="h-5 w-5 text-emerald-600" />
                  <span>Announcements</span>
                </CardTitle>
                <CardDescription>News from the school and your classes</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push("/announcements")}>
                View all
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing posted yet.</p>
              )}
              {announcements.map((announcement) => (
                <button
                  type="button"
                  key={announcement._id}
                  className="w-full rounded-lg border p-3 text-left hover:bg-muted/50"
                  onClick={() => router.push("/announcements")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{announcement.title}</p>
                    {announcement.priority === "high" && (
                      <Badge variant="destructive">Important</Badge>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {announcement.content}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {announcement.author?.name ?? "Unknown"} ·{" "}
                    {new Date(announcement.createdAt).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <span>Coming up</span>
              </CardTitle>
              <CardDescription>The next two weeks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
              )}
              {upcoming.map((item) => (
                <button
                  type="button"
                  key={`${item.source}-${item._id}`}
                  className="w-full rounded-lg border p-3 text-left hover:bg-muted/50"
                  onClick={() =>
                    router.push(item.source === "assignment" ? `/assignments/${item._id}` : "/calendar")
                  }
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(item.start).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  {item.course?.title && (
                    <p className="text-xs text-muted-foreground">{item.course.title}</p>
                  )}
                </button>
              ))}
              <Button variant="outline" className="w-full" onClick={() => router.push("/calendar")}>
                Open the calendar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/performance")}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Performance
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/campus/studies/skills-report")}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Skills report
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/messages")}
              >
                <Users className="mr-2 h-4 w-4" />
                Messages
              </Button>
              {isParent && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/family")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  My family
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
