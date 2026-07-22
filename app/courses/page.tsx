"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, Users, Play } from "lucide-react"
import { useRouter } from "next/navigation"

import { useApi } from "@/hooks/use-api"
import { AsyncState } from "@/components/ui/async-state"
import { useRole } from "@/components/context/role-context"
import { CreateCourseDialog } from "@/components/courses/create-course-dialog"

interface CourseListItem {
  _id: string
  title: string
  description?: string
  subject: string
  status: string
  schedule?: string
  instructor?: { name?: string } | null
  enrolledCount?: number
  maxStudents?: number
}

export default function CoursesPage() {
  const router = useRouter()
  const { isTeacher, isAdmin } = useRole()
  const { data, error, isLoading, refetch } = useApi<{ courses: CourseListItem[] }>("/api/courses")
  const courses = data?.courses ?? []

  const openCourse = (id: string) => router.push(`/courses/${id}`)
  const canManage = isTeacher || isAdmin

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">
            {canManage ? "My Courses" : "My Courses"}
          </h1>
          <p className="text-muted-foreground">
            {canManage
              ? "Courses you teach. Create a course to add modules and lessons."
              : "Manage and access all your enrolled courses"}
          </p>
        </div>
        {canManage && <CreateCourseDialog onCreated={refetch} />}
      </div>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={courses.length === 0}
        emptyMessage="You have no courses yet."
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card
              key={course._id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openCourse(course._id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <BookOpen className="h-6 w-6 text-emerald-600" />
                  <Badge variant={course.status === "active" ? "default" : "secondary"}>
                    {course.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{course.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {course.description ?? course.subject}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>{course.instructor?.name ?? "Unassigned"}</span>
                  </div>
                  {course.schedule && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{course.schedule}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {course.enrolledCount ?? 0}
                      {course.maxStudents ? ` / ${course.maxStudents}` : ""} enrolled
                    </span>
                  </div>
                </div>

                <Button className="w-full mt-4" onClick={() => openCourse(course._id)}>
                  <Play className="h-4 w-4 mr-2" />
                  Open Course
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncState>
    </div>
  )
}
