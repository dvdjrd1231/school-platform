"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Video, FileText, CheckCircle, PlayCircle, ArrowLeft, ArrowRight, Clock } from "lucide-react"
import Link from "next/link"

interface ModuleContentProps {
  moduleId: string
}

export function ModuleContent({ moduleId }: ModuleContentProps) {
  // This would typically fetch data based on moduleId
  const moduleData = {
    id: moduleId,
    title: "Linear Equations",
    description: "Master the fundamentals of linear equations and their applications",
    progress: 75,
    totalLessons: 4,
    completedLessons: 3,
    estimatedTime: "3 hours",
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Module Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/content">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Content
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-balance">{moduleData.title}</h1>
            <p className="text-muted-foreground">{moduleData.description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <Progress value={moduleData.progress} className="w-24" />
            <span className="text-sm font-medium">{moduleData.progress}%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {moduleData.completedLessons} of {moduleData.totalLessons} lessons completed
          </p>
        </div>
      </div>

      {/* Module Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{moduleData.totalLessons} Lessons</p>
                <p className="text-xs text-muted-foreground">Total content</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{moduleData.estimatedTime}</p>
                <p className="text-xs text-muted-foreground">Estimated time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">{moduleData.completedLessons} Completed</p>
                <p className="text-xs text-muted-foreground">Lessons done</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">2 Videos</p>
                <p className="text-xs text-muted-foreground">Video content</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lesson List */}
      <Card>
        <CardHeader>
          <CardTitle>Module Lessons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              id: 1,
              title: "Introduction to Linear Equations",
              type: "video",
              duration: "25 min",
              completed: true,
              description: "Learn the basic concepts and definitions of linear equations",
            },
            {
              id: 2,
              title: "Solving Linear Equations",
              type: "reading",
              duration: "15 min",
              completed: true,
              description: "Step-by-step methods for solving linear equations",
            },
            {
              id: 3,
              title: "Graphing Linear Equations",
              type: "video",
              duration: "30 min",
              completed: false,
              current: true,
              description: "Visual representation of linear equations on coordinate planes",
            },
            {
              id: 4,
              title: "Practice Problems",
              type: "assignment",
              duration: "45 min",
              completed: false,
              description: "Apply your knowledge with hands-on practice problems",
            },
          ].map((lesson) => (
            <div
              key={lesson.id}
              className={`p-4 border rounded-lg ${lesson.current ? "border-primary bg-primary/5" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                    {lesson.type === "video" && <Video className="h-5 w-5" />}
                    {lesson.type === "reading" && <BookOpen className="h-5 w-5" />}
                    {lesson.type === "assignment" && <FileText className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="font-medium">{lesson.title}</h3>
                    <p className="text-sm text-muted-foreground mb-1">{lesson.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="capitalize">{lesson.type}</span>
                      <span>{lesson.duration}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {lesson.completed && (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                  {lesson.current && <Badge variant="default">Current</Badge>}
                  <Button size="sm" variant={lesson.current ? "default" : "outline"}>
                    {lesson.type === "video" && <PlayCircle className="h-4 w-4 mr-2" />}
                    {lesson.completed ? "Review" : lesson.current ? "Continue" : "Start"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous Module
        </Button>
        <Button>
          Next Module
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
