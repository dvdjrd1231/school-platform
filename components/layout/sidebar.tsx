"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, BookOpen, Calendar, CheckCircle, ChevronRight, FileText, Lock, Megaphone, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { useApi } from "@/hooks/use-api"
import { useCourses } from "@/components/context/course-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ApiCourseDetail } from "@/components/courses/course-modules"

const sidebarItems = [
  { title: "My Courses", href: "/courses", icon: BookOpen },
  { title: "My Surveys", href: "/surveys", icon: FileText },
  { title: "Updates", href: "/updates", icon: BarChart3 },
  { title: "Announcements", href: "/announcements", icon: Megaphone },
  { title: "Calendar", href: "/calendar", icon: Calendar },
  { title: "Instructor Profile", href: "/instructor", icon: User },
]

/**
 * Classroom sidebar: pick a course, jump around the app, and see that course's
 * real table of contents with your own progress on it.
 */
export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { courses, selectedId, select, isLoading } = useCourses()

  // The contents list needs the module tree, which the summary list omits.
  const detail = useApi<ApiCourseDetail>(selectedId ? `/api/courses/${selectedId}` : null)
  const course = detail.data

  const lessons = (course?.modules ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap((m) => [...m.lessons].sort((a, b) => a.order - b.order).map((l) => ({ module: m, lesson: l })))

  const completed = new Set(course?.viewer.completedLessonIds ?? [])
  const canEdit = course?.viewer.canEdit ?? false

  const unlocked = (index: number) =>
    canEdit || index === 0 || lessons.slice(0, index).every((e) => completed.has(e.lesson._id))

  return (
    <aside className="min-h-screen w-64 border-r bg-sidebar">
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Select a course</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No courses yet.{" "}
                <Link href="/courses" className="underline">
                  Create one
                </Link>
                .
              </p>
            ) : (
              <Select value={selectedId ?? undefined} onValueChange={select}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn("w-full justify-between text-left", isActive && "bg-sidebar-accent")}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{item.title}</span>
                  </div>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            )
          })}
        </nav>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4" />
              Table of contents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {!selectedId && <p className="text-xs text-muted-foreground">Pick a course first.</p>}
            {selectedId && detail.isLoading && (
              <p className="text-xs text-muted-foreground">Loading…</p>
            )}
            {selectedId && !detail.isLoading && lessons.length === 0 && (
              <p className="text-xs text-muted-foreground">This course has no lessons yet.</p>
            )}

            <div className="space-y-1 text-xs">
              {lessons.map((entry, i) => {
                const isDone = completed.has(entry.lesson._id)
                const open = unlocked(i)

                return (
                  <button
                    type="button"
                    key={entry.lesson._id}
                    disabled={!open}
                    onClick={() => router.push(`/courses/${selectedId}/lessons/${entry.lesson._id}`)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded p-1 text-left transition-colors",
                      open ? "hover:bg-accent" : "cursor-not-allowed text-muted-foreground/60",
                    )}
                  >
                    <span className="truncate">{entry.lesson.title}</span>
                    {isDone ? (
                      <CheckCircle className="h-3 w-3 shrink-0 text-green-600" />
                    ) : !open ? (
                      <Lock className="h-3 w-3 shrink-0" />
                    ) : (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {entry.lesson.type}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  )
}
