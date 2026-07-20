"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, Users, Play } from "lucide-react"
import { getCourses } from "@/lib/database"
import { useRouter } from "next/navigation"

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    setCourses(getCourses())
  }, [])

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-emerald-600">My Courses</h1>
        <p className="text-muted-foreground">Manage and access all your enrolled courses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleCourseClick(course.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <BookOpen className="h-6 w-6 text-emerald-600" />
                <Badge variant={course.status === "active" ? "default" : "secondary"}>{course.status}</Badge>
              </div>
              <CardTitle className="text-lg">{course.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{course.description}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>{course.instructor}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{course.schedule}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${course.progress}%` }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">{course.progress}%</span>
                </div>
              </div>

              <Button className="w-full mt-4" onClick={() => handleCourseClick(course.id)}>
                <Play className="h-4 w-4 mr-2" />
                Continue Learning
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
