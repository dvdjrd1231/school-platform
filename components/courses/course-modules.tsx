"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Clock,
  Users,
  Play,
  Lock,
  CheckCircle,
  Video,
  FileText,
  Brain,
  HelpCircle,
  PenTool,
  ArrowLeft,
} from "lucide-react"
import { useRouter } from "next/navigation"
import type { Course, Module } from "@/lib/database"

interface CourseModulesProps {
  course: Course
  modules: Module[]
}

export default function CourseModules({ course, modules }: CourseModulesProps) {
  const router = useRouter()
  const [expandedModule, setExpandedModule] = useState<number | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "in-progress":
        return <Play className="h-5 w-5 text-emerald-600" />
      case "locked":
        return <Lock className="h-5 w-5 text-gray-400" />
      default:
        return <BookOpen className="h-5 w-5 text-emerald-600" />
    }
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />
      case "reading":
        return <FileText className="h-4 w-4" />
      case "interactive":
        return <Brain className="h-4 w-4" />
      case "quiz":
        return <HelpCircle className="h-4 w-4" />
      case "assignment":
        return <PenTool className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const handleLessonClick = (moduleId: number, lessonId: number) => {
    router.push(`/courses/${course.id}/modules/${moduleId}/lessons/${lessonId}`)
  }

  return (
    <div className="container mx-auto p-6">
      {/* Course Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/courses")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>

        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-6 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-emerald-800 mb-2">{course.title}</h1>
              <p className="text-emerald-700 mb-4">{course.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm">{course.instructor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm">{course.schedule}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm">{modules.length} Modules</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Course Progress</span>
                    <span className="text-sm text-emerald-600">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
                <Badge variant={course.status === "active" ? "default" : "secondary"}>{course.status}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Course Modules</h2>

        {modules.map((module) => (
          <Card key={module.id} className="overflow-hidden">
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(module.status)}
                  <div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{module.progress}%</div>
                    <div className="text-xs text-muted-foreground">{module.totalDuration}</div>
                  </div>
                  <Progress value={module.progress} className="w-20 h-2" />
                </div>
              </div>
            </CardHeader>

            {expandedModule === module.id && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {module.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        lesson.locked ? "bg-gray-50 cursor-not-allowed" : "hover:bg-emerald-50 cursor-pointer"
                      }`}
                      onClick={() => !lesson.locked && handleLessonClick(module.id, lesson.id)}
                    >
                      <div className="flex items-center gap-3">
                        {lesson.completed ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : lesson.locked ? (
                          <Lock className="h-4 w-4 text-gray-400" />
                        ) : (
                          getLessonIcon(lesson.type)
                        )}
                        <div>
                          <div className="font-medium text-sm">{lesson.title}</div>
                          <div className="text-xs text-muted-foreground">{lesson.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {lesson.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
